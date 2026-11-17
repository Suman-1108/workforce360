from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str
    tenant_id: Optional[int] = None


class UserOut(UserBase):
    id: int
    tenant_id: Optional[int] = None
    is_active: bool
    is_verified: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
