from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.database.session import Session
from app.dependencies import get_db, get_current_user, require_roles, get_tenant_id
from app.controllers.attendance_controller import attendance_controller
from app.schemas.attendance_schema import (
    PunchInRequest,
    PunchOutRequest,
)
from app.models.user import User

router = APIRouter()


@router.get("/status", summary="Attendance Module Health Probe")
async def attendance_health_status():
    return {"module": "attendance", "status": "active"}


@router.get("/today", summary="Get Today Punch Status")
def get_today_punch_status(
    employee_id: Optional[int] = Query(None, description="Optional employee ID filter for managers"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve current employee's daily punch-in state, active shift, and facility branch."""
    return attendance_controller.get_today_punch_status(
        db=db, tenant_id=tenant_id, current_user=current_user, employee_id=employee_id
    )


@router.post("/punch-in", status_code=status.HTTP_201_CREATED, summary="Biometric / GPS Punch-In")
def punch_in(
    data: PunchInRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record GPS punch-in with branch geofence boundary verification."""
    return attendance_controller.punch_in(
        db=db, tenant_id=tenant_id, current_user=current_user, data=data
    )


@router.post("/punch-out", summary="GPS Punch-Out & Shift Duration Completion")
def punch_out(
    data: PunchOutRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record employee departure punch-out and calculate total shift duration."""
    return attendance_controller.punch_out(
        db=db, tenant_id=tenant_id, current_user=current_user, data=data
    )


@router.post("/reset-today", summary="Reset today's punch for testing/demo")
def reset_today_punch(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allows an employee or manager to reset today's attendance punch for demo and testing purposes."""
    from app.models.employee import Employee
    from app.models.attendance import Attendance
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        return {"success": False, "message": "Employee profile not found"}
    today = date.today()
    deleted = db.query(Attendance).filter(
        Attendance.tenant_id == tenant_id,
        Attendance.employee_id == emp.id,
        Attendance.date == today
    ).delete()
    db.commit()
    return {"success": True, "message": f"Reset {deleted} attendance record(s) for today."}


@router.get("", summary="List Attendance Logs")
def list_attendance(
    target_date: Optional[date] = Query(None, alias="date", description="Filter by exact date (YYYY-MM-DD)"),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    status: Optional[str] = Query(None, description="Filter by Present, Late, Half-day, Absent, On Leave"),
    start_date: Optional[date] = Query(None, description="Start date for range query"),
    end_date: Optional[date] = Query(None, description="End date for range query"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve historical or daily attendance telemetry for the organization."""
    return attendance_controller.list_attendance(
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
