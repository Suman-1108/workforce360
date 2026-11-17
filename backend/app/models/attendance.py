from datetime import datetime, timezone, date
from app.database.mongo_odm import MongoDocument, Field, Relation


class Attendance(MongoDocument):
    __collection__ = "attendances"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    employee_id = Field(int, fk_target="Employee")
    date = Field(date, default=date.today)
    check_in = Field(datetime)
    check_out = Field(datetime)
    status = Field(str, default="Present")
    check_in_latitude = Field(float)
    check_in_longitude = Field(float)
    check_in_accuracy = Field(float)
    check_in_address = Field(str)
    check_in_selfie_url = Field(str)

    check_out_latitude = Field(float)
    check_out_longitude = Field(float)
    check_out_address = Field(str)
    check_out_selfie_url = Field(str)

    is_geofence_verified = Field(bool, default=False)
    work_duration_minutes = Field(int, default=0)
    notes = Field(str)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tenant = Relation("Tenant", fk_field="tenant_id", remote_field="id", uselist=False)
    employee = Relation("Employee", fk_field="employee_id", remote_field="id", uselist=False)
