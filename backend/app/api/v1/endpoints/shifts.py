from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.database.session import Session
from app.database.session import get_db
from app.models.shift import Shift, EmployeeShift
from app.models.user import User
from app.schemas.shift import ShiftCreate, ShiftOut
from app.api.deps import get_current_user, get_tenant_id, require_roles

router = APIRouter()


@router.get("", summary="List Organization Shifts")
def list_shifts(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all shifts created in this organization."""
    shifts = db.query(Shift).filter(Shift.tenant_id == tenant_id).all()
    results = []
    for s in shifts:
        assigned_count = db.query(EmployeeShift).filter(EmployeeShift.shift_id == s.id).count()
        results.append({
            "id": s.id,
            "tenant_id": s.tenant_id,
            "name": s.name,
            "code": s.code,
            "type": s.type,
            "start_time": s.start_time.strftime("%H:%M"),
            "end_time": s.end_time.strftime("%H:%M"),
            "grace_period_mins": s.grace_period_mins,
            "is_active": s.is_active,
            "assigned_count": assigned_count,
            "created_at": s.created_at.isoformat()
        })
    return results


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Shift")
def create_shift(
    data: ShiftCreate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db)
):
    """Create a new work shift for this organization."""
    new_shift = Shift(
        tenant_id=tenant_id,
        name=data.name,
        code=data.code,
        type=data.type,
        start_time=data.start_time,
        end_time=data.end_time,
        grace_period_mins=data.grace_period_mins,
        is_active=data.is_active
    )
    db.add(new_shift)
    db.commit()
    db.refresh(new_shift)

    return {
        "id": new_shift.id,
        "name": new_shift.name,
        "start_time": new_shift.start_time.strftime("%H:%M"),
        "end_time": new_shift.end_time.strftime("%H:%M"),
        "message": "Shift created successfully"
    }
