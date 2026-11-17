from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.subscription import SubscriptionPlan, Subscription
from app.models.tenant import Tenant


class SubscriptionRepository:
    """Repository managing subscription tiers, billing terms, and tenant subscriptions."""

    def list_active_plans(self, db: Session) -> List[SubscriptionPlan]:
        """Fetch all operational subscription tiers."""
        return (
            db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.is_active == True)
            .order_by(SubscriptionPlan.price_monthly.asc())
            .all()
        )

    def get_plan_by_id(
        self, db: Session, plan_id: int
    ) -> Optional[SubscriptionPlan]:
        """Fetch plan by primary ID."""
        return (
            db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.id == plan_id)
            .first()
        )

    def get_plan_by_code(
        self, db: Session, code: str
    ) -> Optional[SubscriptionPlan]:
        """Fetch plan by unique code (starter, professional, enterprise)."""
        return (
            db.query(SubscriptionPlan)
            .filter(SubscriptionPlan.code == code)
            .first()
        )

    def get_tenant_subscription(
        self, db: Session, tenant_id: int
    ) -> Optional[Subscription]:
        """Fetch current subscription binding for tenant."""
        return (
            db.query(Subscription)
            .filter(Subscription.tenant_id == tenant_id)
            .first()
        )

    def create_subscription(
        self, db: Session, sub: Subscription
    ) -> Subscription:
        """Persist new tenant subscription binding."""
        db.add(sub)
        db.flush()
        return sub

    def update_subscription(
        self, db: Session, sub: Subscription
    ) -> Subscription:
        """Commit changes to subscription tier or term."""
        db.flush()
        return sub


subscription_repository = SubscriptionRepository()
