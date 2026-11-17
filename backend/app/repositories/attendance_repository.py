from datetime import date
from typing import List, Optional, Tuple
from app.database.session import Session
from app.database.mongo_odm import and_, or_
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.user import User


class AttendanceRepository:
    """Repository managing persistence for daily employee attendance and geofence telemetry."""

    def get_by_id(
        self, db: Session, attendance_id: int, tenant_id: int
    ) -> Optional[Attendance]:
        """Fetch attendance record strictly isolated by tenant."""
        return (
            db.query(Attendance)
            .filter(Attendance.id == attendance_id, Attendance.tenant_id == tenant_id)
            .first()
        )

    def get_today_attendance(
        self, db: Session, employee_id: int, tenant_id: int, target_date: Optional[date] = None
    ) -> Optional[Attendance]:
        """Fetch attendance punch record for a specific employee on a given calendar day."""
        check_date = target_date or date.today()
        return (
            db.query(Attendance)
            .filter(
                Attendance.employee_id == employee_id,
                Attendance.tenant_id == tenant_id,
                Attendance.date == check_date,
            )
            .first()
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
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Attendance], int]:
        """Query attendance logs with date ranges, employee scoping, and pagination."""
        query = db.query(Attendance).filter(Attendance.tenant_id == tenant_id)

        if target_date:
            query = query.filter(Attendance.date == target_date)
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        if employee_id:
            query = query.filter(Attendance.employee_id == employee_id)
        if status:
            query = query.filter(Attendance.status == status)

        total = query.count()
        records = (
            query.order_by(Attendance.date.desc(), Attendance.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return records, total

    def create(self, db: Session, attendance: Attendance) -> Attendance:
        """Persist a new attendance check-in event."""
        db.add(attendance)
        db.flush()
        return attendance

    def update(self, db: Session, attendance: Attendance) -> Attendance:
        """Commit changes to an existing attendance record (e.g. punch-out)."""
        db.flush()
        return attendance


attendance_repository = AttendanceRepository()
