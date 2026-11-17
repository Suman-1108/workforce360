from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, require_roles, get_tenant_id
from app.controllers.shift_controller import shift_controller
from app.schemas.shift_schema import (
    ShiftCreate,
    ShiftUpdate,
    ShiftAssignmentCreate,
)
from app.models.user import User

router = APIRouter()


@router.get("/status", summary="Shift Module Health Probe")
async def shift_status():
    return {"module": "shift", "status": "active"}


@router.get("", summary="List Shift Configurations")
def list_shifts(
    is_active: Optional[bool] = Query(None, description="Filter active shifts"),
    shift_type: Optional[str] = Query(None, description="Filter by Morning, Day, Evening, Night, Rotational"),
    search: Optional[str] = Query(None, description="Search by shift name or code"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all shift schedules defined for the organization."""
    return shift_controller.list_shifts(
        db=db,
        tenant_id=tenant_id,
        is_active=is_active,
        shift_type=shift_type,
        search=search,
    )


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Shift Schedule")
def create_shift(
    data: ShiftCreate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Define a new operational shift."""
    return shift_controller.create_shift(db=db, tenant_id=tenant_id, data=data)


@router.get("/assignments", summary="List Employee Shift Assignments")
def list_shift_assignments(
    shift_id: Optional[int] = Query(None, description="Filter by shift ID"),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve roster allocations and employee shift assignments."""
    return shift_controller.list_assignments(
        db=db,
        tenant_id=tenant_id,
        shift_id=shift_id,
        employee_id=employee_id,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/assignments",
    status_code=status.HTTP_201_CREATED,
    summary="Assign Shift to Employee",
)
def assign_shift(
    data: ShiftAssignmentCreate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Assign an employee to a shift schedule with automatic rotation cutoff."""
    return shift_controller.assign_shift(db=db, tenant_id=tenant_id, data=data)


@router.get("/employee/{employee_id}", summary="Get Employee Active Shift")
def get_employee_active_shift(
    employee_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve active shift schedule assigned to a specific employee."""
    return shift_controller.get_employee_active_shift(
        db=db, tenant_id=tenant_id, employee_id=employee_id
    )


@router.get("/{shift_id}", summary="Get Shift Details")
def get_shift(
    shift_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch individual shift configuration."""
    return shift_controller.get_shift(db=db, tenant_id=tenant_id, shift_id=shift_id)


@router.put("/{shift_id}", summary="Update Shift Schedule")
def update_shift(
    shift_id: int,
    data: ShiftUpdate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Modify shift timing or parameters."""
    return shift_controller.update_shift(
        db=db, tenant_id=tenant_id, shift_id=shift_id, data=data
    )


@router.delete("/{shift_id}", summary="Delete Shift Schedule")
def delete_shift(
    shift_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db),
):
    """Delete a shift if no active staff schedules are assigned."""
    return shift_controller.delete_shift(db=db, tenant_id=tenant_id, shift_id=shift_id)
