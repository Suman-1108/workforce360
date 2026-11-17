from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class PunchInRequest(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    address: Optional[str] = None
    selfie_url: Optional[str] = None
    notes: Optional[str] = None


class PunchOutRequest(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None
    selfie_url: Optional[str] = None
    notes: Optional[str] = None


class AttendanceOut(BaseModel):
    id: int
    tenant_id: int
    employee_id: int
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: str
    check_in_latitude: Optional[float] = None
    check_in_longitude: Optional[float] = None
    check_in_accuracy: Optional[float] = None
    check_in_address: Optional[str] = None
    check_in_selfie_url: Optional[str] = None
    check_out_latitude: Optional[float] = None
    check_out_longitude: Optional[float] = None
    check_out_address: Optional[str] = None
    check_out_selfie_url: Optional[str] = None
    is_geofence_verified: bool
    work_duration_minutes: int
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
