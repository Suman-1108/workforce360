from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.schemas.user import UserOut


class EmployeeBase(BaseModel):
    employee_id_number: str
    department_id: Optional[int] = None
    branch_id: Optional[int] = None
    designation: str
    employment_type: str = "Full-time"
    joining_date: Optional[date] = None
    salary: Optional[float] = None
    status: str = "Active"
    emergency_contact: Optional[str] = None


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: Optional[str] = "WorkForce@2026"
    employee_id_number: str
    department_id: Optional[int] = None
    branch_id: Optional[int] = None
    designation: str
    employment_type: str = "Full-time"
    joining_date: Optional[date] = None
    salary: Optional[float] = None
    status: str = "Active"
    emergency_contact: Optional[str] = None


class EmployeeUpdate(BaseModel):
    department_id: Optional[int] = None
    branch_id: Optional[int] = None
    designation: Optional[str] = None
    employment_type: Optional[str] = None
    salary: Optional[float] = None
    status: Optional[str] = None
    emergency_contact: Optional[str] = None


class EmployeeOut(EmployeeBase):
    id: int
    tenant_id: int
    user_id: int
    user: Optional[UserOut] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
