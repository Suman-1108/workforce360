from datetime import datetime, timezone
from app.database.mongo_odm import MongoDocument, Field, Relation


class Department(MongoDocument):
    __collection__ = "departments"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    name = Field(str)
    code = Field(str)
    description = Field(str)
    manager_name = Field(str)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tenant = Relation("Tenant", fk_field="tenant_id", remote_field="id", uselist=False)
    employees = Relation("Employee", fk_field="id", remote_field="department_id", uselist=True)
