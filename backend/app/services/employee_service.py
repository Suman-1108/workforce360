import secrets
from typing import Optional, List, Tuple
from app.database.session import Session
from app.models.employee import Employee
from app.models.tenant import Tenant
from app.models.user import User
from app.models.attendance import Attendance
from app.models.leave import LeaveRequest
from app.models.shift import EmployeeShift
from app.models.uniform import UniformDistribution
from app.models.employee_portal import WorkBreak, WorkUpdate, SupportTicket
from app.repositories.employee_repository import employee_repository, EmployeeRepository
from app.repositories.user_repository import user_repository, UserRepository
from app.services.entitlement_service import entitlement_service, EntitlementService
from app.services.email import send_employee_welcome_email
from app.schemas.employee_schema import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeListResponse,
)
from app.core.security import get_password_hash
from app.utils.phone_utils import format_e164_or_international
from app.core.exceptions import (
    NotFoundException,
    ConflictException,
    ValidationException,
)
from app.core.logging import logger


class EmployeeService:
    """Business logic coordinator for employee lifecycle operations."""

    def __init__(
        self,
        emp_repo: EmployeeRepository = employee_repository,
        usr_repo: UserRepository = user_repository,
        entitlements: EntitlementService = entitlement_service,
    ):
        self.emp_repo = emp_repo
        self.usr_repo = usr_repo
        self.entitlements = entitlements

    def _to_response(self, emp: Employee) -> EmployeeResponse:
        """Map MongoDB Employee document into clean Pydantic response."""
        u = emp.user
        dept = emp.department
        br = emp.branch

        first_name = u.first_name if u else ""
        last_name = u.last_name if u else ""
        full_name = f"{first_name} {last_name}".strip() or "Unknown"

        return EmployeeResponse(
            id=emp.id,
            tenant_id=emp.tenant_id,
            user_id=emp.user_id,
            employee_id_number=emp.employee_id_number,
            first_name=first_name,
            last_name=last_name,
            full_name=full_name,
            email=u.email if u else "",
            phone=u.phone if u else None,
            avatar_url=u.avatar_url if u else None,
            designation=emp.designation,
            department_id=emp.department_id,
            department_name=dept.name if dept else None,
            branch_id=emp.branch_id,
            branch_name=br.name if br else None,
            employment_type=str(emp.employment_type),
            joining_date=emp.joining_date.isoformat() if emp.joining_date else "",
            salary=float(emp.salary) if emp.salary else None,
            status=str(emp.status),
            emergency_contact=emp.emergency_contact,
            created_at=emp.created_at.isoformat() if emp.created_at else "",
        )

    def list_employees(
        self,
        db: Session,
        tenant_id: int,
        department_id: Optional[int] = None,
        branch_id: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> EmployeeListResponse:
        """Retrieve paginated list of employees for the tenant."""
        skip = (page - 1) * page_size
        employees, total = self.emp_repo.list_employees(
            db=db,
            tenant_id=tenant_id,
            department_id=department_id,
            branch_id=branch_id,
            status=status,
            search=search,
            skip=skip,
            limit=page_size,
        )

        items = [self._to_response(emp) for emp in employees]
        return EmployeeListResponse(
            total=total,
            page=page,
            page_size=page_size,
            items=items,
        )

    def get_employee(self, db: Session, employee_id: int, tenant_id: int) -> EmployeeResponse:
        """Fetch employee details by ID, validating tenant isolation."""
        emp = self.emp_repo.get_by_id(db, employee_id=employee_id, tenant_id=tenant_id)
        if not emp:
            raise NotFoundException("Employee", employee_id)
        return self._to_response(emp)

    def create_employee(
        self, db: Session, tenant_id: int, data: EmployeeCreate
    ) -> EmployeeResponse:
        """Enroll a new employee with entitlement check, user creation, and profile creation."""
        # 1. Check subscription employee quota
        self.entitlements.verify_employee_quota(db, tenant_id)

        # 2. Check if email is already taken
        existing_user = self.usr_repo.get_by_email(db, data.email)
        if existing_user:
            raise ConflictException(f"An account with email '{data.email}' already exists.")

        # 3. Check if employee ID number is already taken in this tenant
        existing_emp = self.emp_repo.get_by_employee_id_number(
            db, employee_id_number=data.employee_id_number, tenant_id=tenant_id
        )
        if existing_emp:
            raise ConflictException(
                f"Employee ID '{data.employee_id_number}' is already assigned in your organization."
            )

        # 4. Resolve Organization Name & Generate Password
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        organization_name = tenant.name if tenant else "WorkForce 360 Organization"
        password = data.password or f"WF360@{secrets.token_hex(3).upper()}"
        clean_phone = format_e164_or_international(data.phone) if data.phone else None
        clean_emergency = format_e164_or_international(data.emergency_contact) if data.emergency_contact else None
        full_name = f"{data.first_name} {data.last_name}".strip()

        # 5. Create User entity
        user = User(
            tenant_id=tenant_id,
            email=data.email,
            password_hash=get_password_hash(password),
            first_name=data.first_name,
            last_name=data.last_name,
            phone=clean_phone,
            role="employee",
            is_active=True,
            is_verified=True,
        )
        self.usr_repo.create(db, user)

        # 6. Create Employee profile (storing email, full_name, phone & organization_name directly in MongoDB)
        employee = Employee(
            tenant_id=tenant_id,
            user_id=user.id,
            employee_id_number=data.employee_id_number,
            email=data.email,
            first_name=data.first_name,
            last_name=data.last_name,
            full_name=full_name,
            phone=clean_phone,
            organization_name=organization_name,
            department_id=data.department_id,
            branch_id=data.branch_id,
            designation=data.designation,
            employment_type=data.employment_type.value if hasattr(data.employment_type, "value") else str(data.employment_type),
            joining_date=data.joining_date,
            salary=data.salary,
            status=data.status.value if hasattr(data.status, "value") else str(data.status),
            emergency_contact=clean_emergency,
            assigned_shift=getattr(data, "shift_name", None) or "Standard Day Shift",
            address={
                "street": getattr(data, "street", None) or "",
                "city": getattr(data, "city", None) or "Headquarters",
                "state": getattr(data, "state", None) or "",
                "postalCode": getattr(data, "postal_code", None) or "",
            },
            uniform_sizes={
                "shirt": getattr(data, "uniform_shirt", None) or "M",
                "pants": getattr(data, "uniform_pants", None) or "32",
                "shoes": getattr(data, "uniform_shoes", None) or "9",
            },
            blood_group=getattr(data, "blood_group", None) or "O+",
            documents=[
                {"name": "Government Photo ID Card (Passport / License)", "status": "Pending Upload", "required": True},
                {"name": "Signed Employment Agreement & Code of Conduct", "status": "Pending Upload", "required": True},
                {"name": "GPS Geofence & Facial Selfie Privacy Consent Form", "status": "Pending Upload", "required": True},
                {"name": "Safety Equipment & Uniform Sizing Acknowledgement", "status": "Pending Upload", "required": True},
            ],
        )
        self.emp_repo.create(db, employee)

        db.commit()
        db.refresh(employee)
        logger.info(f"Enrolled employee {employee.employee_id_number} ({data.email}) in {organization_name}")

        # 7. Send welcome email with organization name, login email & password
        try:
            send_employee_welcome_email(
                to_email=data.email,
                employee_name=full_name,
                organization_name=organization_name,
                employee_id_number=employee.employee_id_number,
                designation=employee.designation,
                password=password,
            )
        except Exception as mail_err:
            logger.error(f"Failed to send welcome credentials email to {data.email}: {mail_err}")

        return self._to_response(employee)

    def update_employee(
        self, db: Session, employee_id: int, tenant_id: int, data: EmployeeUpdate
    ) -> EmployeeResponse:
        """Update employee and linked user details."""
        emp = self.emp_repo.get_by_id(db, employee_id=employee_id, tenant_id=tenant_id)
        if not emp:
            raise NotFoundException("Employee", employee_id)

        # Update User fields and mirrored Employee fields if provided
        u = emp.user
        if u:
            if data.first_name is not None:
                u.first_name = data.first_name
                emp.first_name = data.first_name
            if data.last_name is not None:
                u.last_name = data.last_name
                emp.last_name = data.last_name
            if data.first_name is not None or data.last_name is not None:
                emp.full_name = f"{u.first_name} {u.last_name}".strip()
            if data.phone is not None:
                formatted_phone = format_e164_or_international(data.phone) if data.phone else None
                u.phone = formatted_phone
                emp.phone = formatted_phone

        # Update Employee fields
        if data.designation is not None:
            emp.designation = data.designation
        if data.department_id is not None:
            emp.department_id = data.department_id
        if data.branch_id is not None:
            emp.branch_id = data.branch_id
        if data.employment_type is not None:
            emp.employment_type = data.employment_type.value if hasattr(data.employment_type, "value") else str(data.employment_type)
        if data.salary is not None:
            emp.salary = data.salary
        if data.status is not None:
            emp.status = data.status.value if hasattr(data.status, "value") else str(data.status)
        if data.emergency_contact is not None:
            emp.emergency_contact = format_e164_or_international(data.emergency_contact) if data.emergency_contact else None

        db.commit()
        db.refresh(emp)
        logger.info(f"Updated employee {emp.employee_id_number} (Tenant: {tenant_id})")
        return self._to_response(emp)

    def deactivate_employee(self, db: Session, employee_id: int, tenant_id: int) -> None:
        """Deactivate employee and deactivate login account."""
        emp = self.emp_repo.get_by_id(db, employee_id=employee_id, tenant_id=tenant_id)
        if not emp:
            raise NotFoundException("Employee", employee_id)

        emp.status = "Suspended"
        if emp.user:
            emp.user.is_active = False

        db.commit()
        logger.info(f"Deactivated employee {emp.employee_id_number} (Tenant: {tenant_id})")

    def delete_employee(self, db: Session, employee_id: int, tenant_id: int) -> None:
        """Permanently delete employee record, associated login user, and child records."""
        emp = self.emp_repo.get_by_id(db, employee_id=employee_id, tenant_id=tenant_id)
        if not emp:
            raise NotFoundException("Employee", employee_id)

        user_id = emp.user_id
        emp_id = emp.id
        emp_code = emp.employee_id_number

        # 1. Clean up child records belonging to this employee
        try:
            db.query(Attendance).filter(Attendance.employee_id == emp_id, Attendance.tenant_id == tenant_id).delete()
            db.query(LeaveRequest).filter(LeaveRequest.employee_id == emp_id, LeaveRequest.tenant_id == tenant_id).delete()
            db.query(WorkBreak).filter(WorkBreak.employee_id == emp_id, WorkBreak.tenant_id == tenant_id).delete()
            db.query(WorkUpdate).filter(WorkUpdate.employee_id == emp_id, WorkUpdate.tenant_id == tenant_id).delete()
            db.query(SupportTicket).filter(SupportTicket.employee_id == emp_id, SupportTicket.tenant_id == tenant_id).delete()
            db.query(EmployeeShift).filter(EmployeeShift.employee_id == emp_id, EmployeeShift.tenant_id == tenant_id).delete()
            db.query(UniformDistribution).filter(UniformDistribution.employee_id == emp_id, UniformDistribution.tenant_id == tenant_id).delete()
        except Exception as e:
            logger.warning(f"Child records cleanup for employee {emp_id} encountered: {e}")

        # 2. Delete employee document
        self.emp_repo.delete(db, emp)

        # 3. Delete associated user login account if present
        if user_id:
            user = self.usr_repo.get_by_id(db, user_id=user_id)
            if user and (user.tenant_id == tenant_id or user.role == "employee"):
                self.usr_repo.delete(db, user)

        db.commit()
        logger.info(f"Permanently removed employee {emp_code} (ID: {emp_id}, User: {user_id}, Tenant: {tenant_id})")


employee_service = EmployeeService()
