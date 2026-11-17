from typing import Optional
from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class TokenData(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterTenantRequest(BaseModel):
    organization_name: str
    subdomain: Optional[str] = None
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    first_name: str
    last_name: str
    password: str
    plan_code: Optional[str] = "professional"


class OTPRequest(BaseModel):
    email: EmailStr
    purpose: str = "registration"


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str
    purpose: str = "registration"


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
