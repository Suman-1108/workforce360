from typing import Optional
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.controllers.notification_controller import notification_controller

router = APIRouter()


@router.get("", summary="List Notifications")
def list_notifications(
    category: Optional[str] = Query(None, description="Category filter (Attendance, Leave, Shift, etc.)"),
    unread_only: bool = Query(False, description="Filter for unread notifications only"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve paginated notifications with category and read status filters."""
    return notification_controller.list_notifications(
        db=db,
        tenant_id=current_user.tenant_id,
        category=category,
        unread_only=unread_only,
        page=page,
        page_size=page_size,
    )


@router.get("/unread-count", summary="Get Unread Notification Count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve total count of unread notifications for tenant."""
    return notification_controller.get_unread_count(
        db=db, tenant_id=current_user.tenant_id
    )


@router.patch("/{id}/read", summary="Mark Notification as Read")
def mark_notification_read(
    id: int = Path(..., description="Notification ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a single notification as read."""
    return notification_controller.mark_read(
        db=db, tenant_id=current_user.tenant_id, notification_id=id
    )


@router.patch("/read-all", summary="Mark All Notifications as Read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all unread notifications for tenant as read."""
    return notification_controller.mark_all_read(
        db=db, tenant_id=current_user.tenant_id
    )


@router.delete("/{id}", summary="Delete Notification")
def delete_notification(
    id: int = Path(..., description="Notification ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently delete a notification record."""
    return notification_controller.delete_notification(
        db=db, tenant_id=current_user.tenant_id, notification_id=id
    )
