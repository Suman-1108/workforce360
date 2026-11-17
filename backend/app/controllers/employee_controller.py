from typing import Optional
from fastapi import status
from sqlalchemy.orm import Session
from app.services.employee_service import employee_service, EmployeeService
from app.schemas.employee_schema import EmployeeCreate, EmployeeUpdate
from app.utils.response import success_response


class EmployeeController:
    """Controller layer handling HTTP request/response orchestration for employees."""

    def __init__(self, service: EmployeeService = employee_service):
        self.service = service

    def list_employees(
        self,
        db: Session,
        tenant_id: int,
        department_id: Optional[int] = None,
        branch_id: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ):
        result = self.service.list_employees(
            db=db,
            tenant_id=tenant_id,
            department_id=department_id,
            branch_id=branch_id,
            status=status,
            search=search,
            page=page,
            page_size=page_size,
        )
        return success_response(data=result.model_dump(), message="Employees retrieved successfully.")

    def get_employee(self, db: Session, employee_id: int, tenant_id: int):
        result = self.service.get_employee(db=db, employee_id=employee_id, tenant_id=tenant_id)
        return success_response(data=result.model_dump(), message="Employee details retrieved.")

    def create_employee(self, db: Session, tenant_id: int, data: EmployeeCreate):
        result = self.service.create_employee(db=db, tenant_id=tenant_id, data=data)
        return success_response(
            data=result.model_dump(),
            message="Employee enrolled successfully.",
        )

    def update_employee(
        self, db: Session, employee_id: int, tenant_id: int, data: EmployeeUpdate
    ):
        result = self.service.update_employee(
            db=db, employee_id=employee_id, tenant_id=tenant_id, data=data
        )
        return success_response(data=result.model_dump(), message="Employee updated successfully.")

    def deactivate_employee(self, db: Session, employee_id: int, tenant_id: int):
        self.service.deactivate_employee(db=db, employee_id=employee_id, tenant_id=tenant_id)
        return success_response(data=None, message="Employee deactivated successfully.")


employee_controller = EmployeeController()
