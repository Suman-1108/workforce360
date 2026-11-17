from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from app.database.session import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    uuid = Column(String(36), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    subdomain = Column(String(50), unique=True, index=True, nullable=True)
    contact_email = Column(String(100), nullable=False)
    contact_phone = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    logo_url = Column(String(255), nullable=True)
    status = Column(Enum("active", "suspended", "pending_verification", name="tenant_status_enum"), default="active", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    departments = relationship("Department", back_populates="tenant", cascade="all, delete-orphan")
    branches = relationship("Branch", back_populates="tenant", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="tenant", cascade="all, delete-orphan")
    shifts = relationship("Shift", back_populates="tenant", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="tenant", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="tenant", cascade="all, delete-orphan")
    uniform_items = relationship("UniformItem", back_populates="tenant", cascade="all, delete-orphan")
    uniform_distributions = relationship("UniformDistribution", back_populates="tenant", cascade="all, delete-orphan")
    settings = relationship("TenantSetting", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
