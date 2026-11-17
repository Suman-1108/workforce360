from datetime import date, datetime, timezone, timedelta, time
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.branch import Branch
from app.models.user import User
from app.repositories.attendance_repository import (
    attendance_repository,
    AttendanceRepository,
)
from app.repositories.employee_repository import (
    employee_repository,
    EmployeeRepository,
)
from app.repositories.shift_repository import (
    shift_repository,
    ShiftRepository,
)
from app.repositories.organization_repository import (
    organization_repository,
    OrganizationRepository,
)
from app.schemas.attendance_schema import (
    PunchInRequest,
    PunchOutRequest,
    AttendanceResponse,
    AttendanceListResponse,
    TodayPunchStatusResponse,
)
from app.services.geo import verify_geofence
from app.core.exceptions import (
    NotFoundException,
    ConflictException,
    ValidationException,
    ForbiddenException,
)
from app.core.logging import logger


class AttendanceService:
    """Service orchestrating employee attendance, GPS geofence verification, and shift adherence."""

    def __init__(
        self,
        att_repo: AttendanceRepository = attendance_repository,
        emp_repo: EmployeeRepository = employee_repository,
        shift_repo: ShiftRepository = shift_repository,
        org_repo: OrganizationRepository = organization_repository,
    ):
        self.att_repo = att_repo
        self.emp_repo = emp_repo
        self.shift_repo = shift_repo
        self.org_repo = org_repo

    def _resolve_employee(
        self, db: Session, tenant_id: int, current_user: User, employee_id: Optional[int] = None
    ) -> Employee:
        """Resolve target employee from current session user or administrative override."""
        if employee_id is not None:
            if current_user.role not in ("owner", "manager", "superadmin"):
                raise ForbiddenException("Only managers or owners may record attendance for other employees.")
            emp = self.emp_repo.get_by_id(db, employee_id, tenant_id)
            if not emp:
                raise NotFoundException("Employee", employee_id)
            return emp

        # Resolve employee profile mapped to current user
        emp = self.emp_repo.get_by_user_id(db, current_user.id, tenant_id)
        if not emp:
            # Fallback for owners/superadmins without an employee row: pick first employee in tenant
            if current_user.role in ("owner", "superadmin"):
                employees, total = self.emp_repo.list_employees(db, tenant_id, limit=1)
                if employees:
                    return employees[0]
            raise ValidationException(
                "Your account is not mapped to an active employee profile. Please provide 'employee_id'."
            )
        return emp

    def _to_response(
        self, db: Session, att: Attendance, tenant_id: int
    ) -> AttendanceResponse:
        """Serialize Attendance entity into clean Pydantic response."""
        emp = att.employee
        user = emp.user if emp else None
        emp_name = f"{user.first_name} {user.last_name}".strip() if user else f"Employee #{att.employee_id}"
        badge = emp.employee_id_number if emp else "N/A"
        dept_name = emp.department.name if emp and emp.department else None
        branch = emp.branch if emp and emp.branch else None

        # Resolve shift
        assignment = self.shift_repo.get_active_assignment_for_employee(
            db, att.employee_id, tenant_id, target_date=att.date
        )
        shift_name = assignment.shift.name if assignment and assignment.shift else "Standard Day Shift"

        distance_meters = None
        if branch and att.check_in_latitude is not None and att.check_in_longitude is not None:
            _, distance_meters = verify_geofence(
                att.check_in_latitude,
                att.check_in_longitude,
                branch.latitude,
                branch.longitude,
                branch.radius_meters,
            )

        return AttendanceResponse(
            id=att.id,
            tenant_id=att.tenant_id,
            employee_id=att.employee_id,
            employee_name=emp_name,
            employee_id_number=badge,
            department_name=dept_name,
            shift_name=shift_name,
            date=att.date.isoformat(),
            check_in=att.check_in.isoformat() if att.check_in else None,
            check_out=att.check_out.isoformat() if att.check_out else None,
            status=str(att.status),
            check_in_latitude=att.check_in_latitude,
            check_in_longitude=att.check_in_longitude,
            check_in_accuracy=att.check_in_accuracy,
            check_in_address=att.check_in_address,
            check_in_selfie_url=att.check_in_selfie_url,
            check_out_latitude=att.check_out_latitude,
            check_out_longitude=att.check_out_longitude,
            check_out_address=att.check_out_address,
            check_out_selfie_url=att.check_out_selfie_url,
            is_geofence_verified=att.is_geofence_verified,
            geofence_distance_meters=distance_meters,
            geofence_branch_name=branch.name if branch else None,
            work_duration_minutes=att.work_duration_minutes,
            notes=att.notes,
            created_at=att.created_at.isoformat() if att.created_at else "",
        )

    def punch_in(
        self, db: Session, tenant_id: int, current_user: User, data: PunchInRequest
    ) -> AttendanceResponse:
        """Process GPS biometric punch-in with geofence compliance and late-arrival detection."""
        emp = self._resolve_employee(db, tenant_id, current_user, data.employee_id)
        today = date.today()

        # Check existing attendance for today
        existing = self.att_repo.get_today_attendance(db, emp.id, tenant_id, today)
        if existing and existing.check_in is not None:
            raise ConflictException(
                f"Employee '{emp.employee_id_number}' has already punched in for today ({today})."
            )

        # Geofence calculation against employee's physical branch
        branch = emp.branch
        if not branch:
            # Fallback to organization primary branch
            branches = self.org_repo.list_branches(db, tenant_id, is_active=True)
            branch = branches[0] if branches else None

        is_inside = True
        if branch:
            is_inside, _ = verify_geofence(
                data.latitude,
                data.longitude,
                branch.latitude,
                branch.longitude,
                branch.radius_meters,
            )

        # Shift timing & late calculation
        now_dt = datetime.now(timezone.utc)
        now_time = now_dt.time()
        status = "Present"

        assignment = self.shift_repo.get_active_assignment_for_employee(
            db, emp.id, tenant_id, target_date=today
        )
        if assignment and assignment.shift:
            sh = assignment.shift
            # Compute grace period cutoff
            cutoff_dt = datetime.combine(today, sh.start_time) + timedelta(minutes=sh.grace_period_mins)
            if now_time > cutoff_dt.time():
                status = "Late"

        if existing:
            # Update existing draft/record
            existing.check_in = now_dt
            existing.status = status
            existing.check_in_latitude = data.latitude
            existing.check_in_longitude = data.longitude
            existing.check_in_accuracy = data.accuracy
            existing.check_in_address = data.address
            existing.check_in_selfie_url = data.selfie_url
            existing.is_geofence_verified = is_inside
            existing.notes = data.notes
            record = self.att_repo.update(db, existing)
        else:
            record = Attendance(
                tenant_id=tenant_id,
                employee_id=emp.id,
                date=today,
                check_in=now_dt,
                status=status,
                check_in_latitude=data.latitude,
                check_in_longitude=data.longitude,
                check_in_accuracy=data.accuracy,
                check_in_address=data.address,
                check_in_selfie_url=data.selfie_url,
                is_geofence_verified=is_inside,
                notes=data.notes,
            )
            record = self.att_repo.create(db, record)

        db.commit()
        db.refresh(record)
        logger.info(
            f"Punch-in successful for employee {emp.id} (Status: {status}, Geofence Verified: {is_inside})"
        )
        return self._to_response(db, record, tenant_id)

    def punch_out(
        self, db: Session, tenant_id: int, current_user: User, data: PunchOutRequest
    ) -> AttendanceResponse:
        """Process GPS punch-out, calculate shift work duration, and assess half-day status."""
        emp = self._resolve_employee(db, tenant_id, current_user, data.employee_id)
        today = date.today()

        record = self.att_repo.get_today_attendance(db, emp.id, tenant_id, today)
        if not record or record.check_in is None:
            raise ValidationException(
                f"Cannot punch out: No active punch-in record found for employee '{emp.employee_id_number}' today."
            )

        if record.check_out is not None:
            raise ConflictException(
                f"Employee '{emp.employee_id_number}' has already punched out for today ({today})."
            )

        now_dt = datetime.now(timezone.utc)
        record.check_out = now_dt
        record.check_out_latitude = data.latitude
        record.check_out_longitude = data.longitude
        record.check_out_address = data.address
        record.check_out_selfie_url = data.selfie_url
        if data.notes:
            record.notes = f"{record.notes or ''}; Out: {data.notes}".strip("; ")

        # Compute work duration
        check_in_dt = record.check_in
        if check_in_dt.tzinfo is None:
            check_in_dt = check_in_dt.replace(tzinfo=timezone.utc)

        duration = max(1, int((now_dt - check_in_dt).total_seconds() / 60))
        record.work_duration_minutes = duration

        # If work duration is under 4 hours (240 mins), mark as Half-day
        if duration < 240 and record.status in ("Present", "Late"):
            record.status = "Half-day"

        self.att_repo.update(db, record)
        db.commit()
        db.refresh(record)
        logger.info(
            f"Punch-out successful for employee {emp.id} (Duration: {duration} mins, Final Status: {record.status})"
        )
        return self._to_response(db, record, tenant_id)

    def get_today_punch_status(
        self, db: Session, tenant_id: int, current_user: User, employee_id: Optional[int] = None
    ) -> TodayPunchStatusResponse:
        """Check employee daily status: punch-in state, shift window, and facility perimeter."""
        emp = self._resolve_employee(db, tenant_id, current_user, employee_id)
        today = date.today()

        record = self.att_repo.get_today_attendance(db, emp.id, tenant_id, today)
        att_resp = self._to_response(db, record, tenant_id) if record else None

        # Resolve shift
        assignment = self.shift_repo.get_active_assignment_for_employee(
            db, emp.id, tenant_id, target_date=today
        )
        sh = assignment.shift if assignment else None
        shift_name = sh.name if sh else "Standard Day Shift"
        shift_window = (
            f"{sh.start_time.strftime('%H:%M')} - {sh.end_time.strftime('%H:%M')}"
            if sh and sh.start_time and sh.end_time
            else "09:00 - 18:00"
        )

        branch = emp.branch
        if not branch:
            branches = self.org_repo.list_branches(db, tenant_id, is_active=True)
            branch = branches[0] if branches else None

        return TodayPunchStatusResponse(
            has_punched_in=record is not None and record.check_in is not None,
            has_punched_out=record is not None and record.check_out is not None,
            attendance=att_resp,
            shift_name=shift_name,
            shift_window=shift_window,
            branch_name=branch.name if branch else None,
            branch_radius_meters=branch.radius_meters if branch else None,
        )

    def list_attendance(
        self,
        db: Session,
        tenant_id: int,
        target_date: Optional[date] = None,
        employee_id: Optional[int] = None,
        status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> AttendanceListResponse:
        """Query historical or daily workforce attendance records."""
        skip = (page - 1) * page_size
        records, total = self.att_repo.list_attendance(
            db=db,
            tenant_id=tenant_id,
            target_date=target_date,
            employee_id=employee_id,
            status=status,
            start_date=start_date,
            end_date=end_date,
            skip=skip,
            limit=page_size,
        )
        items = [self._to_response(db, r, tenant_id) for r in records]
        return AttendanceListResponse(total=total, items=items)


attendance_service = AttendanceService()
