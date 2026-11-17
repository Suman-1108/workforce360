from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base


class TenantSetting(Base):
    __tablename__ = "tenant_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)

    # Address / Regional metadata
    city = Column(String(100), default="Chicago", nullable=True)
    state = Column(String(100), default="IL", nullable=True)
    country = Column(String(100), default="United States", nullable=True)

    # Attendance Settings
    require_gps = Column(Boolean, default=True, nullable=False)
    require_selfie = Column(Boolean, default=True, nullable=False)
    geofence_radius_meters = Column(Integer, default=500, nullable=False)
    grace_period_mins = Column(Integer, default=15, nullable=False)
    auto_half_day_under_hours = Column(Float, default=4.0, nullable=False)
    strict_geofence = Column(Boolean, default=True, nullable=False)

    # Shift Settings
    default_working_hours = Column(Float, default=8.5, nullable=False)
    break_duration_mins = Column(Integer, default=45, nullable=False)
    working_days = Column(String(100), default="Monday,Tuesday,Wednesday,Thursday,Friday", nullable=False)
    allow_overtime = Column(Boolean, default=True, nullable=False)

    # Notification Settings
    email_notifications = Column(Boolean, default=True, nullable=False)
    in_app_notifications = Column(Boolean, default=True, nullable=False)
    leave_alerts = Column(Boolean, default=True, nullable=False)
    attendance_alerts = Column(Boolean, default=True, nullable=False)
    subscription_reminders = Column(Boolean, default=True, nullable=False)

    # Security Settings
    two_factor_auth = Column(Boolean, default=False, nullable=False)
    session_timeout_mins = Column(Integer, default=60, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="settings")
