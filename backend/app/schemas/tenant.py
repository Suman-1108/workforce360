from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


class TenantBase(BaseModel):
    name: str
    subdomain: Optional[str] = None
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None


class TenantCreate(TenantBase):
    pass


class TenantOut(TenantBase):
    id: int
    uuid: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
