from datetime import date, datetime, timezone
from typing import Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.database.session import Session
from app.dependencies import get_db, get_current_user, require_roles, get_tenant_id
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.models.employee import Employee
from app.models.tenant import Tenant
from app.models.uniform import UniformItem
from app.models.employee_portal import (
    WorkBreak,
    WorkUpdate,
    SupportTicket,
    DailyUniformSchedule,
    CompanyBankAccount,
    EmployeeSalaryProfile,
)
from app.utils.response import success_response

router = APIRouter()


# =============================================================================
# Request Schemas
# =============================================================================

class BreakStartRequest(BaseModel):
    break_type: Literal["Tea Break", "Lunch Break"] = Field(..., description="Type of break")
    notes: Optional[str] = Field(None, max_length=200)


class BreakEndRequest(BaseModel):
    notes: Optional[str] = Field(None, max_length=200)


class WorkUpdateCreateRequest(BaseModel):
    task_title: str = Field(..., min_length=2, max_length=160)
    summary: str = Field(..., min_length=3, max_length=2000)
    hours_spent: float = Field(1.0, ge=0.1, le=24.0)
    progress_status: Literal["In Progress", "Completed", "Blocked"] = "In Progress"


class WorkUpdateFeedbackRequest(BaseModel):
    owner_feedback: str = Field(..., min_length=2, max_length=1000)


class SupportTicketCreateRequest(BaseModel):
    category: Literal["Workplace", "Payroll", "HR", "Uniform & Gear", "IT & Equipment", "Safety", "Other"] = "Workplace"
    priority: Literal["Low", "Medium", "High", "Urgent"] = "Medium"
    subject: str = Field(..., min_length=3, max_length=180)
    description: str = Field(..., min_length=5, max_length=3000)


class SupportTicketUpdateRequest(BaseModel):
    status: Optional[Literal["Open", "In Review", "Resolved", "Closed"]] = None
    owner_response: Optional[str] = Field(None, max_length=2000)


class DailyUniformSetRequest(BaseModel):
    date: Optional[str] = Field(None, description="YYYY-MM-DD (defaults to today)")
    uniform_title: str = Field(..., min_length=2, max_length=140)
    dress_code: str = Field(..., min_length=2, max_length=140)
    color_theme: str = Field("Forest Green & White", max_length=80)
    items_required: str = Field(..., min_length=2, max_length=500)
    notes: Optional[str] = Field(None, max_length=500)
    uniform_item_id: Optional[int] = None


class FinanceSetPinRequest(BaseModel):
    pin: str = Field(..., min_length=4, max_length=6, pattern=r"^\d{4,6}$", description="4 to 6 digit security PIN")
    current_pin: Optional[str] = Field(None, description="Required if changing an existing PIN")


class FinanceUnlockRequest(BaseModel):
    pin: str = Field(..., min_length=4, max_length=6, pattern=r"^\d{4,6}$")


class CompanyBankUpdateRequest(BaseModel):
    bank_name: str = Field(..., min_length=2, max_length=120)
    account_holder_name: str = Field(..., min_length=2, max_length=140)
    account_number: str = Field(..., min_length=4, max_length=50)
    ifsc_or_routing: str = Field(..., min_length=3, max_length=40)
    branch_name: str = Field(..., min_length=2, max_length=120)
    account_type: str = Field("Current / Payroll Account", max_length=60)
    upi_or_payment_ref: Optional[str] = Field(None, max_length=100)
    payroll_cycle: str = Field("Monthly (Last Working Day)", max_length=80)
    security_pin: Optional[str] = Field(None, min_length=4, max_length=6, pattern=r"^\d{4,6}$")
    pin_enabled: bool = True


class EmployeeSalaryUpdateRequest(BaseModel):
    basic_salary: float = Field(..., ge=0)
    hra_allowance: float = Field(0.0, ge=0)
    transport_allowance: float = Field(0.0, ge=0)
    other_allowances: float = Field(0.0, ge=0)
    tax_deduction: float = Field(0.0, ge=0)
    pf_deduction: float = Field(0.0, ge=0)
    other_deductions: float = Field(0.0, ge=0)
    currency: str = Field("USD", max_length=10)
    pay_frequency: str = Field("Monthly", max_length=30)
    last_paid_date: Optional[str] = Field(None, max_length=30)
    payment_status: str = Field("Paid", max_length=30)
    employee_bank_name: Optional[str] = Field(None, max_length=120)
    employee_account_number: Optional[str] = Field(None, max_length=50)
    employee_ifsc: Optional[str] = Field(None, max_length=40)


# =============================================================================
# Helpers
# =============================================================================

def _resolve_employee(db: Session, tenant_id: int, user: User) -> Optional[Employee]:
    emp = db.query(Employee).filter(Employee.user_id == user.id, Employee.tenant_id == tenant_id).first()
    if not emp:
        emp = db.query(Employee).filter(Employee.tenant_id == tenant_id).first()
    return emp


def _employee_meta(emp: Optional[Employee]) -> dict:
    if not emp:
        return {"employee_id": None, "employee_name": "Unknown", "employee_code": "N/A", "designation": ""}
    u = emp.user
    name = f"{u.first_name} {u.last_name}".strip() if u else f"Employee #{emp.id}"
    return {
        "employee_id": emp.id,
        "employee_name": name,
        "employee_code": emp.employee_id_number or f"EMP-{emp.id}",
        "designation": emp.designation or "",
    }


def _get_or_init_company_bank(db: Session, tenant_id: int) -> CompanyBankAccount:
    acct = db.query(CompanyBankAccount).filter(CompanyBankAccount.tenant_id == tenant_id).first()
    if not acct:
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        org_name = tenant.name if tenant else "WorkForce 360 Organization"
        acct = CompanyBankAccount(
            tenant_id=tenant_id,
            bank_name="First Republic Commercial Bank",
            account_holder_name=org_name,
            account_number="4098-2210-8834-7712",
            ifsc_or_routing="FRCB0004821",
            branch_name="San Francisco HQ Corporate Branch",
            account_type="Current / Payroll Account",
            upi_or_payment_ref="payroll@workforce360",
            payroll_cycle="Monthly (Last Working Day)",
            security_pin_hash=None,
            pin_enabled=True,
        )
        db.add(acct)
        db.commit()
        db.refresh(acct)
    return acct


def _get_or_init_salary_profile(db: Session, tenant_id: int, emp: Employee) -> EmployeeSalaryProfile:
    prof = (
        db.query(EmployeeSalaryProfile)
        .filter(EmployeeSalaryProfile.tenant_id == tenant_id, EmployeeSalaryProfile.employee_id == emp.id)
        .first()
    )
    if not prof:
        annual = float(emp.salary or 72000.0)
        monthly_gross = round(annual / 12.0, 2)
        basic = round(monthly_gross * 0.60, 2)
        hra = round(monthly_gross * 0.25, 2)
        transport = round(monthly_gross * 0.10, 2)
        other_allow = round(monthly_gross - basic - hra - transport, 2)
        tax = round(monthly_gross * 0.12, 2)
        pf = round(basic * 0.12, 2)
        net = round(monthly_gross - tax - pf, 2)
        prof = EmployeeSalaryProfile(
            tenant_id=tenant_id,
            employee_id=emp.id,
            basic_salary=basic,
            hra_allowance=hra,
            transport_allowance=transport,
            other_allowances=other_allow,
            tax_deduction=tax,
            pf_deduction=pf,
            other_deductions=0.0,
            net_salary=net,
            currency="USD",
            pay_frequency="Monthly",
            last_paid_date=date.today().replace(day=1).isoformat(),
            payment_status="Paid",
            employee_bank_name="Chase Personal Banking",
            employee_account_number="XXXX-XXXX-4918",
            employee_ifsc="CHASUS33XXX",
        )
        db.add(prof)
        db.commit()
        db.refresh(prof)
    return prof


def _serialize_salary(prof: EmployeeSalaryProfile, emp: Optional[Employee] = None) -> dict:
    gross = round(
        float(prof.basic_salary or 0)
        + float(prof.hra_allowance or 0)
        + float(prof.transport_allowance or 0)
        + float(prof.other_allowances or 0),
        2,
    )
    total_deductions = round(
        float(prof.tax_deduction or 0)
        + float(prof.pf_deduction or 0)
        + float(prof.other_deductions or 0),
        2,
    )
    net = round(max(0.0, gross - total_deductions), 2)
    meta = _employee_meta(emp or prof.employee)
    return {
        "id": prof.id,
        **meta,
        "basic_salary": float(prof.basic_salary or 0),
        "hra_allowance": float(prof.hra_allowance or 0),
        "transport_allowance": float(prof.transport_allowance or 0),
        "other_allowances": float(prof.other_allowances or 0),
        "gross_salary": gross,
        "tax_deduction": float(prof.tax_deduction or 0),
        "pf_deduction": float(prof.pf_deduction or 0),
        "other_deductions": float(prof.other_deductions or 0),
        "total_deductions": total_deductions,
        "net_salary": net,
        "currency": prof.currency or "USD",
        "pay_frequency": prof.pay_frequency or "Monthly",
        "last_paid_date": prof.last_paid_date,
        "payment_status": prof.payment_status or "Paid",
        "employee_bank_name": prof.employee_bank_name,
        "employee_account_number": prof.employee_account_number,
        "employee_ifsc": prof.employee_ifsc,
        "updated_at": prof.updated_at.isoformat() if prof.updated_at else None,
    }


def _serialize_company_bank(acct: CompanyBankAccount) -> dict:
    return {
        "id": acct.id,
        "bank_name": acct.bank_name,
        "account_holder_name": acct.account_holder_name,
        "account_number": acct.account_number,
        "ifsc_or_routing": acct.ifsc_or_routing,
        "branch_name": acct.branch_name,
        "account_type": acct.account_type,
        "upi_or_payment_ref": acct.upi_or_payment_ref,
        "payroll_cycle": acct.payroll_cycle,
        "pin_enabled": bool(acct.pin_enabled),
        "has_pin_set": bool(acct.security_pin_hash),
        "updated_at": acct.updated_at.isoformat() if acct.updated_at else None,
    }


# =============================================================================
# 1. TEA BREAK & LUNCH BREAK ENDPOINTS
# =============================================================================

@router.get("/breaks/today", summary="Get Today's Tea & Lunch Breaks")
def get_today_breaks(
    scope: Optional[str] = Query(None, description="Use 'all' for owner organization-wide view"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    is_manager = current_user.role in ("owner", "manager", "superadmin")

    query = db.query(WorkBreak).filter(WorkBreak.tenant_id == tenant_id, WorkBreak.date == today)
    if not (is_manager and scope == "all"):
        emp = _resolve_employee(db, tenant_id, current_user)
        if not emp:
            return success_response(data={"active_break": None, "breaks": [], "total_minutes": 0})
        query = query.filter(WorkBreak.employee_id == emp.id)

    records = query.order_by(WorkBreak.id.desc()).all()

    items = []
    active_break = None
    total_minutes = 0
    for r in records:
        meta = _employee_meta(r.employee)
        duration = r.duration_minutes or 0
        if r.status == "Active" and r.start_time:
            now = datetime.now(timezone.utc)
            st = r.start_time if r.start_time.tzinfo else r.start_time.replace(tzinfo=timezone.utc)
            duration = max(0, int((now - st).total_seconds() // 60))
        total_minutes += duration
        entry = {
            "id": r.id,
            **meta,
            "date": r.date.isoformat() if r.date else today.isoformat(),
            "break_type": r.break_type,
            "start_time": r.start_time.isoformat() if r.start_time else None,
            "end_time": r.end_time.isoformat() if r.end_time else None,
            "duration_minutes": duration,
            "status": r.status,
            "notes": r.notes,
        }
        items.append(entry)
        if r.status == "Active" and active_break is None:
            active_break = entry

    return success_response(
        data={
            "active_break": active_break,
            "breaks": items,
            "total_minutes": total_minutes,
        },
        message="Today's breaks retrieved.",
    )


@router.post("/breaks/start", status_code=status.HTTP_201_CREATED, summary="Start Tea or Lunch Break")
def start_break(
    data: BreakStartRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    emp = _resolve_employee(db, tenant_id, current_user)
    if not emp:
        raise HTTPException(status_code=400, detail="No employee profile found for current user.")

    today = date.today()
    existing_active = (
        db.query(WorkBreak)
        .filter(
            WorkBreak.tenant_id == tenant_id,
            WorkBreak.employee_id == emp.id,
            WorkBreak.date == today,
            WorkBreak.status == "Active",
        )
        .first()
    )
    if existing_active:
        raise HTTPException(
            status_code=409,
            detail=f"You already have an active {existing_active.break_type}. End it before starting another.",
        )

    brk = WorkBreak(
        tenant_id=tenant_id,
        employee_id=emp.id,
        date=today,
        break_type=data.break_type,
        start_time=datetime.now(timezone.utc),
        status="Active",
        duration_minutes=0,
        notes=data.notes,
    )
    db.add(brk)
    db.commit()
    db.refresh(brk)

    return success_response(
        data={
            "id": brk.id,
            "break_type": brk.break_type,
            "start_time": brk.start_time.isoformat() if brk.start_time else None,
            "status": brk.status,
            "duration_minutes": 0,
        },
        message=f"{brk.break_type} started.",
    )


@router.post("/breaks/end", summary="End Active Tea or Lunch Break")
def end_break(
    data: Optional[BreakEndRequest] = None,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    emp = _resolve_employee(db, tenant_id, current_user)
    if not emp:
        raise HTTPException(status_code=400, detail="No employee profile found.")

    active = (
        db.query(WorkBreak)
        .filter(
            WorkBreak.tenant_id == tenant_id,
            WorkBreak.employee_id == emp.id,
            WorkBreak.status == "Active",
        )
        .order_by(WorkBreak.id.desc())
        .first()
    )
    if not active:
        raise HTTPException(status_code=400, detail="No active break to end.")

    now = datetime.now(timezone.utc)
    st = active.start_time if active.start_time.tzinfo else active.start_time.replace(tzinfo=timezone.utc)
    duration = max(1, int((now - st).total_seconds() // 60))

    active.end_time = now
    active.duration_minutes = duration
    active.status = "Completed"
    if data and data.notes:
        active.notes = data.notes

    db.commit()
    db.refresh(active)

    return success_response(
        data={
            "id": active.id,
            "break_type": active.break_type,
            "start_time": active.start_time.isoformat() if active.start_time else None,
            "end_time": active.end_time.isoformat() if active.end_time else None,
            "duration_minutes": active.duration_minutes,
            "status": active.status,
        },
        message=f"{active.break_type} completed ({duration} min).",
    )


# =============================================================================
# 2. TODAY'S UNIFORM SCHEDULE (OWNER SETS, EMPLOYEE VIEWS)
# =============================================================================

@router.get("/uniform-today", summary="Get Today's Uniform Dress Code")
def get_uniform_today(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    sched = (
        db.query(DailyUniformSchedule)
        .filter(DailyUniformSchedule.tenant_id == tenant_id, DailyUniformSchedule.date == today)
        .order_by(DailyUniformSchedule.id.desc())
        .first()
    )

    if not sched:
        # Fallback to most recently configured schedule
        sched = (
            db.query(DailyUniformSchedule)
            .filter(DailyUniformSchedule.tenant_id == tenant_id)
            .order_by(DailyUniformSchedule.id.desc())
            .first()
        )

    if not sched:
        # Provide smart default based on tenant's uniform catalog
        first_item = db.query(UniformItem).filter(UniformItem.tenant_id == tenant_id).first()
        return success_response(
            data={
                "id": None,
                "date": today.isoformat(),
                "uniform_title": first_item.name if first_item else "Standard Operations Polo & Safety Gear",
                "dress_code": "Smart Field Uniform",
                "color_theme": "Emerald Green & Charcoal",
                "items_required": (
                    f"{first_item.name}, Company ID Badge, Safety Footwear"
                    if first_item
                    else "Company Polo Shirt, ID Lanyard, Closed-Toe Safety Shoes"
                ),
                "notes": "Ensure company ID badge is visible before shift check-in.",
                "is_default": True,
            },
            message="Default daily uniform retrieved.",
        )

    return success_response(
        data={
            "id": sched.id,
            "date": sched.date.isoformat() if sched.date else today.isoformat(),
            "uniform_title": sched.uniform_title,
            "dress_code": sched.dress_code,
            "color_theme": sched.color_theme,
            "items_required": sched.items_required,
            "notes": sched.notes,
            "uniform_item_id": sched.uniform_item_id,
            "is_default": False,
            "updated_at": sched.updated_at.isoformat() if sched.updated_at else None,
        },
        message="Today's uniform schedule retrieved.",
    )


@router.post("/uniform-today", summary="Owner Set Today's Uniform Schedule")
def set_uniform_today(
    data: DailyUniformSetRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    target_date = date.fromisoformat(data.date) if data.date else date.today()
    existing = (
        db.query(DailyUniformSchedule)
        .filter(DailyUniformSchedule.tenant_id == tenant_id, DailyUniformSchedule.date == target_date)
        .first()
    )

    if existing:
        existing.uniform_title = data.uniform_title.strip()
        existing.dress_code = data.dress_code.strip()
        existing.color_theme = data.color_theme.strip()
        existing.items_required = data.items_required.strip()
        existing.notes = data.notes.strip() if data.notes else None
        existing.uniform_item_id = data.uniform_item_id
        existing.set_by_user_id = current_user.id
        sched = existing
    else:
        sched = DailyUniformSchedule(
            tenant_id=tenant_id,
            date=target_date,
            uniform_title=data.uniform_title.strip(),
            dress_code=data.dress_code.strip(),
            color_theme=data.color_theme.strip(),
            items_required=data.items_required.strip(),
            notes=data.notes.strip() if data.notes else None,
            uniform_item_id=data.uniform_item_id,
            set_by_user_id=current_user.id,
        )
        db.add(sched)

    db.commit()
    db.refresh(sched)

    return success_response(
        data={
            "id": sched.id,
            "date": sched.date.isoformat(),
            "uniform_title": sched.uniform_title,
            "dress_code": sched.dress_code,
            "color_theme": sched.color_theme,
            "items_required": sched.items_required,
            "notes": sched.notes,
        },
        message="Today's uniform dress code saved and published to employees.",
    )


# =============================================================================
# 3. DAILY WORK UPDATES
# =============================================================================

@router.get("/work-updates", summary="List Daily Work Updates")
def list_work_updates(
    scope: Optional[str] = Query(None, description="Use 'all' for owner organization-wide view"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_manager = current_user.role in ("owner", "manager", "superadmin")
    query = db.query(WorkUpdate).filter(WorkUpdate.tenant_id == tenant_id)

    if not (is_manager and scope == "all"):
        emp = _resolve_employee(db, tenant_id, current_user)
        if not emp:
            return success_response(data=[])
        query = query.filter(WorkUpdate.employee_id == emp.id)

    updates = query.order_by(WorkUpdate.id.desc()).limit(50).all()
    items = []
    for u in updates:
        meta = _employee_meta(u.employee)
        items.append({
            "id": u.id,
            **meta,
            "date": u.date.isoformat() if u.date else date.today().isoformat(),
            "task_title": u.task_title,
            "summary": u.summary,
            "hours_spent": float(u.hours_spent or 0),
            "progress_status": u.progress_status,
            "owner_feedback": u.owner_feedback,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        })

    return success_response(data=items, message="Work updates retrieved.")


@router.post("/work-updates", status_code=status.HTTP_201_CREATED, summary="Submit Daily Work Update")
def create_work_update(
    data: WorkUpdateCreateRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    emp = _resolve_employee(db, tenant_id, current_user)
    if not emp:
        raise HTTPException(status_code=400, detail="No employee profile found.")

    upd = WorkUpdate(
        tenant_id=tenant_id,
        employee_id=emp.id,
        date=date.today(),
        task_title=data.task_title.strip(),
        summary=data.summary.strip(),
        hours_spent=data.hours_spent,
        progress_status=data.progress_status,
    )
    db.add(upd)
    db.commit()
    db.refresh(upd)

    meta = _employee_meta(emp)
    return success_response(
        data={
            "id": upd.id,
            **meta,
            "date": upd.date.isoformat(),
            "task_title": upd.task_title,
            "summary": upd.summary,
            "hours_spent": float(upd.hours_spent),
            "progress_status": upd.progress_status,
            "owner_feedback": upd.owner_feedback,
            "created_at": upd.created_at.isoformat() if upd.created_at else None,
        },
        message="Daily work update submitted.",
    )


@router.put("/work-updates/{update_id}/feedback", summary="Owner Add Feedback to Work Update")
def add_work_update_feedback(
    update_id: int,
    data: WorkUpdateFeedbackRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    upd = (
        db.query(WorkUpdate)
        .filter(WorkUpdate.id == update_id, WorkUpdate.tenant_id == tenant_id)
        .first()
    )
    if not upd:
        raise HTTPException(status_code=404, detail="Work update not found.")

    upd.owner_feedback = data.owner_feedback.strip()
    db.commit()
    db.refresh(upd)

    return success_response(
        data={"id": upd.id, "owner_feedback": upd.owner_feedback},
        message="Feedback posted to work update.",
    )


# =============================================================================
# 4. COMPLAINTS & RAISE SUPPORT TICKETS
# =============================================================================

@router.get("/tickets", summary="List Support Tickets & Complaints")
def list_tickets(
    scope: Optional[str] = Query(None, description="Use 'all' for owner organization-wide view"),
    status_filter: Optional[str] = Query(None, alias="status"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_manager = current_user.role in ("owner", "manager", "superadmin")
    query = db.query(SupportTicket).filter(SupportTicket.tenant_id == tenant_id)

    if not (is_manager and scope == "all"):
        emp = _resolve_employee(db, tenant_id, current_user)
        if not emp:
            return success_response(data=[])
        query = query.filter(SupportTicket.employee_id == emp.id)

    if status_filter:
        query = query.filter(SupportTicket.status == status_filter)

    records = query.order_by(SupportTicket.id.desc()).limit(50).all()
    items = []
    for t in records:
        meta = _employee_meta(t.employee)
        items.append({
            "id": t.id,
            "ticket_number": t.ticket_number or f"TKT-{1000 + t.id}",
            **meta,
            "category": t.category,
            "priority": t.priority,
            "subject": t.subject,
            "description": t.description,
            "status": t.status,
            "owner_response": t.owner_response,
            "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        })

    return success_response(data=items, message="Support tickets retrieved.")


@router.post("/tickets", status_code=status.HTTP_201_CREATED, summary="Raise Complaint / Support Ticket")
def create_ticket(
    data: SupportTicketCreateRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    emp = _resolve_employee(db, tenant_id, current_user)
    if not emp:
        raise HTTPException(status_code=400, detail="No employee profile found.")

    count_existing = db.query(SupportTicket).filter(SupportTicket.tenant_id == tenant_id).count()
    ticket = SupportTicket(
        tenant_id=tenant_id,
        employee_id=emp.id,
        ticket_number=f"TKT-{1001 + count_existing}",
        category=data.category,
        priority=data.priority,
        subject=data.subject.strip(),
        description=data.description.strip(),
        status="Open",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    meta = _employee_meta(emp)
    return success_response(
        data={
            "id": ticket.id,
            "ticket_number": ticket.ticket_number,
            **meta,
            "category": ticket.category,
            "priority": ticket.priority,
            "subject": ticket.subject,
            "description": ticket.description,
            "status": ticket.status,
            "owner_response": ticket.owner_response,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
        },
        message=f"Support ticket {ticket.ticket_number} raised successfully.",
    )


@router.put("/tickets/{ticket_id}", summary="Owner Respond / Resolve Support Ticket")
def update_ticket(
    ticket_id: int,
    data: SupportTicketUpdateRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    ticket = (
        db.query(SupportTicket)
        .filter(SupportTicket.id == ticket_id, SupportTicket.tenant_id == tenant_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Support ticket not found.")

    if data.status:
        ticket.status = data.status
        if data.status in ("Resolved", "Closed"):
            ticket.resolved_at = datetime.now(timezone.utc)
    if data.owner_response is not None:
        ticket.owner_response = data.owner_response.strip()

    db.commit()
    db.refresh(ticket)

    return success_response(
        data={
            "id": ticket.id,
            "ticket_number": ticket.ticket_number,
            "status": ticket.status,
            "owner_response": ticket.owner_response,
            "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        },
        message=f"Ticket {ticket.ticket_number} updated.",
    )


# =============================================================================
# 5. SALARY DETAILS & PIN-PROTECTED COMPANY BANK ACCOUNT VAULT
# =============================================================================

@router.get("/finance/status", summary="Check Salary & Bank PIN Lock Status")
def get_finance_vault_status(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    acct = _get_or_init_company_bank(db, tenant_id)
    emp = _resolve_employee(db, tenant_id, current_user)
    prof = _get_or_init_salary_profile(db, tenant_id, emp) if emp else None

    has_company_pin = bool(acct.security_pin_hash)
    has_personal_pin = bool(prof and prof.personal_pin_hash)

    return success_response(
        data={
            "pin_enabled": bool(acct.pin_enabled),
            "has_pin_set": has_company_pin or has_personal_pin,
            "has_company_pin": has_company_pin,
            "has_personal_pin": has_personal_pin,
            "company_bank_name": acct.bank_name,
            "payroll_cycle": acct.payroll_cycle,
        },
        message="Finance vault status retrieved.",
    )


@router.post("/finance/set-pin", summary="Set or Update Security PIN for Bank & Salary Vault")
def set_finance_pin(
    data: FinanceSetPinRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    acct = _get_or_init_company_bank(db, tenant_id)
    is_owner = current_user.role in ("owner", "manager", "superadmin")

    if is_owner:
        if acct.security_pin_hash and data.current_pin:
            if not verify_password(data.current_pin, acct.security_pin_hash):
                raise HTTPException(status_code=403, detail="Current security PIN is incorrect.")
        acct.security_pin_hash = get_password_hash(data.pin)
        acct.pin_enabled = True
        db.commit()
        return success_response(
            data={"has_pin_set": True, "scope": "company"},
            message="Company bank & salary vault PIN set successfully.",
        )

    # Employee setting/updating their personal PIN
    emp = _resolve_employee(db, tenant_id, current_user)
    if not emp:
        raise HTTPException(status_code=400, detail="No employee profile found.")

    prof = _get_or_init_salary_profile(db, tenant_id, emp)
    if prof.personal_pin_hash:
        if not data.current_pin or not verify_password(data.current_pin, prof.personal_pin_hash):
            raise HTTPException(status_code=403, detail="Current PIN is required and must match to change PIN.")

    prof.personal_pin_hash = get_password_hash(data.pin)
    db.commit()
    return success_response(
        data={"has_pin_set": True, "scope": "personal"},
        message="Personal salary & bank vault PIN set successfully.",
    )


@router.post("/finance/unlock", summary="Unlock Salary & Company Bank Account Details with PIN")
def unlock_finance_vault(
    data: FinanceUnlockRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    acct = _get_or_init_company_bank(db, tenant_id)
    emp = _resolve_employee(db, tenant_id, current_user)
    prof = _get_or_init_salary_profile(db, tenant_id, emp) if emp else None

    valid_company = bool(acct.security_pin_hash and verify_password(data.pin, acct.security_pin_hash))
    valid_personal = bool(prof and prof.personal_pin_hash and verify_password(data.pin, prof.personal_pin_hash))

    if not (acct.security_pin_hash or (prof and prof.personal_pin_hash)):
        raise HTTPException(
            status_code=400,
            detail="No security PIN has been set yet. Please set a 4–6 digit PIN first to view bank & salary details.",
        )

    if not (valid_company or valid_personal):
        raise HTTPException(status_code=403, detail="Invalid security PIN. Access denied.")

    return success_response(
        data={
            "unlocked": True,
            "company_bank": _serialize_company_bank(acct),
            "salary": _serialize_salary(prof, emp) if prof else None,
        },
        message="Vault unlocked successfully.",
    )


@router.get("/owner/finance/config", summary="Owner View All Employee Salaries & Company Bank Config")
def owner_get_finance_config(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    acct = _get_or_init_company_bank(db, tenant_id)
    employees = db.query(Employee).filter(Employee.tenant_id == tenant_id).order_by(Employee.id.asc()).all()

    salaries = []
    for emp in employees:
        prof = _get_or_init_salary_profile(db, tenant_id, emp)
        salaries.append(_serialize_salary(prof, emp))

    return success_response(
        data={
            "company_bank": _serialize_company_bank(acct),
            "employee_salaries": salaries,
        },
        message="Owner payroll & company bank configuration retrieved.",
    )


@router.put("/owner/company-bank", summary="Owner Update Company Bank Account & Security PIN")
def owner_update_company_bank(
    data: CompanyBankUpdateRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    acct = _get_or_init_company_bank(db, tenant_id)
    acct.bank_name = data.bank_name.strip()
    acct.account_holder_name = data.account_holder_name.strip()
    acct.account_number = data.account_number.strip()
    acct.ifsc_or_routing = data.ifsc_or_routing.strip()
    acct.branch_name = data.branch_name.strip()
    acct.account_type = data.account_type.strip()
    acct.upi_or_payment_ref = data.upi_or_payment_ref.strip() if data.upi_or_payment_ref else None
    acct.payroll_cycle = data.payroll_cycle.strip()
    acct.pin_enabled = data.pin_enabled

    if data.security_pin:
        acct.security_pin_hash = get_password_hash(data.security_pin)

    db.commit()
    db.refresh(acct)

    return success_response(
        data=_serialize_company_bank(acct),
        message="Company bank account details & security PIN updated.",
    )


@router.put("/owner/salary/{employee_id}", summary="Owner Configure Employee Salary Breakdown")
def owner_update_employee_salary(
    employee_id: int,
    data: EmployeeSalaryUpdateRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(Employee.id == employee_id, Employee.tenant_id == tenant_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    prof = _get_or_init_salary_profile(db, tenant_id, emp)
    prof.basic_salary = data.basic_salary
    prof.hra_allowance = data.hra_allowance
    prof.transport_allowance = data.transport_allowance
    prof.other_allowances = data.other_allowances
    prof.tax_deduction = data.tax_deduction
    prof.pf_deduction = data.pf_deduction
    prof.other_deductions = data.other_deductions

    gross = data.basic_salary + data.hra_allowance + data.transport_allowance + data.other_allowances
    ded = data.tax_deduction + data.pf_deduction + data.other_deductions
    prof.net_salary = round(max(0.0, gross - ded), 2)
    prof.currency = data.currency
    prof.pay_frequency = data.pay_frequency
    prof.last_paid_date = data.last_paid_date
    prof.payment_status = data.payment_status
    prof.employee_bank_name = data.employee_bank_name
    prof.employee_account_number = data.employee_account_number
    prof.employee_ifsc = data.employee_ifsc

    # Keep employee.salary annual figure synchronized
    emp.salary = round(gross * 12.0, 2)

    db.commit()
    db.refresh(prof)

    return success_response(
        data=_serialize_salary(prof, emp),
        message="Employee salary profile updated.",
    )
