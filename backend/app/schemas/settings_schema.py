from typing import Optional
from pydantic import BaseModel, Field


class OrganizationSettingsModel(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    contact_email: str = Field(..., max_length=100)
    contact_phone: Optional[str] = Field(None, max_length=30)
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field("Chicago", max_length=100)
    state: Optional[str] = Field("IL", max_length=100)
    country: Optional[str] = Field("United States", max_length=100)
    logo_url: Optional[str] = Field(None, max_length=255)


class AttendanceSettingsModel(BaseModel):
    require_gps: bool = Field(True)
    require_selfie: bool = Field(True)
    geofence_radius_meters: int = Field(500, ge=10, le=50000)
    grace_period_mins: int = Field(15, ge=0, le=120)
    auto_half_day_under_hours: float = Field(4.0, ge=1.0, le=12.0)
    strict_geofence: bool = Field(True)


class ShiftSettingsModel(BaseModel):
    default_working_hours: float = Field(8.5, ge=1.0, le=24.0)
    break_duration_mins: int = Field(45, ge=0, le=240)
    working_days: str = Field("Monday,Tuesday,Wednesday,Thursday,Friday")
    allow_overtime: bool = Field(True)


class NotificationSettingsModel(BaseModel):
    email_notifications: bool = Field(True)
    in_app_notifications: bool = Field(True)
    leave_alerts: bool = Field(True)
    attendance_alerts: bool = Field(True)
    subscription_reminders: bool = Field(True)


class SecuritySettingsModel(BaseModel):
    two_factor_auth: bool = Field(False)
    session_timeout_mins: int = Field(60, ge=5, le=1440)


class AllSettingsResponse(BaseModel):
    organization: OrganizationSettingsModel
    attendance: AttendanceSettingsModel
    shift: ShiftSettingsModel
    notifications: NotificationSettingsModel
    security: SecuritySettingsModel


class UpdateSettingsRequest(BaseModel):
    organization: Optional[OrganizationSettingsModel] = None
    attendance: Optional[AttendanceSettingsModel] = None
    shift: Optional[ShiftSettingsModel] = None
    notifications: Optional[NotificationSettingsModel] = None
    security: Optional[SecuritySettingsModel] = None
