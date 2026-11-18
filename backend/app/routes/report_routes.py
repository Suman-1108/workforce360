from typing import List, Dict, Any
from datetime import date, timedelta
from fastapi import APIRouter, Depends
from app.database.session import Session
from app.database.mongo_odm import func
from app.dependencies import get_db, get_current_user, get_tenant_id
from app.models.employee import Employee
from app.models.attendance import Attendance
from app.models.shift import Shift, EmployeeShift
from app.models.leave import LeaveRequest
from app.models.uniform import UniformDistribution, UniformItem
from app.models.department import Department
from app.models.notification import Notification
from app.models.subscription import Subscription, SubscriptionPlan
from app.models.tenant import Tenant
from app.models.employee_portal import SupportTicket, WorkUpdate
from app.models.user import User
from app.utils.response import success_response

router = APIRouter()


@router.get("/status", summary="Reports Route Health")
async def reports_status():
    return {"module": "reports", "status": "active"}


@router.get("/summary", summary="Executive Workforce Analytics Summary")
def get_summary_report(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate executive operations summary for the tenant organization."""
    today = date.today()

    total_employees = (
        db.query(func.count(Employee.id))
        .filter(Employee.tenant_id == tenant_id)
        .scalar()
        or 0
    )

    active_employees = (
        db.query(func.count(Employee.id))
        .filter(Employee.tenant_id == tenant_id, Employee.status == "Active")
        .scalar()
        or 0
    )

    total_departments = (
        db.query(func.count(Department.id))
        .filter(Department.tenant_id == tenant_id)
        .scalar()
        or 0
    )

    total_shifts = (
        db.query(func.count(Shift.id))
        .filter(Shift.tenant_id == tenant_id, Shift.is_active == True)
        .scalar()
        or 0
    )

    present_today = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.tenant_id == tenant_id, Attendance.date == today, Attendance.status == "Present")
        .scalar()
        or 0
    )

    late_arrivals = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.tenant_id == tenant_id, Attendance.date == today, Attendance.status == "Late")
        .scalar()
        or 0
    )

    on_leave = (
        db.query(func.count(LeaveRequest.id))
        .filter(
            LeaveRequest.tenant_id == tenant_id,
            LeaveRequest.status == "Approved",
            LeaveRequest.start_date <= today,
            LeaveRequest.end_date >= today,
        )
        .scalar()
        or 0
    )

    absent_marked = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.tenant_id == tenant_id, Attendance.date == today, Attendance.status == "Absent")
        .scalar()
        or 0
    )
    absent_today = absent_marked if absent_marked > 0 else max(0, active_employees - present_today - late_arrivals - on_leave)

    pending_leaves = (
        db.query(func.count(LeaveRequest.id))
        .filter(LeaveRequest.tenant_id == tenant_id, LeaveRequest.status == "Pending")
        .scalar()
        or 0
    )

    month_start = today.replace(day=1)
    approved_leaves_month = (
        db.query(func.count(LeaveRequest.id))
        .filter(
            LeaveRequest.tenant_id == tenant_id,
            LeaveRequest.status == "Approved",
            LeaveRequest.start_date >= month_start,
        )
        .scalar()
        or 0
    )

    total_uniform_items = (
        db.query(func.count(UniformItem.id))
        .filter(UniformItem.tenant_id == tenant_id)
        .scalar()
        or 0
    )

    total_uniforms_issued = (
        db.query(func.sum(UniformDistribution.quantity))
        .filter(UniformDistribution.tenant_id == tenant_id, UniformDistribution.status == "Issued")
        .scalar()
        or 0
    )

    open_tickets = (
        db.query(func.count(SupportTicket.id))
        .filter(SupportTicket.tenant_id == tenant_id, SupportTicket.status.in_(["Open", "In Review"]))
        .scalar()
        or 0
    )

    today_work_updates = (
        db.query(func.count(WorkUpdate.id))
        .filter(WorkUpdate.tenant_id == tenant_id, WorkUpdate.date == today)
        .scalar()
        or 0
    )

    unread_notifications = (
        db.query(func.count(Notification.id))
        .filter(
            Notification.tenant_id == tenant_id,
            Notification.is_read == False,
        )
        .scalar()
        or 0
    )

    # Attendance compliance & total hours clocked
    total_punches = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.tenant_id == tenant_id)
        .scalar()
        or 0
    )
    present_punches = (
        db.query(func.count(Attendance.id))
        .filter(Attendance.tenant_id == tenant_id, Attendance.status.in_(["Present", "Late"]))
        .scalar()
        or 0
    )
    late_punches_week = (
        db.query(func.count(Attendance.id))
        .filter(
            Attendance.tenant_id == tenant_id,
            Attendance.date >= today - timedelta(days=7),
            Attendance.status == "Late",
        )
        .scalar()
        or 0
    )
    total_minutes = (
        db.query(func.sum(Attendance.work_duration_minutes))
        .filter(Attendance.tenant_id == tenant_id)
        .scalar()
        or 0
    )
    total_hours_clocked = round(float(total_minutes) / 60.0, 1)

    compliance_rate = round((present_punches / total_punches * 100), 1) if total_punches > 0 else 100.0

    # Organization & active subscription metadata
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    sub = (
        db.query(Subscription)
        .filter(Subscription.tenant_id == tenant_id)
        .order_by(Subscription.id.desc())
        .first()
    )
    plan = (
        db.query(SubscriptionPlan).filter(SubscriptionPlan.id == sub.plan_id).first()
        if sub and sub.plan_id
        else None
    )

    data = {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "total_staff": total_employees,
        "total_departments": total_departments,
        "present_today": present_today,
        "checked_in_today": present_today + late_arrivals,
        "absent_today": absent_today,
        "late_arrivals": late_arrivals,
        "late_punches_week": late_punches_week,
        "on_leave": on_leave,
        "active_shifts": total_shifts,
        "total_shifts": total_shifts,
        "pending_leaves": pending_leaves,
        "approved_leaves_month": approved_leaves_month,
        "total_uniform_items": total_uniform_items,
        "active_uniforms_issued": int(total_uniforms_issued),
        "open_tickets": open_tickets,
        "today_work_updates": today_work_updates,
        "unread_notifications": unread_notifications,
        "total_attendance_records": total_punches,
        "total_hours_clocked": total_hours_clocked,
        "on_time_compliance_rate": compliance_rate,
        "organization_name": tenant.name if tenant else "WorkForce 360",
        "plan_name": plan.name if plan else "Standard Plan",
        "subscription_status": (sub.status.title() if sub and sub.status else ("Active" if (not tenant or tenant.is_active) else "Suspended")),
    }
    return success_response(data=data, message="Analytics summary retrieved successfully.")


@router.get("/weekly-attendance", summary="Weekly Attendance Trends for Telemetry Charts")
def get_weekly_attendance_trends(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Weekly grouped attendance compliance telemetry calculated from live MongoDB records."""
    today = date.today()
    trends = []
    for idx, week_offset in enumerate([3, 2, 1, 0], start=1):
        week_end = today - timedelta(days=week_offset * 7)
        week_start = week_end - timedelta(days=6)

        records = (
            db.query(Attendance)
            .filter(
                Attendance.tenant_id == tenant_id,
                Attendance.date >= week_start,
                Attendance.date <= week_end,
            )
            .all()
        )
        total = len(records)
        if total > 0:
            on_time = sum(1 for r in records if r.status == "Present")
            late = sum(1 for r in records if r.status == "Late")
            absent = sum(1 for r in records if r.status == "Absent")
            on_time_pct = round((on_time / total) * 100)
            late_pct = round((late / total) * 100)
            absent_pct = max(0, 100 - on_time_pct - late_pct) if absent > 0 else round((absent / total) * 100)
        else:
            on_time_pct = 0
            late_pct = 0
            absent_pct = 0

        trends.append({
            "week": f"Week {idx}",
            "onTime": on_time_pct,
            "late": late_pct,
            "absent": absent_pct,
            "totalRecords": total,
        })
    return success_response(data=trends, message="Weekly attendance trends retrieved.")


@router.get("/daily-trends", summary="Last 7 Days Daily Attendance Trends")
def get_daily_attendance_trends(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Last 7 days real attendance counts grouped by day."""
    today = date.today()
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    results = []
    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        day_label = day_names[target_date.weekday()]

        present_count = (
            db.query(func.count(Attendance.id))
            .filter(Attendance.tenant_id == tenant_id, Attendance.date == target_date, Attendance.status == "Present")
            .scalar()
            or 0
        )
        late_count = (
            db.query(func.count(Attendance.id))
            .filter(Attendance.tenant_id == tenant_id, Attendance.date == target_date, Attendance.status == "Late")
            .scalar()
            or 0
        )
        absent_count = (
            db.query(func.count(Attendance.id))
            .filter(Attendance.tenant_id == tenant_id, Attendance.date == target_date, Attendance.status == "Absent")
            .scalar()
            or 0
        )
        results.append({
            "day": day_label,
            "date": target_date.isoformat(),
            "present": present_count,
            "late": late_count,
            "absent": absent_count,
        })
    return success_response(data=results, message="Daily trends retrieved.")


@router.get("/department-distribution", summary="Department-wise Staff Distribution")
def get_department_distribution(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Staff headcount distributed by department for the tenant."""
    depts = db.query(Department).filter(Department.tenant_id == tenant_id).all()
    results = []
    for dept in depts:
        count = (
            db.query(func.count(Employee.id))
            .filter(Employee.tenant_id == tenant_id, Employee.department_id == dept.id, Employee.status == "Active")
            .scalar()
            or 0
        )
        results.append({"name": dept.name, "count": count})

    if not results:
        results = [{"name": "Operations", "count": 0}]

    return success_response(data=results, message="Department distribution retrieved.")


@router.get("/shift-distribution", summary="Shift-wise Staff Distribution")
def get_shift_distribution(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Staff headcount distributed by shift for the tenant."""
    shifts = db.query(Shift).filter(Shift.tenant_id == tenant_id, Shift.is_active == True).all()
    results = []
    for s in shifts:
        count = (
            db.query(func.count(EmployeeShift.id))
            .filter(EmployeeShift.tenant_id == tenant_id, EmployeeShift.shift_id == s.id)
            .scalar()
            or 0
        )
        results.append({
            "id": s.id,
            "name": s.name,
            "type": s.type,
            "start_time": s.start_time.strftime("%I:%M %p") if s.start_time else "09:00 AM",
            "end_time": s.end_time.strftime("%I:%M %p") if s.end_time else "05:00 PM",
            "count": count,
        })
    return success_response(data=results, message="Shift distribution retrieved.")


@router.get("/recent-activity", summary="Recent Live Attendance Activity")
def get_recent_activity(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Latest 10 attendance records with employee details."""
    records = (
        db.query(Attendance)
        .filter(Attendance.tenant_id == tenant_id)
        .order_by(Attendance.id.desc())
        .limit(10)
        .all()
    )
    results = []
    for r in records:
        emp = r.employee
        dept_name = emp.department.name if emp and emp.department else "Operations"
        user = emp.user if emp else None
        emp_name = f"{user.first_name} {user.last_name}" if user else (f"Staff EMP-{emp.id}" if emp else "Staff Member")
        time_str = r.check_in.strftime("%I:%M %p") if r.check_in else "N/A"
        results.append({
            "id": f"ATT-{r.id}",
            "name": emp_name,
            "department": dept_name,
            "shift": "Assigned Shift",
            "time": time_str,
            "geofenceStatus": "Verified" if r.is_geofence_verified else "Out of Bounds",
            "selfieVerified": bool(r.check_in_selfie_url),
            "status": r.status or "Present",
        })
    return success_response(data=results, message="Recent attendance activity retrieved.")
