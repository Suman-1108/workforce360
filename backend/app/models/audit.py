from datetime import datetime, timezone
from app.database.mongo_odm import MongoDocument, Field


class AuditLog(MongoDocument):
    __collection__ = "audit_logs"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    user_id = Field(int, fk_target="User")
    action = Field(str)
    resource = Field(str)
    resource_id = Field(str)
    ip_address = Field(str)
    details = Field(dict)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
