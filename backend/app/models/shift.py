from datetime import datetime, timezone, time, date
from sqlalchemy import Column, Integer, String, Time, Date, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database.session import Base


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(50), nullable=False)  # Morning Shift, Night Shift
    code = Column(String(20), nullable=True)
    type = Column(
        Enum("Morning", "Day", "Evening", "Night", "Rotational", name="shift_type_enum"),
        default="Day",
        nullable=False
    )
    start_time = Column(Time, nullable=False, default=time(9, 0))
    end_time = Column(Time, nullable=False, default=time(18, 0))
    grace_period_mins = Column(Integer, default=15, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="shifts")
    employee_shifts = relationship("EmployeeShift", back_populates="shift", cascade="all, delete-orphan")


class EmployeeShift(Base):
    __tablename__ = "employee_shifts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    shift_id = Column(Integer, ForeignKey("shifts.id", ondelete="CASCADE"), nullable=False)
    effective_date = Column(Date, default=date.today, nullable=False)
    end_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="shifts")
    shift = relationship("Shift", back_populates="employee_shifts")
