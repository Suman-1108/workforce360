from datetime import datetime, timezone, date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.database.session import Session
from app.database.session import get_db
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.branch import Branch
from app.models.shift import Shift, EmployeeShift
from app.models.user import User
from app.schemas.attendance import PunchInRequest, PunchOutRequest, AttendanceOut
from app.api.deps import get_current_user, get_tenant_id
from app.services.geo import verify_geofence, reverse_geocode_geoapify

router = APIRouter()


@router.get("", summary="List Attendance Records")
def get_attendance_records(
    date_filter: Optional[date] = Query(None, alias="date"),
    employee_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List attendance records with multi-tenant isolation."""
    query = db.query(Attendance).filter(Attendance.tenant_id == tenant_id)

    if date_filter:
        query = query.filter(Attendance.date == date_filter)
    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
    if status_filter:
        query = query.filter(Attendance.status == status_filter)

    # If the user is an employee, only show their own attendance
    if current_user.role == "employee":
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if emp:
            query = query.filter(Attendance.employee_id == emp.id)
        else:
            return {"total": 0, "items": []}

    total = query.count()
    records = query.order_by(Attendance.date.desc(), Attendance.check_in.desc()).offset(skip).limit(limit).all()

    items = []
    for r in records:
        emp = r.employee
        u = emp.user if emp else None
        items.append({
            "id": r.id,
            "tenant_id": r.tenant_id,
            "employee_id": r.employee_id,
            "employee_name": f"{u.first_name} {u.last_name}" if u else "Unknown",
            "employee_id_number": emp.employee_id_number if emp else "",
            "date": r.date.isoformat(),
            "check_in": r.check_in.isoformat() if r.check_in else None,
            "check_out": r.check_out.isoformat() if r.check_out else None,
            "status": r.status,
            "check_in_latitude": r.check_in_latitude,
            "check_in_longitude": r.check_in_longitude,
            "check_in_address": r.check_in_address,
            "check_in_selfie_url": r.check_in_selfie_url,
            "check_out_address": r.check_out_address,
            "check_out_selfie_url": r.check_out_selfie_url,
            "is_geofence_verified": r.is_geofence_verified,
            "work_duration_minutes": r.work_duration_minutes,
            "notes": r.notes
        })

    return {"total": total, "items": items}


@router.get("/today", summary="Get Today's Punch Status")
def get_today_punch_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve today's attendance record for the logged-in employee."""
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        return {"has_employee_profile": False, "punched_in": False, "punched_out": False}

    today = date.today()
    att = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date == today
    ).first()

    if not att:
        return {
            "has_employee_profile": True,
            "punched_in": False,
            "punched_out": False,
            "employee_id": emp.id,
            "employee_name": f"{current_user.first_name} {current_user.last_name}",
            "branch_id": emp.branch_id
        }

    return {
        "has_employee_profile": True,
        "punched_in": att.check_in is not None,
        "punched_out": att.check_out is not None,
        "check_in": att.check_in.isoformat() if att.check_in else None,
        "check_out": att.check_out.isoformat() if att.check_out else None,
        "status": att.status,
        "work_duration_minutes": att.work_duration_minutes,
        "is_geofence_verified": att.is_geofence_verified
    }


@router.post("/punch-in", summary="Record Employee Punch-In")
async def punch_in(
    data: PunchInRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register attendance punch-in with GPS geofence and camera selfie verification."""
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No employee profile associated with your user account",
        )

    today = date.today()
    existing = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date == today
    ).first()

    if existing and existing.check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already punched in for today",
        )

    # Verify Geofence
    is_geofence_valid = True
    distance_meters = 0.0
    if emp.branch:
        is_geofence_valid, distance_meters = verify_geofence(
            user_lat=data.latitude,
            user_lon=data.longitude,
            branch_lat=emp.branch.latitude,
            branch_lon=emp.branch.longitude,
            radius_meters=emp.branch.radius_meters
        )

    # Address lookup via Geoapify if not passed from client
    address = data.address
    if not address:
        address = await reverse_geocode_geoapify(data.latitude, data.longitude)

    # Determine status (Late vs Present)
    now = datetime.now(timezone.utc)
    status_str = "Present"

    # Check shift timing
    emp_shift = db.query(EmployeeShift).filter(
        EmployeeShift.employee_id == emp.id,
        EmployeeShift.effective_date <= today
    ).order_by(EmployeeShift.effective_date.desc()).first()

    if emp_shift and emp_shift.shift:
        shift = emp_shift.shift
        shift_start = datetime.combine(today, shift.start_time).replace(tzinfo=timezone.utc)
        late_threshold = shift_start + timedelta(minutes=shift.grace_period_mins)
        if now > late_threshold:
            status_str = "Late"

    attendance = Attendance(
        tenant_id=emp.tenant_id,
        employee_id=emp.id,
        date=today,
        check_in=now,
        status=status_str,
        check_in_latitude=data.latitude,
        check_in_longitude=data.longitude,
        check_in_accuracy=data.accuracy,
        check_in_address=address or "Branch Perimeter",
        check_in_selfie_url=data.selfie_url,
        is_geofence_verified=is_geofence_valid,
        notes=data.notes
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return {
        "message": "Punched in successfully",
        "check_in": attendance.check_in.isoformat(),
        "status": attendance.status,
        "is_geofence_verified": is_geofence_valid,
        "distance_meters": distance_meters
    }


@router.post("/punch-out", summary="Record Employee Punch-Out")
async def punch_out(
    data: PunchOutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Register attendance punch-out and calculate total shift duration."""
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No employee profile found")

    today = date.today()
    attendance = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date == today
    ).first()

    if not attendance or not attendance.check_in:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot punch out without an active punch-in for today",
        )

    if attendance.check_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already punched out for today",
        )

    now = datetime.now(timezone.utc)
    attendance.check_out = now
    attendance.check_out_latitude = data.latitude
    attendance.check_out_longitude = data.longitude
    attendance.check_out_selfie_url = data.selfie_url

    address = data.address
    if not address:
        address = await reverse_geocode_geoapify(data.latitude, data.longitude)
    attendance.check_out_address = address or "Branch Perimeter"

    # Calculate duration
    check_in_time = attendance.check_in
    if check_in_time.tzinfo is None:
        check_in_time = check_in_time.replace(tzinfo=timezone.utc)

    duration = int((now - check_in_time).total_seconds() / 60)
    attendance.work_duration_minutes = max(0, duration)

    db.commit()

    return {
        "message": "Punched out successfully",
        "check_out": attendance.check_out.isoformat(),
        "work_duration_minutes": attendance.work_duration_minutes
    }
