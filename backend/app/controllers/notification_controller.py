from typing import Optional
from sqlalchemy.orm import Session
from app.services.notification_service import (
    notification_service,
    NotificationService,
)
from app.utils.response import success_response


class NotificationController:
    """Controller handling notification HTTP responses."""

    def __init__(self, service: NotificationService = notification_service):
        self.service = service

    def list_notifications(
        self,
        db: Session,
        tenant_id: int,
        category: Optional[str] = None,
        unread_only: bool = False,
        page: int = 1,
        page_size: int = 20,
    ):
        result = self.service.get_notifications(
            db,
            tenant_id=tenant_id,
            category=category,
            unread_only=unread_only,
            page=page,
            page_size=page_size,
        )
        return success_response(data=result, message="Notifications retrieved successfully.")

    def get_unread_count(self, db: Session, tenant_id: int):
        count = self.service.get_unread_count(db, tenant_id=tenant_id)
        return success_response(data={"unread_count": count}, message="Unread count retrieved.")

    def mark_read(self, db: Session, tenant_id: int, notification_id: int):
        notification = self.service.mark_read(
            db, tenant_id=tenant_id, notification_id=notification_id
        )
        return success_response(data=notification, message="Notification marked as read.")

    def mark_all_read(self, db: Session, tenant_id: int):
        updated_count = self.service.mark_all_read(db, tenant_id=tenant_id)
        return success_response(
            data={"marked_read_count": updated_count},
            message=f"{updated_count} notifications marked as read.",
        )

    def delete_notification(self, db: Session, tenant_id: int, notification_id: int):
        self.service.delete_notification(
            db, tenant_id=tenant_id, notification_id=notification_id
        )
        return success_response(data=None, message="Notification deleted successfully.")


notification_controller = NotificationController()
