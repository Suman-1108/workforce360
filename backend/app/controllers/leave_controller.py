from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.services.leave_service import leave_service, LeaveService
from app.schemas.leave_schema import LeaveApplyRequest, LeaveActionRequest
from app.utils.response import success_response


class LeaveController:
    """Controller layer handling HTTP request/response orchestration for Leave Management."""

    def __init__(self, service: LeaveService = leave_service):
        self.service = service

    def list_leave_types(self, db: Session, tenant_id: int):
        result = self.service.list_leave_types(db=db, tenant_id=tenant_id)
        return success_response(
            data=result.model_dump(),
            message="Leave types retrieved successfully.",
        )

    def apply_leave(
        self, db: Session, tenant_id: int, current_user: User, data: LeaveApplyRequest
    ):
        result = self.service.apply_leave(
            db=db, tenant_id=tenant_id, current_user=current_user, data=data
        )
        return success_response(
            data=result.model_dump(),
            message="Leave request submitted successfully.",
        )

    def action_leave(
        self,
        db: Session,
        tenant_id: int,
        current_user: User,
        leave_id: int,
        data: LeaveActionRequest,
    ):
        result = self.service.action_leave(
            db=db,
            tenant_id=tenant_id,
            current_user=current_user,
            leave_id=leave_id,
            data=data,
        )
        return success_response(
            data=result.model_dump(),
            message=f"Leave request marked as {data.action} successfully.",
        )

    def get_leave(self, db: Session, tenant_id: int, leave_id: int):
        result = self.service.get_leave(db=db, tenant_id=tenant_id, leave_id=leave_id)
        return success_response(
            data=result.model_dump(),
            message="Leave details retrieved.",
        )

    def list_leaves(
        self,
        db: Session,
        tenant_id: int,
        current_user: User,
        employee_id: Optional[int] = None,
        status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 50,
    ):
        result = self.service.list_leaves(
            db=db,
            tenant_id=tenant_id,
            current_user=current_user,
            employee_id=employee_id,
            status=status,
            start_date=start_date,
            end_date=end_date,
            page=page,
            page_size=page_size,
        )
        return success_response(
            data=result.model_dump(),
            message="Leave requests retrieved successfully.",
        )


leave_controller = LeaveController()
