from datetime import datetime, timezone
from app.database.mongo_odm import MongoDocument, Field, Relation


class Notification(MongoDocument):
    """Notification document for tenant and user alerts."""

    __collection__ = "notifications"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    user_id = Field(int, fk_target="User")
    title = Field(str)
    message = Field(str)
    category = Field(str)
    severity = Field(str, default="info")
    is_read = Field(bool, default=False)
    data = Field(dict)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    read_at = Field(datetime)

    tenant = Relation("Tenant", fk_field="tenant_id", remote_field="id", uselist=False)
    user = Relation("User", fk_field="user_id", remote_field="id", uselist=False)
