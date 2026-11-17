from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.leave import LeaveRequest, LeaveType
from app.models.employee import Employee
from app.models.user import User
from app.schemas.leave import LeaveRequestCreate, LeaveActionRequest
from app.api.deps import get_current_user, get_tenant_id, require_roles

router = APIRouter()


@router.get("/types", summary="Get Leave Types")
def get_leave_types(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve leave types available for this organization."""
    types = db.query(LeaveType).filter(LeaveType.tenant_id == tenant_id, LeaveType.is_active == True).all()
    return [{
        "id": t.id,
        "name": t.name,
        "code": t.code,
        "days_allowed_per_year": t.days_allowed_per_year,
        "is_carry_forward": t.is_carry_forward
    } for t in types]


@router.get("", summary="List Leave Requests")
def list_leave_requests(
    status_filter: Optional[str] = None,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List leave requests for this organization (or personal for employees)."""
    query = db.query(LeaveRequest).filter(LeaveRequest.tenant_id == tenant_id)

    if current_user.role == "employee":
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if emp:
            query = query.filter(LeaveRequest.employee_id == emp.id)
        else:
            return []

    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)

    requests = query.order_by(LeaveRequest.created_at.desc()).all()
    results = []
    for r in requests:
        emp = r.employee
        u = emp.user if emp else None
        lt = r.leave_type
        results.append({
            "id": r.id,
            "employee_id": r.employee_id,
            "employee_name": f"{u.first_name} {u.last_name}" if u else "Unknown",
            "employee_id_number": emp.employee_id_number if emp else "",
            "leave_type_name": lt.name if lt else "General Leave",
            "start_date": r.start_date.isoformat(),
            "end_date": r.end_date.isoformat(),
            "total_days": r.total_days,
            "reason": r.reason,
            "status": r.status,
            "rejection_reason": r.rejection_reason,
            "created_at": r.created_at.isoformat()
        })
    return results


@router.post("", status_code=status.HTTP_201_CREATED, summary="Submit Leave Request")
def submit_leave_request(
    data: LeaveRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Employee submits a new leave application."""
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No employee profile found")

    total_days = (data.end_date - data.start_date).days + 1
    if total_days <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End date must be on or after start date")

    leave_req = LeaveRequest(
        tenant_id=emp.tenant_id,
        employee_id=emp.id,
        leave_type_id=data.leave_type_id,
        start_date=data.start_date,
        end_date=data.end_date,
        total_days=total_days,
        reason=data.reason,
        status="Pending"
    )
    db.add(leave_req)
    db.commit()
    db.refresh(leave_req)

    return {"id": leave_req.id, "status": "Pending", "message": "Leave application submitted successfully"}


@router.post("/{leave_id}/action", summary="Approve or Reject Leave Request")
def action_leave_request(
    leave_id: int,
    data: LeaveActionRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db)
):
    """Manager or Owner approves or rejects an employee's leave request."""
    leave_req = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.tenant_id == tenant_id
    ).first()

    if not leave_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

    if data.action not in ["Approved", "Rejected"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Action must be 'Approved' or 'Rejected'")

    leave_req.status = data.action
    leave_req.approved_by = current_user.id
    leave_req.actioned_at = datetime.now(timezone.utc)
    if data.action == "Rejected":
        leave_req.rejection_reason = data.rejection_reason

    db.commit()
    return {"id": leave_req.id, "status": leave_req.status, "message": f"Leave request marked as {leave_req.status}"}
