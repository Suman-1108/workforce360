from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.subscription import Subscription
from app.models.employee import Employee
from app.core.exceptions import (
    SubscriptionLimitExceededException,
    FeatureNotEnabledException,
    ForbiddenException,
)


class EntitlementService:
    """Centralized subscription entitlement enforcement engine."""

    def get_active_subscription(self, db: Session, tenant_id: int) -> Subscription:
        """Fetch and validate tenant's current subscription."""
        sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
        if not sub:
            raise ForbiddenException("Organization has no active subscription on record.")

        if sub.status not in ["active", "trialing"]:
            raise ForbiddenException(
                f"Organization subscription is currently '{sub.status}'. Please update billing."
            )

        # Check expiration
        now = datetime.now(timezone.utc)
        period_end = sub.current_period_end
        if period_end.tzinfo is None:
            period_end = period_end.replace(tzinfo=timezone.utc)

        if now > period_end:
            raise ForbiddenException("Organization subscription term has expired. Please renew.")

        return sub

    def verify_employee_quota(self, db: Session, tenant_id: int) -> None:
        """Verify whether tenant is permitted to enroll an additional employee."""
        sub = self.get_active_subscription(db, tenant_id)
        plan = sub.plan
        if not plan:
            return

        # -1 indicates unlimited quota
        if plan.max_employees == -1:
            return

        current_count = db.query(Employee).filter(Employee.tenant_id == tenant_id).count()
        if current_count >= plan.max_employees:
            raise SubscriptionLimitExceededException(
                feature="Employees",
                limit=plan.max_employees,
                current=current_count,
                plan_name=plan.name,
            )

    def verify_feature_enabled(self, db: Session, tenant_id: int, feature_attribute: str, feature_label: str) -> None:
        """Verify whether a specialized plan capability (e.g. selfie, export, api) is enabled."""
        sub = self.get_active_subscription(db, tenant_id)
        plan = sub.plan
        if not plan:
            raise FeatureNotEnabledException(feature_label, "Trial")

        is_enabled = getattr(plan, feature_attribute, False)
        if not is_enabled:
            raise FeatureNotEnabledException(feature_label, plan.name)


entitlement_service = EntitlementService()
