from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.user import User
from app.repositories.employee_repository import employee_repository, EmployeeRepository
from app.repositories.user_repository import user_repository, UserRepository
from app.services.entitlement_service import entitlement_service, EntitlementService
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
        """Map SQLAlchemy Employee entity into clean Pydantic response."""
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

        # 4. Create User entity
        password = data.password or "WorkForce@2026"
        clean_phone = format_e164_or_international(data.phone) if data.phone else None
        clean_emergency = format_e164_or_international(data.emergency_contact) if data.emergency_contact else None
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

        # 5. Create Employee profile
        employee = Employee(
            tenant_id=tenant_id,
            user_id=user.id,
            employee_id_number=data.employee_id_number,
            department_id=data.department_id,
            branch_id=data.branch_id,
            designation=data.designation,
            employment_type=data.employment_type.value if hasattr(data.employment_type, "value") else str(data.employment_type),
            joining_date=data.joining_date,
            salary=data.salary,
            status=data.status.value if hasattr(data.status, "value") else str(data.status),
            emergency_contact=clean_emergency,
        )
        self.emp_repo.create(db, employee)

        db.commit()
        db.refresh(employee)
        logger.info(f"Enrolled employee {employee.employee_id_number} (Tenant: {tenant_id})")
        return self._to_response(employee)

    def update_employee(
        self, db: Session, employee_id: int, tenant_id: int, data: EmployeeUpdate
    ) -> EmployeeResponse:
        """Update employee and linked user details."""
        emp = self.emp_repo.get_by_id(db, employee_id=employee_id, tenant_id=tenant_id)
        if not emp:
            raise NotFoundException("Employee", employee_id)

        # Update User fields if provided
        u = emp.user
        if u:
            if data.first_name is not None:
                u.first_name = data.first_name
            if data.last_name is not None:
                u.last_name = data.last_name
            if data.phone is not None:
                u.phone = format_e164_or_international(data.phone) if data.phone else None

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


employee_service = EmployeeService()
