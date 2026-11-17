from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.services.attendance_service import (
    attendance_service,
    AttendanceService,
)
from app.schemas.attendance_schema import (
    PunchInRequest,
    PunchOutRequest,
)
from app.utils.response import success_response


class AttendanceController:
    """Controller layer handling HTTP request/response orchestration for Attendance & Geofencing."""

    def __init__(self, service: AttendanceService = attendance_service):
        self.service = service

    def punch_in(
        self, db: Session, tenant_id: int, current_user: User, data: PunchInRequest
    ):
        result = self.service.punch_in(
            db=db, tenant_id=tenant_id, current_user=current_user, data=data
        )
        return success_response(
            data=result.model_dump(),
            message="Punch-in registered successfully.",
        )

    def punch_out(
        self, db: Session, tenant_id: int, current_user: User, data: PunchOutRequest
    ):
        result = self.service.punch_out(
            db=db, tenant_id=tenant_id, current_user=current_user, data=data
        )
        return success_response(
            data=result.model_dump(),
            message="Punch-out registered successfully.",
        )

    def get_today_punch_status(
        self, db: Session, tenant_id: int, current_user: User, employee_id: Optional[int] = None
    ):
        result = self.service.get_today_punch_status(
            db=db, tenant_id=tenant_id, current_user=current_user, employee_id=employee_id
        )
        return success_response(
            data=result.model_dump(),
            message="Daily punch status retrieved.",
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
    ):
        result = self.service.list_attendance(
            db=db,
            tenant_id=tenant_id,
            target_date=target_date,
            employee_id=employee_id,
            status=status,
            start_date=start_date,
            end_date=end_date,
            page=page,
            page_size=page_size,
        )
        return success_response(
            data=result.model_dump(),
            message="Attendance records retrieved successfully.",
        )


attendance_controller = AttendanceController()
