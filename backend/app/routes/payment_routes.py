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


@router.get("/status", summary="Payment Module Health Probe")
async def payment_status():
    return {"module": "payment", "status": "active"}


@router.post("/create-order", summary="Initiate Razorpay Gateway Order")
def create_payment_order(
    data: RazorpayCheckoutRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db),
):
    """Initiate a Razorpay payment transaction order."""
    return subscription_controller.create_checkout_order(
        db=db, tenant_id=tenant_id, data=data
    )


@router.post("/verify", summary="Verify Gateway Payment Signature")
def verify_gateway_payment(
    data: RazorpayVerificationRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db),
):
    """Verify Razorpay payment signature."""
    return subscription_controller.verify_payment_and_upgrade(
        db=db, tenant_id=tenant_id, data=data
    )
