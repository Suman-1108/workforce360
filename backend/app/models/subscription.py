from datetime import datetime, timezone
from app.database.mongo_odm import MongoDocument, Field, Relation


class SubscriptionPlan(MongoDocument):
    __collection__ = "subscription_plans"

    id = Field(int, primary_key=True)
    name = Field(str)
    code = Field(str)
    price_monthly = Field(float, default=0.0)
    price_yearly = Field(float, default=0.0)
    currency = Field(str, default="USD")
    max_employees = Field(int, default=25)
    max_branches = Field(int, default=1)
    has_selfie_verification = Field(bool, default=False)
    has_rotational_shifts = Field(bool, default=False)
    has_uniform_tracking = Field(bool, default=False)
    has_analytics_export = Field(bool, default=False)
    has_custom_geofence = Field(bool, default=False)
    has_api_access = Field(bool, default=False)
    features = Field(list, default=list)
    is_active = Field(bool, default=True)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))

    subscriptions = Relation("Subscription", fk_field="id", remote_field="plan_id", uselist=True)


class Subscription(MongoDocument):
    __collection__ = "subscriptions"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    plan_id = Field(int, fk_target="SubscriptionPlan")
    status = Field(str, default="active")
    billing_cycle = Field(str, default="monthly")
    current_period_start = Field(datetime, default=lambda: datetime.now(timezone.utc))
    current_period_end = Field(datetime)
    razorpay_customer_id = Field(str)
    razorpay_subscription_id = Field(str)
    razorpay_payment_id = Field(str)
    is_auto_renew = Field(bool, default=True)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tenant = Relation("Tenant", fk_field="tenant_id", remote_field="id", uselist=False)
    plan = Relation("SubscriptionPlan", fk_field="plan_id", remote_field="id", uselist=False)
