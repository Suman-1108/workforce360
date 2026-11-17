from datetime import date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.core.constants import EmploymentType, EmployeeStatus


class EmployeeBase(BaseModel):
    employee_id_number: str = Field(..., examples=["EMP-1001"], min_length=2, max_length=30)
    designation: str = Field(..., examples=["Senior Software Engineer"], max_length=100)
    employment_type: EmploymentType = Field(default=EmploymentType.FULL_TIME)
    joining_date: date = Field(default_factory=date.today)
    department_id: Optional[int] = Field(None, examples=[1])
    branch_id: Optional[int] = Field(None, examples=[1])
    salary: Optional[float] = Field(None, examples=[85000.0], ge=0)
    status: EmployeeStatus = Field(default=EmployeeStatus.ACTIVE)
    emergency_contact: Optional[str] = Field(None, examples=["+1 (555) 999-8877"], max_length=50)


class EmployeeCreate(EmployeeBase):
    first_name: str = Field(..., examples=["Alex"], min_length=1, max_length=50)
    last_name: str = Field(..., examples=["Morgan"], min_length=1, max_length=50)
    email: EmailStr = Field(..., examples=["alex.morgan@company.com"])
    phone: Optional[str] = Field(None, examples=["+91 90897 86754", "+1 (555) 123-4567"], max_length=35)
    password: Optional[str] = Field("WorkForce@2026", min_length=8)


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    phone: Optional[str] = Field(None, max_length=35)
    designation: Optional[str] = Field(None, max_length=100)
    department_id: Optional[int] = None
    branch_id: Optional[int] = None
    employment_type: Optional[EmploymentType] = None
    salary: Optional[float] = Field(None, ge=0)
    status: Optional[EmployeeStatus] = None
    emergency_contact: Optional[str] = Field(None, max_length=50)


class EmployeeResponse(BaseModel):
    id: int
    tenant_id: int
    user_id: int
    employee_id_number: str
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    designation: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    branch_id: Optional[int] = None
    branch_name: Optional[str] = None
    employment_type: str
    joining_date: str
    salary: Optional[float] = None
    status: str
    emergency_contact: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class EmployeeListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[EmployeeResponse]
