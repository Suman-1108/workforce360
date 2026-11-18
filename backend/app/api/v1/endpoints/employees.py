from typing import List, Optional
from datetime import datetime, timezone, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.database.session import Session
from app.database.session import get_db
from app.core.security import get_password_hash
from app.models.employee import Employee
from app.models.user import User
from app.models.department import Department
from app.models.branch import Branch
from app.models.subscription import Subscription
from app.schemas.employee import EmployeeOut, EmployeeCreate, EmployeeUpdate
from app.api.deps import get_current_user, get_tenant_id, require_roles
from app.utils.phone_utils import parse_phone_metadata, format_e164_or_international

router = APIRouter()


@router.get("/validate-phone", summary="Validate and detect country & line type for phone number")
def validate_phone(
    phone: str = Query(..., description="Phone number string to parse and detect"),
    country: str = Query("IN", description="Default fallback 2-letter ISO country code")
):
    """Detect country, format, line type (mobile/landline), and validity."""
    return parse_phone_metadata(phone, country)


@router.get("", summary="List Employees for Organization")
def list_employees(
    department_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve employees strictly isolated to the caller's organization tenant."""
    query = db.query(Employee).filter(Employee.tenant_id == tenant_id)

    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if status_filter:
        query = query.filter(Employee.status == status_filter)
    if search:
        search_pattern = f"%{search}%"
        query = query.join(User).filter(
            (User.first_name.ilike(search_pattern)) |
            (User.last_name.ilike(search_pattern)) |
            (User.email.ilike(search_pattern)) |
            (Employee.employee_id_number.ilike(search_pattern)) |
            (Employee.designation.ilike(search_pattern))
        )

    total = query.count()
    employees = query.offset(skip).limit(limit).all()

    results = []
    for emp in employees:
        u = emp.user
        dept = emp.department
        br = emp.branch
        results.append({
            "id": emp.id,
            "tenant_id": emp.tenant_id,
            "user_id": emp.user_id,
            "employee_id_number": emp.employee_id_number,
            "name": f"{u.first_name} {u.last_name}" if u else "Unknown",
            "first_name": u.first_name if u else "",
            "last_name": u.last_name if u else "",
            "email": u.email if u else "",
            "phone": u.phone if u else "",
            "avatar_url": u.avatar_url if u else None,
            "designation": emp.designation,
            "department_id": emp.department_id,
            "department_name": dept.name if dept else "General",
            "branch_id": emp.branch_id,
            "branch_name": br.name if br else "HQ Campus",
            "employment_type": emp.employment_type,
            "joining_date": emp.joining_date.isoformat() if emp.joining_date else None,
            "salary": float(emp.salary) if emp.salary else None,
            "status": emp.status,
            "created_at": emp.created_at.isoformat()
        })

    return {"total": total, "items": results}


@router.post("", status_code=status.HTTP_201_CREATED, summary="Add Employee to Organization")
def create_employee(
    data: EmployeeCreate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db)
):
    """Create new employee with user account, checking subscription limit first."""
    # Check subscription employee limit
    sub = db.query(Subscription).filter(Subscription.tenant_id == tenant_id).first()
    if sub and sub.plan and sub.plan.max_employees != -1:
        current_count = db.query(Employee).filter(Employee.tenant_id == tenant_id).count()
        if current_count >= sub.plan.max_employees:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Employee limit reached ({sub.plan.max_employees} max on {sub.plan.name}). Please upgrade your subscription.",
            )

    # Check if user email is taken
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists",
        )

    # Check if employee_id_number is taken in this tenant
    if db.query(Employee).filter(
        Employee.tenant_id == tenant_id,
        Employee.employee_id_number == data.employee_id_number
    ).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee ID '{data.employee_id_number}' is already assigned in your organization",
        )

    # Create User
    now = datetime.now(timezone.utc)
    formatted_phone = format_e164_or_international(data.phone) if data.phone else None
    formatted_emergency = format_e164_or_international(data.emergency_contact) if data.emergency_contact else None
    new_user = User(
        tenant_id=tenant_id,
        email=data.email,
        password_hash=get_password_hash(data.password or "WorkForce@2026"),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=formatted_phone,
        role="employee",
        is_active=True,
        is_verified=True,
        created_at=now
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create Employee Profile
    new_emp = Employee(
        tenant_id=tenant_id,
        user_id=new_user.id,
        employee_id_number=data.employee_id_number,
        department_id=data.department_id,
        branch_id=data.branch_id,
        designation=data.designation,
        employment_type=data.employment_type,
        joining_date=data.joining_date or date.today(),
        salary=data.salary,
        status=data.status,
        emergency_contact=formatted_emergency
    )
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    return {
        "id": new_emp.id,
        "employee_id_number": new_emp.employee_id_number,
        "name": f"{new_user.first_name} {new_user.last_name}",
        "email": new_user.email,
        "message": "Employee created successfully"
    }


@router.get("/{employee_id}", summary="Get Employee Details")
def get_employee(
    employee_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve detailed employee record with tenant check."""
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.tenant_id == tenant_id
    ).first()

    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    u = emp.user
    dept = emp.department
    br = emp.branch

    return {
        "id": emp.id,
        "tenant_id": emp.tenant_id,
        "user_id": emp.user_id,
        "employee_id_number": emp.employee_id_number,
        "first_name": u.first_name if u else "",
        "last_name": u.last_name if u else "",
        "name": f"{u.first_name} {u.last_name}" if u else "Unknown",
        "email": u.email if u else "",
        "phone": u.phone if u else "",
        "avatar_url": u.avatar_url if u else None,
        "department_id": emp.department_id,
        "department_name": dept.name if dept else "General",
        "branch_id": emp.branch_id,
        "branch_name": br.name if br else "HQ Campus",
        "designation": emp.designation,
        "employment_type": emp.employment_type,
        "joining_date": emp.joining_date.isoformat() if emp.joining_date else None,
        "salary": float(emp.salary) if emp.salary else None,
        "status": emp.status,
        "emergency_contact": emp.emergency_contact,
        "created_at": emp.created_at.isoformat()
    }


@router.put("/{employee_id}", summary="Update Employee Profile")
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db)
):
    """Update employee details."""
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.tenant_id == tenant_id
    ).first()

    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    if data.department_id is not None:
        emp.department_id = data.department_id
    if data.branch_id is not None:
        emp.branch_id = data.branch_id
    if data.designation is not None:
        emp.designation = data.designation
    if data.employment_type is not None:
        emp.employment_type = data.employment_type
    if data.salary is not None:
        emp.salary = data.salary
    if data.status is not None:
        emp.status = data.status
    if data.emergency_contact is not None:
        emp.emergency_contact = format_e164_or_international(data.emergency_contact)

    db.commit()
    return {"message": "Employee updated successfully"}


@router.delete("/{employee_id}", summary="Remove Employee")
def delete_employee(
    employee_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db)
):
    """Permanently remove employee record and associated login account."""
    from app.services.employee_service import employee_service
    employee_service.delete_employee(db=db, employee_id=employee_id, tenant_id=tenant_id)
    return {"message": "Employee removed successfully"}
