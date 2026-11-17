from typing import List, Optional
from datetime import datetime, timezone
from app.database.session import Session
from app.models.notification import Notification


class NotificationRepository:
    """Multi-tenant isolated repository for notification queries."""

    def get_by_id(self, db: Session, tenant_id: int, notification_id: int) -> Optional[Notification]:
        return (
            db.query(Notification)
            .filter(Notification.id == notification_id, Notification.tenant_id == tenant_id)
            .first()
        )

    def list_notifications(
        self,
        db: Session,
        tenant_id: int,
        category: Optional[str] = None,
        unread_only: bool = False,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Notification]:
        query = db.query(Notification).filter(Notification.tenant_id == tenant_id)

        if category and category.lower() != "all":
            query = query.filter(Notification.category.ilike(category))

        if unread_only:
            query = query.filter(Notification.is_read.is_(False))

        return query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    def count_notifications(
        self,
        db: Session,
        tenant_id: int,
        category: Optional[str] = None,
        unread_only: bool = False,
    ) -> int:
        query = db.query(Notification).filter(Notification.tenant_id == tenant_id)

        if category and category.lower() != "all":
            query = query.filter(Notification.category.ilike(category))

        if unread_only:
            query = query.filter(Notification.is_read.is_(False))

        return query.count()

    def count_unread(self, db: Session, tenant_id: int) -> int:
        return (
            db.query(Notification)
            .filter(Notification.tenant_id == tenant_id, Notification.is_read.is_(False))
            .count()
        )

    def mark_as_read(self, db: Session, notification: Notification) -> Notification:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)
        return notification

    def mark_all_as_read(self, db: Session, tenant_id: int) -> int:
        now = datetime.now(timezone.utc)
        updated_count = (
            db.query(Notification)
            .filter(Notification.tenant_id == tenant_id, Notification.is_read.is_(False))
            .update({"is_read": True, "read_at": now}, synchronize_session="fetch")
        )
        db.commit()
        return updated_count

    def delete_notification(self, db: Session, notification: Notification) -> None:
        db.delete(notification)
        db.commit()


notification_repository = NotificationRepository()
