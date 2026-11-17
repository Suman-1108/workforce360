from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from app.database.session import Base


class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    status = Column(
        Enum("Present", "Late", "Half-day", "Absent", "On Leave", name="attendance_status_enum"),
        default="Present",
        nullable=False
    )
    check_in_latitude = Column(Float, nullable=True)
    check_in_longitude = Column(Float, nullable=True)
    check_in_accuracy = Column(Float, nullable=True)
    check_in_address = Column(String(255), nullable=True)
    check_in_selfie_url = Column(Text, nullable=True)

    check_out_latitude = Column(Float, nullable=True)
    check_out_longitude = Column(Float, nullable=True)
    check_out_address = Column(String(255), nullable=True)
    check_out_selfie_url = Column(Text, nullable=True)

    is_geofence_verified = Column(Boolean, default=False, nullable=False)
    work_duration_minutes = Column(Integer, default=0, nullable=False)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="attendances")
    employee = relationship("Employee", back_populates="attendances")
