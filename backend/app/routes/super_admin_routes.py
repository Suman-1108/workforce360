import time
from datetime import date, datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel, Field
from app.database.session import Session
from app.database.connection import check_db_connection
from app.dependencies import get_db, require_roles
from app.controllers.super_admin_controller import super_admin_controller
from app.schemas.super_admin_schema import TenantStatusUpdateRequest
from app.models.user import User
from app.models.tenant import Tenant
from app.models.employee import Employee
from app.models.subscription import SubscriptionPlan, Subscription
from app.models.attendance import Attendance
from app.models.shift import Shift
from app.models.leave import LeaveRequest
from app.models.uniform import UniformItem, UniformDistribution
from app.models.notification import Notification
from app.models.department import Department
from app.models.branch import Branch
from app.core.config import settings
from app.utils.response import success_response

router = APIRouter()


class SubscriptionPlanUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=60)
    price_monthly: Optional[float] = Field(None, ge=0)
    price_yearly: Optional[float] = Field(None, ge=0)
    max_employees: Optional[int] = Field(None, ge=-1)
    max_branches: Optional[int] = Field(None, ge=-1)
    has_selfie_verification: Optional[bool] = None
    has_rotational_shifts: Optional[bool] = None
    has_uniform_tracking: Optional[bool] = None
    has_analytics_export: Optional[bool] = None
    has_custom_geofence: Optional[bool] = None
    has_api_access: Optional[bool] = None
    is_active: Optional[bool] = None
    features: Optional[List[str]] = None


@router.get("/status", summary="Super Admin Module Health Probe")
async def super_admin_health_status():
    return {"module": "super_admin", "status": "active"}


@router.get("/stats", summary="Get Platform Metrics & MRR")
def get_platform_stats(
    current_user: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db),
):
    """Fetch global platform KPIs, active customer count, and MRR."""
    return super_admin_controller.get_stats(db=db)


@router.get("/tenants", summary="List All Multi-Tenant Organizations")
def list_tenants(
    search: Optional[str] = Query(None, description="Search by organization name, subdomain, or email"),
    current_user: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db),
):
    """Retrieve all tenant organizations and their plan allocations."""
    return super_admin_controller.list_tenants(db=db, search=search)


@router.post("/tenants/{tenant_id}/status", summary="Update Tenant Operational Status")
def update_tenant_status(
    tenant_id: int,
    data: TenantStatusUpdateRequest,
    current_user: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db),
):
    """Suspend or reactivate a customer organization."""
    return super_admin_controller.update_tenant_status(
        db=db, tenant_id=tenant_id, data=data
    )


@router.get("/plans", summary="List All Subscription Plans with Subscriber Analytics")
def list_subscription_plans(
    current_user: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db),
):
    """Retrieve all SaaS subscription plans along with live tenant counts and revenue contribution."""
    plans = db.query(SubscriptionPlan).order_by(SubscriptionPlan.price_monthly.asc()).all()
    subs = db.query(Subscription).filter(Subscription.status == "active").all()

    plan_sub_counts = {}
    plan_mrr = {}
    for sub in subs:
        pid = sub.plan_id
        plan_sub_counts[pid] = plan_sub_counts.get(pid, 0) + 1
        matched_plan = next((p for p in plans if p.id == pid), None)
        if matched_plan:
            monthly_val = (
                float(matched_plan.price_yearly) / 12.0
                if str(sub.billing_cycle) == "yearly"
                else float(matched_plan.price_monthly)
            )
            plan_mrr[pid] = round(plan_mrr.get(pid, 0.0) + monthly_val, 2)

    items = []
    for p in plans:
        items.append({
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "price_monthly": float(p.price_monthly or 0.0),
            "price_yearly": float(p.price_yearly or 0.0),
            "currency": p.currency or "USD",
            "max_employees": p.max_employees,
            "max_branches": p.max_branches,
            "has_selfie_verification": bool(p.has_selfie_verification),
            "has_rotational_shifts": bool(p.has_rotational_shifts),
            "has_uniform_tracking": bool(p.has_uniform_tracking),
            "has_analytics_export": bool(p.has_analytics_export),
            "has_custom_geofence": bool(p.has_custom_geofence),
            "has_api_access": bool(p.has_api_access),
            "features": p.features or [],
            "is_active": bool(p.is_active),
            "active_subscribers": plan_sub_counts.get(p.id, 0),
            "monthly_revenue": plan_mrr.get(p.id, 0.0),
        })

    return success_response(
        data=items,
        message="Subscription plans retrieved successfully.",
    )


@router.put("/plans/{plan_id}", summary="Update Subscription Plan Pricing & Entitlements")
def update_subscription_plan(
    plan_id: int,
    data: SubscriptionPlanUpdateRequest,
    current_user: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db),
):
    """Update a SaaS subscription tier's pricing, quotas, or feature entitlements."""
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subscription plan not found")

    payload = data.model_dump(exclude_unset=True)
    for field, value in payload.items():
        setattr(plan, field, value)

    db.commit()
    db.refresh(plan)

    return success_response(
        data={
            "id": plan.id,
            "name": plan.name,
            "code": plan.code,
            "price_monthly": float(plan.price_monthly or 0.0),
            "price_yearly": float(plan.price_yearly or 0.0),
            "currency": plan.currency or "USD",
            "max_employees": plan.max_employees,
            "max_branches": plan.max_branches,
            "has_selfie_verification": bool(plan.has_selfie_verification),
            "has_rotational_shifts": bool(plan.has_rotational_shifts),
            "has_uniform_tracking": bool(plan.has_uniform_tracking),
            "has_analytics_export": bool(plan.has_analytics_export),
            "has_custom_geofence": bool(plan.has_custom_geofence),
            "has_api_access": bool(plan.has_api_access),
            "features": plan.features or [],
            "is_active": bool(plan.is_active),
        },
        message=f"Subscription plan '{plan.name}' updated successfully.",
    )


@router.get("/telemetry", summary="Live Platform & Database Telemetry")
def get_platform_telemetry(
    current_user: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db),
):
    """Retrieve live MongoDB diagnostics, collection counts, and platform operational telemetry."""
    start_ts = time.perf_counter()
    db_health = check_db_connection()
    latency_ms = round((time.perf_counter() - start_ts) * 1000, 2)

    today = date.today()

    collection_counts = {
        "tenants": db.query(Tenant).count(),
        "users": db.query(User).count(),
        "employees": db.query(Employee).count(),
        "departments": db.query(Department).count(),
        "branches": db.query(Branch).count(),
        "shifts": db.query(Shift).count(),
        "attendances": db.query(Attendance).count(),
        "leave_requests": db.query(LeaveRequest).count(),
        "uniform_items": db.query(UniformItem).count(),
        "uniform_distributions": db.query(UniformDistribution).count(),
        "subscriptions": db.query(Subscription).count(),
        "subscription_plans": db.query(SubscriptionPlan).count(),
        "notifications": db.query(Notification).count(),
    }

    punches_today = db.query(Attendance).filter(Attendance.date == today).count()
    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.status == "Pending").count()
    active_tenants = db.query(Tenant).filter(Tenant.status == "active").count()
    active_users = db.query(User).filter(User.is_active == True).count()

    # Recent user logins across platform
    recent_users = (
        db.query(User)
        .order_by(User.id.desc())
        .limit(6)
        .all()
    )
    recent_accounts = [
        {
            "id": u.id,
            "name": f"{u.first_name} {u.last_name}".strip(),
            "email": u.email,
            "role": u.role,
            "is_active": bool(u.is_active),
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
        }
        for u in recent_users
    ]

    return success_response(
        data={
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "operational" if db_health.get("connected") else "degraded",
            "database": {
                "connected": bool(db_health.get("connected")),
                "engine": db_health.get("engine", "MongoDB"),
                "name": db_health.get("database", settings.MONGODB_DB_NAME),
                "version": db_health.get("version", "unknown"),
                "ping_latency_ms": latency_ms,
                "total_collections": len(collection_counts),
                "total_documents": sum(collection_counts.values()),
            },
            "runtime": {
                "app_name": settings.APP_NAME,
                "environment": settings.APP_ENV,
                "api_prefix": settings.API_V1_STR,
                "auth_algorithm": settings.ALGORITHM,
                "rate_limit_per_min": settings.RATE_LIMIT_PER_MINUTE,
                "token_ttl_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            },
            "operations": {
                "active_tenants": active_tenants,
                "total_tenants": collection_counts["tenants"],
                "active_users": active_users,
                "total_users": collection_counts["users"],
                "total_employees": collection_counts["employees"],
                "punches_today": punches_today,
                "total_attendances": collection_counts["attendances"],
                "pending_leaves": pending_leaves,
                "active_shifts": collection_counts["shifts"],
            },
            "collections": collection_counts,
            "recent_accounts": recent_accounts,
        },
        message="Live platform telemetry retrieved.",
    )
