from sqlalchemy.orm import Session
from app.services.subscription_service import (
    subscription_service,
    SubscriptionService,
)
from app.schemas.subscription_schema import (
    RazorpayCheckoutRequest,
    RazorpayVerificationRequest,
)
from app.utils.response import success_response


class SubscriptionController:
    """Controller layer handling HTTP request/response orchestration for Subscriptions & Payments."""

    def __init__(self, service: SubscriptionService = subscription_service):
        self.service = service

    def list_plans(self, db: Session):
        result = self.service.list_plans(db=db)
        return success_response(
            data=result.model_dump(),
            message="Subscription plans retrieved successfully.",
        )

    def get_current_subscription(self, db: Session, tenant_id: int):
        result = self.service.get_current_subscription(db=db, tenant_id=tenant_id)
        return success_response(
            data=result.model_dump(),
            message="Current subscription details retrieved.",
        )

    def create_checkout_order(
        self, db: Session, tenant_id: int, data: RazorpayCheckoutRequest
    ):
        result = self.service.create_checkout_order(
            db=db, tenant_id=tenant_id, data=data
        )
        return success_response(
            data=result.model_dump(),
            message="Checkout order created successfully.",
        )

    def verify_payment_and_upgrade(
        self, db: Session, tenant_id: int, data: RazorpayVerificationRequest
    ):
        result = self.service.verify_payment_and_upgrade(
            db=db, tenant_id=tenant_id, data=data
        )
        return success_response(
            data=result.model_dump(),
            message=result.message,
        )

    def get_billing_history(self, db: Session, tenant_id: int):
        records = self.service.get_billing_history(db=db, tenant_id=tenant_id)
        return success_response(
            data=records,
            message="Billing history and invoices retrieved.",
        )

    def cancel_subscription(self, db: Session, tenant_id: int):
        result = self.service.cancel_subscription(db=db, tenant_id=tenant_id)
        return success_response(
            data=result.model_dump(),
            message="Subscription canceled successfully.",
        )


subscription_controller = SubscriptionController()
