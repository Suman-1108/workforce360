from datetime import date, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.shift import Shift
from app.models.leave import LeaveRequest
from app.models.user import User
from app.api.deps import get_current_user, get_tenant_id

router = APIRouter()


@router.get("/summary", summary="Get Owner Dashboard Summary KPI Metrics")
def get_dashboard_summary(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate live workforce KPIs for today."""
    today = date.today()

    total_employees = db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.status == "Active"
    ).count()

    # Today's attendance
    today_attendances = db.query(Attendance).filter(
        Attendance.tenant_id == tenant_id,
        Attendance.date == today
    ).all()

    present_count = sum(1 for a in today_attendances if a.status in ["Present", "Late"])
    late_count = sum(1 for a in today_attendances if a.status == "Late")

    # On leave today
    on_leave_count = db.query(LeaveRequest).filter(
        LeaveRequest.tenant_id == tenant_id,
        LeaveRequest.status == "Approved",
        LeaveRequest.start_date <= today,
        LeaveRequest.end_date >= today
    ).count()

    absent_count = max(0, total_employees - present_count - on_leave_count)
    active_shifts = db.query(Shift).filter(Shift.tenant_id == tenant_id, Shift.is_active == True).count()

    return {
        "total_employees": total_employees,
        "present_today": present_count,
        "absent_today": absent_count,
        "late_arrivals": late_count,
        "on_leave": on_leave_count,
        "active_shifts": active_shifts
    }


@router.get("/weekly-attendance", summary="Get 7-Day Attendance Chart Trends")
def get_weekly_attendance(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve 7-day attendance trends for Recharts graph."""
    today = date.today()
    days = []

    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        day_label = d.strftime("%a")

        atts = db.query(Attendance).filter(
            Attendance.tenant_id == tenant_id,
            Attendance.date == d
        ).all()

        present = sum(1 for a in atts if a.status in ["Present", "Late"])
        late = sum(1 for a in atts if a.status == "Late")

        days.append({
            "day": day_label,
            "date": d.isoformat(),
            "present": present,
            "late": late,
            "rate": round((present / max(1, present + late)) * 100, 1) if (present + late) > 0 else 0
        })

    return days
