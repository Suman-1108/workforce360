from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, require_roles, get_tenant_id
from app.controllers.organization_controller import organization_controller
from app.schemas.organization_schema import DepartmentCreate, DepartmentUpdate
from app.models.user import User

router = APIRouter()


@router.get("", summary="List Departments (Direct Route)")
def list_departments(
    search: Optional[str] = Query(None, description="Search by name, code, or manager"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all corporate departments for the current tenant."""
    return organization_controller.list_departments(db=db, tenant_id=tenant_id, search=search)


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Department (Direct Route)")
def create_department(
    data: DepartmentCreate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Provision a new department."""
    return organization_controller.create_department(db=db, tenant_id=tenant_id, data=data)


@router.get("/{department_id}", summary="Get Department Details (Direct Route)")
def get_department(
    department_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch department metadata."""
    return organization_controller.get_department(
        db=db, tenant_id=tenant_id, department_id=department_id
    )


@router.put("/{department_id}", summary="Update Department (Direct Route)")
def update_department(
    department_id: int,
    data: DepartmentUpdate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Update department information."""
    return organization_controller.update_department(
        db=db, tenant_id=tenant_id, department_id=department_id, data=data
    )


@router.delete("/{department_id}", summary="Delete Department (Direct Route)")
def delete_department(
    department_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db),
):
    """Delete department if no active employees are attached."""
    return organization_controller.delete_department(
        db=db, tenant_id=tenant_id, department_id=department_id
    )
