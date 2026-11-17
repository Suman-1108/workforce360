from datetime import datetime, timezone
from app.database.mongo_odm import MongoDocument, Field, Relation


class TenantSetting(MongoDocument):
    __collection__ = "tenant_settings"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")

    # Address / Regional metadata
    city = Field(str, default="Chicago")
    state = Field(str, default="IL")
    country = Field(str, default="United States")

    # Attendance Settings
    require_gps = Field(bool, default=True)
    require_selfie = Field(bool, default=True)
    geofence_radius_meters = Field(int, default=500)
    grace_period_mins = Field(int, default=15)
    auto_half_day_under_hours = Field(float, default=4.0)
    strict_geofence = Field(bool, default=True)

    # Shift Settings
    default_working_hours = Field(float, default=8.5)
    break_duration_mins = Field(int, default=45)
    working_days = Field(str, default="Monday,Tuesday,Wednesday,Thursday,Friday")
    allow_overtime = Field(bool, default=True)

    # Notification Settings
    email_notifications = Field(bool, default=True)
    in_app_notifications = Field(bool, default=True)
    leave_alerts = Field(bool, default=True)
    attendance_alerts = Field(bool, default=True)
    subscription_reminders = Field(bool, default=True)

    # Security Settings
    two_factor_auth = Field(bool, default=False)
    session_timeout_mins = Field(int, default=60)

    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tenant = Relation("Tenant", fk_field="tenant_id", remote_field="id", uselist=False)
