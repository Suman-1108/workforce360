from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.session import Base


class Notification(Base):
    """Notification model for tenant and user alerts."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)  # Employee, Attendance, Leave, Shift, Subscription, Payment, System
    severity = Column(String(20), default="info", nullable=False)  # info, warning, success, error
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)

    tenant = relationship("Tenant", backref="notifications")
    user = relationship("User", backref="notifications")
