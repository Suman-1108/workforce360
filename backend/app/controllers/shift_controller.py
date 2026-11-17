from typing import Optional
from sqlalchemy.orm import Session
from app.services.shift_service import shift_service, ShiftService
from app.schemas.shift_schema import (
    ShiftCreate,
    ShiftUpdate,
    ShiftAssignmentCreate,
)
from app.utils.response import success_response


class ShiftController:
    """Controller layer handling HTTP request/response orchestration for Shifts."""

    def __init__(self, service: ShiftService = shift_service):
        self.service = service

    def list_shifts(
        self,
        db: Session,
        tenant_id: int,
        is_active: Optional[bool] = None,
        shift_type: Optional[str] = None,
        search: Optional[str] = None,
    ):
        result = self.service.list_shifts(
            db=db,
            tenant_id=tenant_id,
            is_active=is_active,
            shift_type=shift_type,
            search=search,
        )
        return success_response(
            data=result.model_dump(),
            message="Shifts retrieved successfully.",
        )

    def get_shift(self, db: Session, tenant_id: int, shift_id: int):
        result = self.service.get_shift(db=db, tenant_id=tenant_id, shift_id=shift_id)
        return success_response(
            data=result.model_dump(),
            message="Shift details retrieved.",
        )

    def create_shift(self, db: Session, tenant_id: int, data: ShiftCreate):
        result = self.service.create_shift(db=db, tenant_id=tenant_id, data=data)
        return success_response(
            data=result.model_dump(),
            message="Shift created successfully.",
        )

    def update_shift(
        self, db: Session, tenant_id: int, shift_id: int, data: ShiftUpdate
    ):
        result = self.service.update_shift(
            db=db, tenant_id=tenant_id, shift_id=shift_id, data=data
        )
        return success_response(
            data=result.model_dump(),
            message="Shift updated successfully.",
        )

    def delete_shift(self, db: Session, tenant_id: int, shift_id: int):
        self.service.delete_shift(db=db, tenant_id=tenant_id, shift_id=shift_id)
        return success_response(
            data=None,
            message="Shift deleted successfully.",
        )

    def assign_shift(self, db: Session, tenant_id: int, data: ShiftAssignmentCreate):
        result = self.service.assign_shift(db=db, tenant_id=tenant_id, data=data)
        return success_response(
            data=result.model_dump(),
            message="Shift assigned to employee successfully.",
        )

    def list_assignments(
        self,
        db: Session,
        tenant_id: int,
        shift_id: Optional[int] = None,
        employee_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 50,
    ):
        result = self.service.list_assignments(
            db=db,
            tenant_id=tenant_id,
            shift_id=shift_id,
            employee_id=employee_id,
            page=page,
            page_size=page_size,
        )
        return success_response(
            data=result.model_dump(),
            message="Shift assignments retrieved successfully.",
        )

    def get_employee_active_shift(
        self, db: Session, tenant_id: int, employee_id: int
    ):
        result = self.service.get_employee_active_shift(
            db=db, tenant_id=tenant_id, employee_id=employee_id
        )
        return success_response(
            data=result.model_dump(),
            message="Employee active shift retrieved.",
        )


shift_controller = ShiftController()
