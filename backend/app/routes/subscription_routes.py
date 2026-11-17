from fastapi import APIRouter, Depends, status
from app.database.session import Session
from app.dependencies import get_db, get_current_user, require_roles, get_tenant_id
from app.controllers.subscription_controller import subscription_controller
from app.schemas.subscription_schema import (
    RazorpayCheckoutRequest,
    RazorpayVerificationRequest,
)
from app.models.user import User

router = APIRouter()


@router.get("/status", summary="Subscription Module Health Probe")
async def subscription_status():
    return {"module": "subscription", "status": "active"}


@router.get("/plans", summary="List Available Subscription Plans")
def list_plans(db: Session = Depends(get_db)):
    """Retrieve public subscription tiers and features."""
    return subscription_controller.list_plans(db=db)


@router.get("/current", summary="Get Current Tenant Subscription")
def get_current_subscription(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve caller's active subscription tier, term dates, and employee quota."""
    return subscription_controller.get_current_subscription(db=db, tenant_id=tenant_id)


@router.post("/checkout", summary="Create Checkout Order")
def create_checkout_order(
    data: RazorpayCheckoutRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db),
):
    """Generate order details for Razorpay checkout."""
    return subscription_controller.create_checkout_order(
        db=db, tenant_id=tenant_id, data=data
    )


@router.post("/razorpay/verify", summary="Verify Payment & Upgrade Plan")
def verify_payment(
    data: RazorpayVerificationRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db),
):
    """Verify cryptographic payment signature and apply subscription upgrade."""
    return subscription_controller.verify_payment_and_upgrade(
        db=db, tenant_id=tenant_id, data=data
    )


@router.get("/history", summary="Get Tenant Billing History & Invoices")
def get_billing_history(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve billing invoice history and payment transactions."""
    return subscription_controller.get_billing_history(db=db, tenant_id=tenant_id)


@router.post("/cancel", summary="Cancel Subscription Renewal")
def cancel_subscription(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db),
):
    """Cancel subscription auto-renewal at period end."""
    return subscription_controller.cancel_subscription(db=db, tenant_id=tenant_id)
