from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Date, Numeric, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database.session import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_id_number = Column(String(30), nullable=False)  # e.g., EMP-1001
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="SET NULL"), nullable=True)
    designation = Column(String(100), nullable=False)
    employment_type = Column(
        Enum("Full-time", "Part-time", "Contract", "Intern", name="employment_type_enum"),
        default="Full-time",
        nullable=False
    )
    joining_date = Column(Date, default=date.today, nullable=False)
    salary = Column(Numeric(12, 2), nullable=True)
    status = Column(
        Enum("Active", "On Leave", "Suspended", "Terminated", name="employee_status_enum"),
        default="Active",
        nullable=False
    )
    emergency_contact = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="employees")
    user = relationship("User", back_populates="employee")
    department = relationship("Department", back_populates="employees")
    branch = relationship("Branch", back_populates="employees")
    attendances = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leave_requests = relationship("LeaveRequest", back_populates="employee", cascade="all, delete-orphan")
    shifts = relationship("EmployeeShift", back_populates="employee", cascade="all, delete-orphan")
    uniform_distributions = relationship("UniformDistribution", back_populates="employee", cascade="all, delete-orphan")
