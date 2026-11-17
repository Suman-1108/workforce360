from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


class SubscriptionPlanResponse(BaseModel):
    """Public details of subscription tiers and entitlements."""
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
    features: Optional[Any] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class SubscriptionPlanListResponse(BaseModel):
    total: int
    items: List[SubscriptionPlanResponse]


class CurrentSubscriptionResponse(BaseModel):
    """Detailed operational subscription state and quota consumption."""
    id: int
    tenant_id: int
    plan_id: int
    plan_name: str
    plan_code: str
    status: str
    billing_cycle: str
    current_period_start: str
    current_period_end: str
    is_auto_renew: bool
    current_employees_count: int = 0
    max_employees: int
    features: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)


class RazorpayCheckoutRequest(BaseModel):
    """Request to initiate a billing upgrade order via Razorpay."""
    plan_code: str = Field(..., description="Target subscription plan code (e.g. professional, enterprise)")
    billing_cycle: Literal["monthly", "yearly"] = Field("monthly", description="Billing recurrence window")


class RazorpayCheckoutResponse(BaseModel):
    """Order parameters required to launch Razorpay Standard Checkout modal."""
    order_id: str
    amount: float
    currency: str
    key_id: str
    plan_name: str
    plan_code: str
    billing_cycle: str


class RazorpayVerificationRequest(BaseModel):
    """Payment signature payload emitted by Razorpay Checkout."""
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_code: str
    billing_cycle: Optional[str] = "monthly"


class RazorpayVerificationResponse(BaseModel):
    """Result of signature validation and tenant subscription provisioning."""
    success: bool
    message: str
    subscription: CurrentSubscriptionResponse
