from datetime import datetime, timezone, time, date
from app.database.mongo_odm import MongoDocument, Field, Relation


class Shift(MongoDocument):
    __collection__ = "shifts"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    name = Field(str)
    code = Field(str)
    type = Field(str, default="Day")
    start_time = Field(time, default=lambda: time(9, 0))
    end_time = Field(time, default=lambda: time(18, 0))
    grace_period_mins = Field(int, default=15)
    is_active = Field(bool, default=True)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))

    tenant = Relation("Tenant", fk_field="tenant_id", remote_field="id", uselist=False)
    employee_shifts = Relation("EmployeeShift", fk_field="id", remote_field="shift_id", uselist=True)


class EmployeeShift(MongoDocument):
    __collection__ = "employee_shifts"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    employee_id = Field(int, fk_target="Employee")
    shift_id = Field(int, fk_target="Shift")
    effective_date = Field(date, default=date.today)
    end_date = Field(date)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))

    employee = Relation("Employee", fk_field="employee_id", remote_field="id", uselist=False)
    shift = Relation("Shift", fk_field="shift_id", remote_field="id", uselist=False)
