from datetime import datetime, timezone, date
from app.database.mongo_odm import MongoDocument, Field, Relation


class Employee(MongoDocument):
    __collection__ = "employees"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    user_id = Field(int, fk_target="User")
    employee_id_number = Field(str)
    department_id = Field(int, fk_target="Department")
    branch_id = Field(int, fk_target="Branch")
    designation = Field(str)
    employment_type = Field(str, default="Full-time")
    joining_date = Field(date, default=date.today)
    salary = Field(float)
    status = Field(str, default="Active")
    emergency_contact = Field(str)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tenant = Relation("Tenant", fk_field="tenant_id", remote_field="id", uselist=False)
    user = Relation("User", fk_field="user_id", remote_field="id", uselist=False)
    department = Relation("Department", fk_field="department_id", remote_field="id", uselist=False)
    branch = Relation("Branch", fk_field="branch_id", remote_field="id", uselist=False)
    attendances = Relation("Attendance", fk_field="id", remote_field="employee_id", uselist=True)
    leave_requests = Relation("LeaveRequest", fk_field="id", remote_field="employee_id", uselist=True)
    shifts = Relation("EmployeeShift", fk_field="id", remote_field="employee_id", uselist=True)
    uniform_distributions = Relation("UniformDistribution", fk_field="id", remote_field="employee_id", uselist=True)
