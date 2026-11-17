from datetime import time, date
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict


ShiftTypeLiteral = Literal["Morning", "Day", "Evening", "Night", "Rotational"]


class ShiftCreate(BaseModel):
    """Schema for shift schedule definition."""
    name: str = Field(..., min_length=2, max_length=50, examples=["Standard Day Shift"])
    code: Optional[str] = Field(None, max_length=20, examples=["DAY-01"])
    type: ShiftTypeLiteral = Field("Day", description="Shift operational cycle classification")
    start_time: time = Field(..., description="Daily start time (HH:MM:SS)", examples=["09:00:00"])
    end_time: time = Field(..., description="Daily end time (HH:MM:SS)", examples=["18:00:00"])
    grace_period_mins: int = Field(15, ge=0, le=120, description="Allowed late arrival tolerance in minutes")
    is_active: bool = Field(True, description="Whether shift is active for scheduling")


class ShiftUpdate(BaseModel):
    """Schema for modifying shift configuration."""
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    code: Optional[str] = Field(None, max_length=20)
    type: Optional[ShiftTypeLiteral] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    grace_period_mins: Optional[int] = Field(None, ge=0, le=120)
    is_active: Optional[bool] = None


class ShiftResponse(BaseModel):
    """Serialized representation of a shift."""
    id: int
    tenant_id: int
    name: str
    code: Optional[str] = None
    type: str
    start_time: str
    end_time: str
    grace_period_mins: int
    is_active: bool
    assigned_employees_count: int = 0
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class ShiftListResponse(BaseModel):
    """Collection envelope for shift configurations."""
    total: int
    items: List[ShiftResponse]


# ==========================================
# Shift Assignment Schemas
# ==========================================

class ShiftAssignmentCreate(BaseModel):
    """Schema for assigning an employee to a shift schedule."""
    employee_id: int = Field(..., description="Target employee ID")
    shift_id: int = Field(..., description="Target shift configuration ID")
    effective_date: Optional[date] = Field(None, description="Starting date of assignment (defaults to today)")
    end_date: Optional[date] = Field(None, description="Expiration date of assignment if rotational")


class ShiftAssignmentResponse(BaseModel):
    """Serialized shift assignment detail."""
    id: int
    tenant_id: int
    employee_id: int
    employee_name: str
    employee_id_number: str
    shift_id: int
    shift_name: str
    shift_type: str
    effective_date: str
    end_date: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class ShiftAssignmentListResponse(BaseModel):
    """Collection envelope for shift assignments."""
    total: int
    items: List[ShiftAssignmentResponse]
