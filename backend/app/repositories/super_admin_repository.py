from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.models.tenant import Tenant
from app.models.employee import Employee
from app.models.subscription import Subscription, SubscriptionPlan
from app.models.user import User


class SuperAdminRepository:
    """Repository handling platform-wide aggregations and tenant provisioning across all boundaries."""

    def get_platform_metrics(self, db: Session) -> Dict[str, Any]:
        """Aggregate cross-tenant platform health, headcounts, and MRR."""
        total_tenants = db.query(Tenant).count()
        active_tenants = db.query(Tenant).filter(Tenant.status == "active").count()
        total_employees = db.query(Employee).count()

        # Calculate MRR across all active tenant subscriptions
        active_subs = (
            db.query(Subscription)
            .join(SubscriptionPlan)
            .filter(Subscription.status == "active")
            .all()
        )

        mrr = 0.0
        for sub in active_subs:
            plan = sub.plan
            if not plan:
                continue
            if str(sub.billing_cycle) == "yearly":
                mrr += float(plan.price_yearly) / 12.0
            else:
                mrr += float(plan.price_monthly)

        arr = round(mrr * 12.0, 2)
        mrr = round(mrr, 2)

        return {
            "total_tenants": total_tenants,
            "active_tenants": active_tenants,
            "total_employees": total_employees,
            "mrr": mrr,
            "arr": arr,
        }

    def list_all_tenants(
        self, db: Session, search: Optional[str] = None
    ) -> List[Tenant]:
        """Fetch all tenants registered on the platform with search filtering."""
        query = db.query(Tenant)
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Tenant.name.ilike(pattern),
                    Tenant.subdomain.ilike(pattern),
                    Tenant.contact_email.ilike(pattern),
                )
            )
        return query.order_by(Tenant.id.asc()).all()

    def get_tenant_by_id(self, db: Session, tenant_id: int) -> Optional[Tenant]:
        """Fetch tenant by primary key without tenant boundary scoping."""
        return db.query(Tenant).filter(Tenant.id == tenant_id).first()

    def update_tenant(self, db: Session, tenant: Tenant) -> Tenant:
        """Commit status changes across tenant boundary."""
        db.flush()
        return tenant


super_admin_repository = SuperAdminRepository()
