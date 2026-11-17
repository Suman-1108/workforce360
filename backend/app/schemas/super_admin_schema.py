from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict


class PlatformStatsResponse(BaseModel):
    """Global SaaS platform business metrics and MRR telemetry."""
    total_tenants: int
    active_tenants: int
    total_employees: int
    mrr: float
    arr: float

    model_config = ConfigDict(from_attributes=True)


class TenantOverviewResponse(BaseModel):
    """Super Admin high-level tenant organization summary."""
    id: int
    name: str
    subdomain: Optional[str] = None
    contact_email: str
    contact_phone: Optional[str] = None
    status: str
    plan_name: str
    plan_code: str
    employee_count: int = 0
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class TenantStatusUpdateRequest(BaseModel):
    """Schema for toggling tenant access state."""
    status: Literal["active", "suspended"]
