from datetime import date, datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict


AttendanceStatusLiteral = Literal["Present", "Late", "Half-day", "Absent", "On Leave"]


class PunchInRequest(BaseModel):
    """Schema for employee biometric/GPS punch-in event."""
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Device GPS latitude coordinate", examples=[37.7749])
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Device GPS longitude coordinate", examples=[-122.4190])
    accuracy: Optional[float] = Field(None, ge=0.0, description="GPS accuracy in meters", examples=[5.2])
    address: Optional[str] = Field(None, max_length=255, description="Resolved reverse geocode address")
    selfie_url: Optional[str] = Field(None, description="Cloud storage URL or base64 data-url of verification selfie")
    notes: Optional[str] = Field(None, max_length=255, description="Optional employee check-in note")
    employee_id: Optional[int] = Field(None, description="Target employee ID (allowed for managers/owners)")


class PunchOutRequest(BaseModel):
    """Schema for employee punch-out event."""
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Device GPS latitude coordinate", examples=[37.7749])
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Device GPS longitude coordinate", examples=[-122.4190])
    address: Optional[str] = Field(None, max_length=255, description="Resolved reverse geocode address")
    selfie_url: Optional[str] = Field(None, description="Cloud storage URL or base64 data-url of exit selfie")
    notes: Optional[str] = Field(None, max_length=255, description="Optional employee departure note")
    employee_id: Optional[int] = Field(None, description="Target employee ID (allowed for managers/owners)")


class AttendanceResponse(BaseModel):
    """Serialized attendance record with geofence verification details."""
    id: int
    tenant_id: int
    employee_id: int
    employee_name: str
    employee_id_number: str
    department_name: Optional[str] = None
    shift_name: Optional[str] = None
    date: str
    check_in: Optional[str] = None
    check_out: Optional[str] = None
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
    geofence_distance_meters: Optional[float] = None
    geofence_branch_name: Optional[str] = None
    work_duration_minutes: int = 0
    notes: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class AttendanceListResponse(BaseModel):
    """Paginated collection envelope for attendance records."""
    total: int
    items: List[AttendanceResponse]


class TodayPunchStatusResponse(BaseModel):
    """Real-time punch status representation for employee daily lifecycle."""
    has_punched_in: bool
    has_punched_out: bool
    attendance: Optional[AttendanceResponse] = None
    shift_name: Optional[str] = None
    shift_window: Optional[str] = None
    branch_name: Optional[str] = None
    branch_radius_meters: Optional[int] = None
