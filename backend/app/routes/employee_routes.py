from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.database.session import Session
from app.dependencies import get_db, get_current_user, require_roles, get_tenant_id
from app.controllers.employee_controller import employee_controller
from app.schemas.employee_schema import EmployeeCreate, EmployeeUpdate
from app.models.user import User

from app.utils.phone_utils import parse_phone_metadata

router = APIRouter()


@router.get("/validate-phone", summary="Validate and detect phone country and line type")
def validate_phone(
    phone: str = Query(..., description="Phone number to parse and analyze"),
    country: str = Query("IN", description="Default 2-letter fallback country code"),
):
    """Detect country, format, line type (mobile/landline), and validity."""
    return parse_phone_metadata(phone, country)


@router.get("", summary="List Employees (Tenant Scoped)")
def list_employees(
    department_id: Optional[int] = Query(None, description="Filter by department ID"),
    branch_id: Optional[int] = Query(None, description="Filter by branch ID"),
    status: Optional[str] = Query(None, description="Filter by employee status"),
    search: Optional[str] = Query(None, description="Search by name, email, designation, or ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all employees belonging to the caller's organization tenant."""
    return employee_controller.list_employees(
        db=db,
        tenant_id=tenant_id,
        department_id=department_id,
        branch_id=branch_id,
        status=status,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.post("", status_code=status.HTTP_201_CREATED, summary="Enroll New Employee")
def create_employee(
    data: EmployeeCreate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Enroll a new employee with entitlement quota verification."""
    return employee_controller.create_employee(db=db, tenant_id=tenant_id, data=data)


@router.get("/{employee_id}", summary="Get Employee Details")
def get_employee(
    employee_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve detailed employee record with tenant check."""
    return employee_controller.get_employee(db=db, employee_id=employee_id, tenant_id=tenant_id)


@router.put("/{employee_id}", summary="Update Employee Profile")
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Update employee details."""
    return employee_controller.update_employee(
        db=db, employee_id=employee_id, tenant_id=tenant_id, data=data
    )


@router.delete("/{employee_id}", summary="Deactivate Employee")
def deactivate_employee(
    employee_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db),
):
    """Deactivate employee record and disable user authentication."""
    return employee_controller.deactivate_employee(
        db=db, employee_id=employee_id, tenant_id=tenant_id
    )
