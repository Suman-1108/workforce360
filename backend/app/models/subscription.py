from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database.session import Base


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(50), nullable=False)  # Starter Tier, Professional Tier, Enterprise Tier
    code = Column(String(30), unique=True, index=True, nullable=False)  # starter, professional, enterprise
    price_monthly = Column(Numeric(10, 2), nullable=False, default=0.0)
    price_yearly = Column(Numeric(10, 2), nullable=False, default=0.0)
    currency = Column(String(10), default="USD", nullable=False)
    max_employees = Column(Integer, nullable=False, default=25)  # -1 for unlimited
    max_branches = Column(Integer, nullable=False, default=1)   # -1 for unlimited
    has_selfie_verification = Column(Boolean, default=False)
    has_rotational_shifts = Column(Boolean, default=False)
    has_uniform_tracking = Column(Boolean, default=False)
    has_analytics_export = Column(Boolean, default=False)
    has_custom_geofence = Column(Boolean, default=False)
    has_api_access = Column(Boolean, default=False)
    features = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    status = Column(Enum("active", "trialing", "past_due", "canceled", "incomplete", name="subscription_status_enum"), default="active", nullable=False)
    billing_cycle = Column(Enum("monthly", "yearly", name="billing_cycle_enum"), default="monthly", nullable=False)
    current_period_start = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    current_period_end = Column(DateTime, nullable=False)
    razorpay_customer_id = Column(String(100), nullable=True)
    razorpay_subscription_id = Column(String(100), nullable=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    is_auto_renew = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    tenant = relationship("Tenant", back_populates="subscription")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")
