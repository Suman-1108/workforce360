from datetime import date, datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict


LeaveStatusLiteral = Literal["Pending", "Approved", "Rejected", "Cancelled"]
LeaveActionLiteral = Literal["Approved", "Rejected"]


class LeaveTypeResponse(BaseModel):
    """Configuration for organization leave categories."""
    id: int
    tenant_id: int
    name: str
    code: Optional[str] = None
    days_allowed_per_year: int
    is_carry_forward: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class LeaveTypeListResponse(BaseModel):
    total: int
    items: List[LeaveTypeResponse]


class LeaveApplyRequest(BaseModel):
    """Schema for employee leave application."""
    leave_type_id: int = Field(..., description="ID of the leave classification")
    start_date: date = Field(..., description="First date of leave period")
    end_date: date = Field(..., description="Last date of leave period")
    reason: str = Field(..., min_length=3, max_length=1000, description="Justification or context for time off")
    employee_id: Optional[int] = Field(None, description="Optional target employee ID if applied by manager")


class LeaveActionRequest(BaseModel):
    """Schema for manager approval or rejection."""
    action: LeaveActionLiteral = Field(..., description="'Approved' or 'Rejected'")
    rejection_reason: Optional[str] = Field(None, max_length=500, description="Required explanation when rejecting")


class LeaveResponse(BaseModel):
    """Serialized leave request details."""
    id: int
    tenant_id: int
    employee_id: int
    employee_name: str
    employee_id_number: str
    leave_type_id: int
    leave_type_name: str
    leave_type_code: Optional[str] = None
    start_date: str
    end_date: str
    total_days: int
    reason: str
    status: str
    approved_by_id: Optional[int] = None
    approved_by_name: Optional[str] = None
    rejection_reason: Optional[str] = None
    actioned_at: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class LeaveListResponse(BaseModel):
    total: int
    items: List[LeaveResponse]
