from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, require_roles, get_tenant_id
from app.controllers.leave_controller import leave_controller
from app.schemas.leave_schema import LeaveApplyRequest, LeaveActionRequest
from app.models.user import User

router = APIRouter()


@router.get("/status", summary="Leave Module Health Probe")
async def leave_status():
    return {"module": "leave", "status": "active"}


@router.get("/types", summary="List Leave Classifications")
def list_leave_types(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all operational leave categories for the tenant."""
    return leave_controller.list_leave_types(db=db, tenant_id=tenant_id)


@router.get("", summary="List Leave Requests")
def list_leaves(
    status: Optional[str] = Query(None, description="Filter by Pending, Approved, Rejected, Cancelled"),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID (Managers only)"),
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve historical and pending leave applications."""
    return leave_controller.list_leaves(
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


@router.post("", status_code=status.HTTP_201_CREATED, summary="Apply for Leave")
def apply_leave(
    data: LeaveApplyRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a formal employee time-off application."""
    return leave_controller.apply_leave(
        db=db, tenant_id=tenant_id, current_user=current_user, data=data
    )


@router.get("/{leave_id}", summary="Get Leave Request Details")
def get_leave(
    leave_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch individual leave request and approval logs."""
    return leave_controller.get_leave(db=db, tenant_id=tenant_id, leave_id=leave_id)


@router.post("/{leave_id}/action", summary="Approve or Reject Leave Application")
def action_leave(
    leave_id: int,
    data: LeaveActionRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Approve or reject a pending leave application."""
    return leave_controller.action_leave(
        db=db,
        tenant_id=tenant_id,
        current_user=current_user,
        leave_id=leave_id,
        data=data,
    )
