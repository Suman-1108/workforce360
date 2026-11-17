from datetime import date, timedelta
from typing import Optional, List
from app.database.session import Session
from app.models.shift import Shift, EmployeeShift
from app.models.employee import Employee
from app.repositories.shift_repository import shift_repository, ShiftRepository
from app.repositories.employee_repository import employee_repository, EmployeeRepository
from app.schemas.shift_schema import (
    ShiftCreate,
    ShiftUpdate,
    ShiftResponse,
    ShiftListResponse,
    ShiftAssignmentCreate,
    ShiftAssignmentResponse,
    ShiftAssignmentListResponse,
)
from app.core.exceptions import NotFoundException, ConflictException, ValidationException
from app.core.logging import logger


class ShiftService:
    """Service handling multi-tenant shift configurations and workforce schedule rotations."""

    def __init__(
        self,
        shift_repo: ShiftRepository = shift_repository,
        emp_repo: EmployeeRepository = employee_repository,
    ):
        self.shift_repo = shift_repo
        self.emp_repo = emp_repo

    # ----------------------------------------------------
    # Shift Templates
    # ----------------------------------------------------
    def _to_shift_response(
        self, db: Session, shift: Shift, tenant_id: int
    ) -> ShiftResponse:
        count = self.shift_repo.count_assigned_employees(db, shift.id, tenant_id)
        return ShiftResponse(
            id=shift.id,
            tenant_id=shift.tenant_id,
            name=shift.name,
            code=shift.code,
            type=str(shift.type),
            start_time=shift.start_time.strftime("%H:%M:%S") if shift.start_time else "09:00:00",
            end_time=shift.end_time.strftime("%H:%M:%S") if shift.end_time else "18:00:00",
            grace_period_mins=shift.grace_period_mins,
            is_active=shift.is_active,
            assigned_employees_count=count,
            created_at=shift.created_at.isoformat() if shift.created_at else "",
        )

    def list_shifts(
        self,
        db: Session,
        tenant_id: int,
        is_active: Optional[bool] = None,
        shift_type: Optional[str] = None,
        search: Optional[str] = None,
    ) -> ShiftListResponse:
        """Retrieve all defined shifts for the tenant."""
        shifts = self.shift_repo.list_shifts(
            db=db,
            tenant_id=tenant_id,
            is_active=is_active,
            shift_type=shift_type,
            search=search,
        )
        items = [self._to_shift_response(db, s, tenant_id) for s in shifts]
        return ShiftListResponse(total=len(items), items=items)

    def get_shift(self, db: Session, tenant_id: int, shift_id: int) -> ShiftResponse:
        """Fetch individual shift details."""
        shift = self.shift_repo.get_by_id(db, shift_id, tenant_id)
        if not shift:
            raise NotFoundException("Shift", shift_id)
        return self._to_shift_response(db, shift, tenant_id)

    def create_shift(
        self, db: Session, tenant_id: int, data: ShiftCreate
    ) -> ShiftResponse:
        """Create a new shift schedule template."""
        code = data.code.strip().upper() if data.code else None
        if code:
            existing = self.shift_repo.get_by_code(db, code, tenant_id)
            if existing:
                raise ConflictException(f"Shift code '{code}' already exists in your organization.")

        shift = Shift(
            tenant_id=tenant_id,
            name=data.name.strip(),
            code=code,
            type=data.type,
            start_time=data.start_time,
            end_time=data.end_time,
            grace_period_mins=data.grace_period_mins,
            is_active=data.is_active,
        )
        shift = self.shift_repo.create(db, shift)
        db.commit()
        db.refresh(shift)
        logger.info(f"Created shift '{shift.name}' ({shift.type}) for tenant {tenant_id}")
        return self._to_shift_response(db, shift, tenant_id)

    def update_shift(
        self, db: Session, tenant_id: int, shift_id: int, data: ShiftUpdate
    ) -> ShiftResponse:
        """Update existing shift schedule."""
        shift = self.shift_repo.get_by_id(db, shift_id, tenant_id)
        if not shift:
            raise NotFoundException("Shift", shift_id)

        if data.code is not None:
            new_code = data.code.strip().upper() if data.code else None
            if new_code and new_code != shift.code:
                existing = self.shift_repo.get_by_code(db, new_code, tenant_id)
                if existing and existing.id != shift_id:
                    raise ConflictException(f"Shift code '{new_code}' already exists in your organization.")
            shift.code = new_code

        if data.name is not None:
            shift.name = data.name.strip()
        if data.type is not None:
            shift.type = data.type
        if data.start_time is not None:
            shift.start_time = data.start_time
        if data.end_time is not None:
            shift.end_time = data.end_time
        if data.grace_period_mins is not None:
            shift.grace_period_mins = data.grace_period_mins
        if data.is_active is not None:
            shift.is_active = data.is_active

        self.shift_repo.update(db, shift)
        db.commit()
        db.refresh(shift)
        return self._to_shift_response(db, shift, tenant_id)

    def delete_shift(self, db: Session, tenant_id: int, shift_id: int) -> None:
        """Delete shift if no active employee assignments are attached."""
        shift = self.shift_repo.get_by_id(db, shift_id, tenant_id)
        if not shift:
            raise NotFoundException("Shift", shift_id)

        active_assignments = self.shift_repo.count_assigned_employees(db, shift_id, tenant_id)
        if active_assignments > 0:
            raise ConflictException(
                f"Cannot delete shift '{shift.name}'. {active_assignments} active employee schedules are assigned to it."
            )

        self.shift_repo.delete(db, shift)
        db.commit()
        logger.info(f"Deleted shift ID {shift_id} for tenant {tenant_id}")

    # ----------------------------------------------------
    # Workforce Schedule Assignments
    # ----------------------------------------------------
    def _to_assignment_response(
        self, assignment: EmployeeShift
    ) -> ShiftAssignmentResponse:
        emp = assignment.employee
        user = emp.user if emp else None
        emp_name = (
            f"{user.first_name} {user.last_name}".strip()
            if user
            else f"Employee #{assignment.employee_id}"
        )
        badge = emp.employee_id_number if emp else "N/A"
        sh = assignment.shift

        return ShiftAssignmentResponse(
            id=assignment.id,
            tenant_id=assignment.tenant_id,
            employee_id=assignment.employee_id,
            employee_name=emp_name,
            employee_id_number=badge,
            shift_id=assignment.shift_id,
            shift_name=sh.name if sh else "Unknown",
            shift_type=str(sh.type) if sh else "Day",
            effective_date=assignment.effective_date.isoformat(),
            end_date=assignment.end_date.isoformat() if assignment.end_date else None,
            created_at=assignment.created_at.isoformat() if assignment.created_at else "",
        )

    def assign_shift(
        self, db: Session, tenant_id: int, data: ShiftAssignmentCreate
    ) -> ShiftAssignmentResponse:
        """Assign employee to a shift schedule, smoothly rotating previous active schedules."""
        shift = self.shift_repo.get_by_id(db, data.shift_id, tenant_id)
        if not shift:
            raise NotFoundException("Shift", data.shift_id)

        emp = self.emp_repo.get_by_id(db, data.employee_id, tenant_id)
        if not emp:
            raise NotFoundException("Employee", data.employee_id)

        eff_date = data.effective_date or date.today()

        # Check existing active assignment on effective_date
        current = self.shift_repo.get_active_assignment_for_employee(
            db, data.employee_id, tenant_id, target_date=eff_date
        )
        if current and current.effective_date < eff_date:
            # Rotate previous shift by expiring it the day before
            current.end_date = eff_date - timedelta(days=1)
            self.shift_repo.create_assignment(db, current)

        assignment = EmployeeShift(
            tenant_id=tenant_id,
            employee_id=data.employee_id,
            shift_id=data.shift_id,
            effective_date=eff_date,
            end_date=data.end_date,
        )
        assignment = self.shift_repo.create_assignment(db, assignment)
        db.commit()
        db.refresh(assignment)
        logger.info(
            f"Assigned employee {data.employee_id} to shift {data.shift_id} starting {eff_date}"
        )
        return self._to_assignment_response(assignment)

    def list_assignments(
        self,
        db: Session,
        tenant_id: int,
        shift_id: Optional[int] = None,
        employee_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> ShiftAssignmentListResponse:
        """Retrieve paginated shift assignments."""
        skip = (page - 1) * page_size
        assignments, total = self.shift_repo.list_assignments(
            db=db,
            tenant_id=tenant_id,
            shift_id=shift_id,
            employee_id=employee_id,
            skip=skip,
            limit=page_size,
        )
        items = [self._to_assignment_response(a) for a in assignments]
        return ShiftAssignmentListResponse(total=total, items=items)

    def get_employee_active_shift(
        self, db: Session, tenant_id: int, employee_id: int
    ) -> ShiftResponse:
        """Retrieve active shift configuration for an employee."""
        emp = self.emp_repo.get_by_id(db, employee_id, tenant_id)
        if not emp:
            raise NotFoundException("Employee", employee_id)

        assignment = self.shift_repo.get_active_assignment_for_employee(
            db, employee_id, tenant_id
        )
        if assignment and assignment.shift:
            return self._to_shift_response(db, assignment.shift, tenant_id)

        # Fallback to default Day shift if no custom assignment exists
        shifts = self.shift_repo.list_shifts(db, tenant_id, is_active=True)
        if shifts:
            return self._to_shift_response(db, shifts[0], tenant_id)

        raise NotFoundException("Shift", f"for employee {employee_id}")


shift_service = ShiftService()
