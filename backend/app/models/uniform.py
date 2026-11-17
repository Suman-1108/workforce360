from datetime import datetime, timezone, date
from app.database.mongo_odm import MongoDocument, Field, Relation


class UniformItem(MongoDocument):
    __collection__ = "uniform_items"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    name = Field(str)
    code = Field(str)
    category = Field(str)
    gender_group = Field(str, default="Unisex")
    model_image_url = Field(str)
    description = Field(str)
    colors = Field(str)
    items_breakdown = Field(str)
    sizes_available = Field(str)
    total_stock = Field(int, default=0)
    distributed_stock = Field(int, default=0)
    is_active = Field(bool, default=True)
    is_archived = Field(bool, default=False)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tenant = Relation("Tenant", fk_field="tenant_id", remote_field="id", uselist=False)
    distributions = Relation("UniformDistribution", fk_field="id", remote_field="uniform_item_id", uselist=True)


class UniformDistribution(MongoDocument):
    __collection__ = "uniform_distributions"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    employee_id = Field(int, fk_target="Employee")
    uniform_item_id = Field(int, fk_target="UniformItem")
    size = Field(str)
    quantity = Field(int, default=1)
    issued_date = Field(date, default=date.today)
    status = Field(str, default="Issued")
    notes = Field(str)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))

    tenant = Relation("Tenant", fk_field="tenant_id", remote_field="id", uselist=False)
    employee = Relation("Employee", fk_field="employee_id", remote_field="id", uselist=False)
    uniform_item = Relation("UniformItem", fk_field="uniform_item_id", remote_field="id", uselist=False)
