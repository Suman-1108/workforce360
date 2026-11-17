from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class SubscriptionPlanOut(BaseModel):
    id: int
    name: str
    code: str
    price_monthly: float
    price_yearly: float
    currency: str
    max_employees: int
    max_branches: int
    has_selfie_verification: bool
    has_rotational_shifts: bool
    has_uniform_tracking: bool
    has_analytics_export: bool
    has_custom_geofence: bool
    has_api_access: bool
    features: Optional[List[str]] = None
    is_active: bool

    class Config:
        from_attributes = True


class SubscriptionOut(BaseModel):
    id: int
    tenant_id: int
    plan_id: int
    status: str
    billing_cycle: str
    current_period_start: datetime
    current_period_end: datetime
    plan: Optional[SubscriptionPlanOut] = None

    class Config:
        from_attributes = True
