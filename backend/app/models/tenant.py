from datetime import datetime, timezone
import uuid
from app.database.mongo_odm import MongoDocument, Field, Relation


class Tenant(MongoDocument):
    __collection__ = "tenants"

    id = Field(int, primary_key=True)
    uuid = Field(str, default=lambda: str(uuid.uuid4()))
    name = Field(str)
    subdomain = Field(str)
    contact_email = Field(str)
    contact_phone = Field(str)
    address = Field(str)
    logo_url = Field(str)
    status = Field(str, default="active")
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Collection Relationships
    users = Relation("User", fk_field="id", remote_field="tenant_id", uselist=True)
    subscription = Relation("Subscription", fk_field="id", remote_field="tenant_id", uselist=False)
    departments = Relation("Department", fk_field="id", remote_field="tenant_id", uselist=True)
    branches = Relation("Branch", fk_field="id", remote_field="tenant_id", uselist=True)
    employees = Relation("Employee", fk_field="id", remote_field="tenant_id", uselist=True)
    shifts = Relation("Shift", fk_field="id", remote_field="tenant_id", uselist=True)
    attendances = Relation("Attendance", fk_field="id", remote_field="tenant_id", uselist=True)
    leave_requests = Relation("LeaveRequest", fk_field="id", remote_field="tenant_id", uselist=True)
    uniform_items = Relation("UniformItem", fk_field="id", remote_field="tenant_id", uselist=True)
    uniform_distributions = Relation("UniformDistribution", fk_field="id", remote_field="tenant_id", uselist=True)
    settings = Relation("TenantSetting", fk_field="id", remote_field="tenant_id", uselist=False)
