from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class LeaveRequestCreate(BaseModel):
    leave_type_id: int
    start_date: date
    end_date: date
    reason: str


class LeaveActionRequest(BaseModel):
    action: str  # Approved, Rejected
    rejection_reason: Optional[str] = None


class LeaveTypeOut(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    days_allowed_per_year: int
    is_carry_forward: bool
    is_active: bool

    class Config:
        from_attributes = True


class LeaveRequestOut(BaseModel):
    id: int
    tenant_id: int
    employee_id: int
    leave_type_id: int
    start_date: date
    end_date: date
    total_days: int
    reason: str
    status: str
    approved_by: Optional[int] = None
    actioned_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    leave_type: Optional[LeaveTypeOut] = None

    class Config:
        from_attributes = True
