from datetime import datetime, timezone, date
from app.database.mongo_odm import MongoDocument, Field, Relation


class LeaveType(MongoDocument):
    __collection__ = "leave_types"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    name = Field(str)
    code = Field(str)
    days_allowed_per_year = Field(int, default=12)
    is_carry_forward = Field(bool, default=False)
    is_active = Field(bool, default=True)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))

    leave_requests = Relation("LeaveRequest", fk_field="id", remote_field="leave_type_id", uselist=True)


class LeaveRequest(MongoDocument):
    __collection__ = "leave_requests"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    employee_id = Field(int, fk_target="Employee")
    leave_type_id = Field(int, fk_target="LeaveType")
    start_date = Field(date)
    end_date = Field(date)
    total_days = Field(int, default=1)
    reason = Field(str)
    status = Field(str, default="Pending")
    approved_by = Field(int, fk_target="User")
    actioned_at = Field(datetime)
    rejection_reason = Field(str)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tenant = Relation("Tenant", fk_field="tenant_id", remote_field="id", uselist=False)
    employee = Relation("Employee", fk_field="employee_id", remote_field="id", uselist=False)
    leave_type = Relation("LeaveType", fk_field="leave_type_id", remote_field="id", uselist=False)
    approver = Relation("User", fk_field="approved_by", remote_field="id", uselist=False)
