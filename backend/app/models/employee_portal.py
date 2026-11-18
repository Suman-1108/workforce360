from datetime import datetime, timezone, date
from app.database.mongo_odm import MongoDocument, Field, Relation


class WorkBreak(MongoDocument):
    """Employee Tea Break & Lunch Break tracking collection."""

    __collection__ = "work_breaks"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    employee_id = Field(int, fk_target="Employee")
    date = Field(date, default=date.today)
    break_type = Field(str, default="Tea Break")  # "Tea Break" | "Lunch Break"
    start_time = Field(datetime, default=lambda: datetime.now(timezone.utc))
    end_time = Field(datetime)
    duration_minutes = Field(int, default=0)
    status = Field(str, default="Active")  # "Active" | "Completed"
    notes = Field(str)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))

    employee = Relation("Employee", fk_field="employee_id", remote_field="id", uselist=False)


class WorkUpdate(MongoDocument):
    """Daily employee work progress updates collection."""

    __collection__ = "work_updates"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    employee_id = Field(int, fk_target="Employee")
    date = Field(date, default=date.today)
    task_title = Field(str)
    summary = Field(str)
    hours_spent = Field(float, default=1.0)
    progress_status = Field(str, default="In Progress")  # "In Progress" | "Completed" | "Blocked"
    owner_feedback = Field(str)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    employee = Relation("Employee", fk_field="employee_id", remote_field="id", uselist=False)


class SupportTicket(MongoDocument):
    """Employee complaints & support ticket collection."""

    __collection__ = "support_tickets"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    employee_id = Field(int, fk_target="Employee")
    ticket_number = Field(str)
    category = Field(str, default="Workplace")
    priority = Field(str, default="Medium")  # "Low" | "Medium" | "High" | "Urgent"
    subject = Field(str)
    description = Field(str)
    status = Field(str, default="Open")  # "Open" | "In Review" | "Resolved" | "Closed"
    owner_response = Field(str)
    resolved_at = Field(datetime)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    employee = Relation("Employee", fk_field="employee_id", remote_field="id", uselist=False)


class DailyUniformSchedule(MongoDocument):
    """Owner-configured Today's Uniform / Dress Code collection."""

    __collection__ = "daily_uniforms"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    date = Field(date, default=date.today)
    uniform_title = Field(str)
    dress_code = Field(str)
    color_theme = Field(str)
    items_required = Field(str)
    notes = Field(str)
    uniform_item_id = Field(int, fk_target="UniformItem")
    set_by_user_id = Field(int, fk_target="User")
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class CompanyBankAccount(MongoDocument):
    """PIN-protected Company Bank Account details per tenant."""

    __collection__ = "company_bank_accounts"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    bank_name = Field(str)
    account_holder_name = Field(str)
    account_number = Field(str)
    ifsc_or_routing = Field(str)
    branch_name = Field(str)
    account_type = Field(str, default="Current / Payroll Account")
    upi_or_payment_ref = Field(str)
    payroll_cycle = Field(str, default="Monthly (Last Working Day)")
    security_pin_hash = Field(str)
    pin_enabled = Field(bool, default=True)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class EmployeeSalaryProfile(MongoDocument):
    """Employee salary breakdown & payout metadata collection."""

    __collection__ = "employee_salary_profiles"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    employee_id = Field(int, fk_target="Employee")
    basic_salary = Field(float, default=0.0)
    hra_allowance = Field(float, default=0.0)
    transport_allowance = Field(float, default=0.0)
    other_allowances = Field(float, default=0.0)
    tax_deduction = Field(float, default=0.0)
    pf_deduction = Field(float, default=0.0)
    other_deductions = Field(float, default=0.0)
    net_salary = Field(float, default=0.0)
    currency = Field(str, default="USD")
    pay_frequency = Field(str, default="Monthly")
    last_paid_date = Field(str)
    payment_status = Field(str, default="Paid")
    employee_bank_name = Field(str)
    employee_account_number = Field(str)
    employee_ifsc = Field(str)
    personal_pin_hash = Field(str)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    employee = Relation("Employee", fk_field="employee_id", remote_field="id", uselist=False)
