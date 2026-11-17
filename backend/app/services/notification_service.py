from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.repositories.notification_repository import (
    notification_repository,
    NotificationRepository,
)
from app.core.exceptions import NotFoundException


class NotificationService:
    """Business logic for notifications and alerts."""

    def __init__(self, repo: NotificationRepository = notification_repository):
        self.repo = repo

    def get_notifications(
        self,
        db: Session,
        tenant_id: int,
        category: Optional[str] = None,
        unread_only: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        skip = (page - 1) * page_size
        items = self.repo.list_notifications(
            db,
            tenant_id=tenant_id,
            category=category,
            unread_only=unread_only,
            skip=skip,
            limit=page_size,
        )
        total = self.repo.count_notifications(
            db, tenant_id=tenant_id, category=category, unread_only=unread_only
        )
        unread_count = self.repo.count_unread(db, tenant_id=tenant_id)

        return {
            "items": items,
            "total": total,
            "unread_count": unread_count,
            "page": page,
            "page_size": page_size,
        }

    def get_unread_count(self, db: Session, tenant_id: int) -> int:
        return self.repo.count_unread(db, tenant_id=tenant_id)

    def mark_read(self, db: Session, tenant_id: int, notification_id: int) -> Any:
        notification = self.repo.get_by_id(db, tenant_id=tenant_id, notification_id=notification_id)
        if not notification:
            raise NotFoundException("Notification", notification_id)
        return self.repo.mark_as_read(db, notification)

    def mark_all_read(self, db: Session, tenant_id: int) -> int:
        return self.repo.mark_all_as_read(db, tenant_id=tenant_id)

    def delete_notification(self, db: Session, tenant_id: int, notification_id: int) -> None:
        notification = self.repo.get_by_id(db, tenant_id=tenant_id, notification_id=notification_id)
        if not notification:
            raise NotFoundException("Notification", notification_id)
        self.repo.delete_notification(db, notification)


notification_service = NotificationService()
