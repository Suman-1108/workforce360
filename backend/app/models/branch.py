from datetime import datetime, timezone
from app.database.mongo_odm import MongoDocument, Field, Relation


class Branch(MongoDocument):
    __collection__ = "branches"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    name = Field(str)
    code = Field(str)
    address = Field(str)
    city = Field(str)
    state = Field(str)
    latitude = Field(float)
    longitude = Field(float)
    radius_meters = Field(int, default=200)
    is_active = Field(bool, default=True)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tenant = Relation("Tenant", fk_field="tenant_id", remote_field="id", uselist=False)
    employees = Relation("Employee", fk_field="id", remote_field="branch_id", uselist=True)
