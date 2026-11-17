from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.database.session import Session
from app.database.session import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.models.employee import Employee
from app.models.subscription import Subscription, SubscriptionPlan
from app.api.deps import get_current_user, require_roles

router = APIRouter()


class TenantStatusUpdate(BaseModel):
    status: str  # active, suspended


@router.get("/stats", summary="Platform Global SaaS Metrics")
def get_global_metrics(
    current_user: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db)
):
    """Calculate platform-wide SaaS metrics for Super Admin."""
    total_tenants = db.query(Tenant).count()
    active_tenants = db.query(Tenant).filter(Tenant.status == "active").count()
    total_employees = db.query(Employee).count()

    # Calculate MRR
    active_subs = db.query(Subscription).filter(Subscription.status == "active").all()
    mrr = 0.0
    for sub in active_subs:
        if sub.plan:
            if sub.billing_cycle == "monthly":
                mrr += float(sub.plan.price_monthly)
            else:
                mrr += float(sub.plan.price_yearly) / 12.0

    return {
        "total_tenants": total_tenants,
        "active_tenants": active_tenants,
        "total_employees": total_employees,
        "mrr": round(mrr, 2),
        "arr": round(mrr * 12, 2)
    }


@router.get("/tenants", summary="List All Organizations")
def list_all_tenants(
    current_user: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db)
):
    """Retrieve full list of client organizations."""
    tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).all()
    results = []
    for t in tenants:
        emp_count = db.query(Employee).filter(Employee.tenant_id == t.id).count()
        sub = t.subscription
        plan_name = sub.plan.name if sub and sub.plan else "Trial"
        sub_status = sub.status if sub else "No Subscription"
        results.append({
            "id": t.id,
            "uuid": t.uuid,
            "name": t.name,
            "subdomain": t.subdomain,
            "contact_email": t.contact_email,
            "contact_phone": t.contact_phone,
            "status": t.status,
            "employee_count": emp_count,
            "plan_name": plan_name,
            "subscription_status": sub_status,
            "created_at": t.created_at.isoformat()
        })
    return results


@router.post("/tenants/{tenant_id}/status", summary="Change Organization Status")
def update_tenant_status(
    tenant_id: int,
    data: TenantStatusUpdate,
    current_user: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db)
):
    """Activate or suspend an organization tenant."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant organization not found")

    if data.status not in ["active", "suspended", "pending_verification"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status value")

    tenant.status = data.status
    db.commit()

    return {"id": tenant.id, "status": tenant.status, "message": f"Organization is now {tenant.status}"}
