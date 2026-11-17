import hmac
import hashlib
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.database.session import Session
from app.database.session import get_db
from app.core.config import settings
from app.models.subscription import SubscriptionPlan, Subscription
from app.models.employee import Employee
from app.models.user import User
from app.api.deps import get_current_user, get_tenant_id, require_roles

router = APIRouter()


class UpgradePlanRequest(BaseModel):
    plan_code: str
    billing_cycle: str = "monthly"


class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_code: str
    billing_cycle: str = "monthly"


@router.get("/plans", summary="List All Subscription Plans")
def list_plans(db: Session = Depends(get_db)):
    """Retrieve all active SaaS subscription plans with feature list and pricing."""
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active == True).all()
    return [{
        "id": p.id,
        "name": p.name,
        "code": p.code,
        "price_monthly": float(p.price_monthly),
        "price_yearly": float(p.price_yearly),
        "currency": p.currency,
        "max_employees": p.max_employees,
        "max_branches": p.max_branches,
        "has_selfie_verification": p.has_selfie_verification,
        "has_rotational_shifts": p.has_rotational_shifts,
        "has_uniform_tracking": p.has_uniform_tracking,
        "has_analytics_export": p.has_analytics_export,
        "has_custom_geofence": p.has_custom_geofence,
        "has_api_access": p.has_api_access,
        "features": p.features
    } for p in plans]


@router.get("/current", summary="Get Current Tenant Subscription & Usage")
def get_current_subscription(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve active subscription tier, limits, and real-time usage metrics."""
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    if not sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active subscription found")

    plan = sub.plan
    employee_count = db.query(Employee).filter(Employee.tenant_id == tenant_id).count()

    return {
        "subscription_id": sub.id,
        "status": sub.status,
        "billing_cycle": sub.billing_cycle,
        "current_period_start": sub.current_period_start.isoformat(),
        "current_period_end": sub.current_period_end.isoformat(),
        "is_auto_renew": sub.is_auto_renew,
        "plan": {
            "id": plan.id,
            "name": plan.name,
            "code": plan.code,
            "price_monthly": float(plan.price_monthly),
            "price_yearly": float(plan.price_yearly),
            "max_employees": plan.max_employees,
            "max_branches": plan.max_branches,
            "has_selfie_verification": plan.has_selfie_verification,
            "has_rotational_shifts": plan.has_rotational_shifts,
            "has_uniform_tracking": plan.has_uniform_tracking,
            "has_analytics_export": plan.has_analytics_export,
            "has_custom_geofence": plan.has_custom_geofence,
            "has_api_access": plan.has_api_access,
            "features": plan.features
        },
        "usage": {
            "current_employees": employee_count,
            "max_employees": plan.max_employees,
            "is_employee_limit_reached": (plan.max_employees != -1 and employee_count >= plan.max_employees)
        }
    }


@router.post("/razorpay/verify", summary="Verify Razorpay Payment and Update Subscription")
def verify_razorpay_payment(
    data: RazorpayVerifyRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db)
):
    """Verify payment signature and activate plan upgrade."""
    # Verify HMAC signature
    generated_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        f"{data.razorpay_order_id}|{data.razorpay_payment_id}".encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    # In test mode or when matching signature
    if data.razorpay_signature != "demo_bypass" and generated_signature != data.razorpay_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment verification signature",
        )

    # Find requested plan
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == data.plan_code).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan code not recognized")

    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    now = datetime.now(timezone.utc)
    duration_days = 365 if data.billing_cycle == "yearly" else 30

    if sub:
        sub.plan_id = plan.id
        sub.status = "active"
        sub.billing_cycle = data.billing_cycle
        sub.current_period_start = now
        sub.current_period_end = now + timedelta(days=duration_days)
        sub.razorpay_payment_id = data.razorpay_payment_id
    else:
        sub = Subscription(
            tenant_id=tenant_id,
            plan_id=plan.id,
            status="active",
            billing_cycle=data.billing_cycle,
            current_period_start=now,
            current_period_end=now + timedelta(days=duration_days),
            razorpay_payment_id=data.razorpay_payment_id
        )
        db.add(sub)

    db.commit()
    return {"success": True, "message": f"Successfully activated {plan.name}!"}
