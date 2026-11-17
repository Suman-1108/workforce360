from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.tenant import Tenant
from app.models.tenant_setting import TenantSetting
from app.models.department import Department
from app.models.branch import Branch
from app.models.employee import Employee
from app.repositories.organization_repository import (
    organization_repository,
    OrganizationRepository,
)
from app.schemas.organization_schema import (
    OrganizationProfileResponse,
    OrganizationProfileUpdate,
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    DepartmentListResponse,
    BranchCreate,
    BranchUpdate,
    BranchResponse,
    BranchListResponse,
)
from app.schemas.settings_schema import (
    AllSettingsResponse,
    UpdateSettingsRequest,
    OrganizationSettingsModel,
    AttendanceSettingsModel,
    ShiftSettingsModel,
    NotificationSettingsModel,
    SecuritySettingsModel,
)
from app.core.exceptions import NotFoundException, ConflictException, ValidationException
from app.core.logging import logger


class OrganizationService:
    """Service handling multi-tenant business logic for Organizations, Departments, and Branches."""

    def __init__(self, repo: OrganizationRepository = organization_repository):
        self.repo = repo

    # ----------------------------------------------------
    # Tenant Profile Logic
    # ----------------------------------------------------
    def get_profile(self, db: Session, tenant_id: int) -> OrganizationProfileResponse:
        """Fetch tenant profile and aggregate organizational statistics."""
        tenant = self.repo.get_tenant_by_id(db, tenant_id)
        if not tenant:
            raise NotFoundException("Tenant", tenant_id)

        emp_count = (
            db.query(func.count(Employee.id))
            .filter(Employee.tenant_id == tenant_id)
            .scalar()
            or 0
        )
        dept_count = len(self.repo.list_departments(db, tenant_id))
        branch_count = len(self.repo.list_branches(db, tenant_id))

        return OrganizationProfileResponse(
            id=tenant.id,
            uuid=tenant.uuid,
            name=tenant.name,
            subdomain=tenant.subdomain,
            contact_email=tenant.contact_email,
            contact_phone=tenant.contact_phone,
            address=tenant.address,
            logo_url=tenant.logo_url,
            status=str(tenant.status),
            employee_count=emp_count,
            department_count=dept_count,
            branch_count=branch_count,
            created_at=tenant.created_at.isoformat() if tenant.created_at else "",
        )

    def update_profile(
        self, db: Session, tenant_id: int, data: OrganizationProfileUpdate
    ) -> OrganizationProfileResponse:
        """Update company metadata and branding."""
        tenant = self.repo.get_tenant_by_id(db, tenant_id)
        if not tenant:
            raise NotFoundException("Tenant", tenant_id)

        if data.name is not None:
            tenant.name = data.name.strip()
        if data.contact_phone is not None:
            tenant.contact_phone = data.contact_phone.strip()
        if data.address is not None:
            tenant.address = data.address.strip()
        if data.logo_url is not None:
            tenant.logo_url = data.logo_url.strip()

        self.repo.update_tenant(db, tenant)
        db.commit()
        logger.info(f"Updated organization profile for tenant ID {tenant_id}")
        return self.get_profile(db, tenant_id)

    def get_all_settings(self, db: Session, tenant_id: int) -> AllSettingsResponse:
        """Retrieve unified organization, attendance, shift, notification, and security settings."""
        tenant = self.repo.get_tenant_by_id(db, tenant_id)
        if not tenant:
            raise NotFoundException("Tenant", tenant_id)

        setting = self.repo.get_tenant_settings(db, tenant_id)
        if not setting:
            setting = TenantSetting(
                tenant_id=tenant_id,
                city="Chicago",
                state="IL",
                country="United States",
                require_gps=True,
                require_selfie=True,
                geofence_radius_meters=500,
                grace_period_mins=15,
                auto_half_day_under_hours=4.0,
                strict_geofence=True,
                default_working_hours=8.5,
                break_duration_mins=45,
                working_days="Monday,Tuesday,Wednesday,Thursday,Friday",
                allow_overtime=True,
                email_notifications=True,
                in_app_notifications=True,
                leave_alerts=True,
                attendance_alerts=True,
                subscription_reminders=True,
                two_factor_auth=False,
                session_timeout_mins=60,
            )
            self.repo.save_tenant_settings(db, setting)
            db.commit()

        return AllSettingsResponse(
            organization=OrganizationSettingsModel(
                name=tenant.name,
                contact_email=tenant.contact_email,
                contact_phone=tenant.contact_phone,
                address=tenant.address,
                city=setting.city or "Chicago",
                state=setting.state or "IL",
                country=setting.country or "United States",
                logo_url=tenant.logo_url,
            ),
            attendance=AttendanceSettingsModel(
                require_gps=setting.require_gps,
                require_selfie=setting.require_selfie,
                geofence_radius_meters=setting.geofence_radius_meters,
                grace_period_mins=setting.grace_period_mins,
                auto_half_day_under_hours=setting.auto_half_day_under_hours,
                strict_geofence=setting.strict_geofence,
            ),
            shift=ShiftSettingsModel(
                default_working_hours=setting.default_working_hours,
                break_duration_mins=setting.break_duration_mins,
                working_days=setting.working_days,
                allow_overtime=setting.allow_overtime,
            ),
            notifications=NotificationSettingsModel(
                email_notifications=setting.email_notifications,
                in_app_notifications=setting.in_app_notifications,
                leave_alerts=setting.leave_alerts,
                attendance_alerts=setting.attendance_alerts,
                subscription_reminders=setting.subscription_reminders,
            ),
            security=SecuritySettingsModel(
                two_factor_auth=setting.two_factor_auth,
                session_timeout_mins=setting.session_timeout_mins,
            ),
        )

    def update_all_settings(
        self, db: Session, tenant_id: int, data: UpdateSettingsRequest
    ) -> AllSettingsResponse:
        """Update any subset or all organization, attendance, shift, notification, and security settings."""
        tenant = self.repo.get_tenant_by_id(db, tenant_id)
        if not tenant:
            raise NotFoundException("Tenant", tenant_id)

        setting = self.repo.get_tenant_settings(db, tenant_id)
        if not setting:
            setting = TenantSetting(tenant_id=tenant_id)
            self.repo.save_tenant_settings(db, setting)

        # Update organization tenant attributes if present
        if data.organization:
            if data.organization.name is not None:
                tenant.name = data.organization.name.strip()
            if data.organization.contact_phone is not None:
                tenant.contact_phone = data.organization.contact_phone.strip()
            if data.organization.address is not None:
                tenant.address = data.organization.address.strip()
            if data.organization.logo_url is not None:
                tenant.logo_url = data.organization.logo_url.strip()
            if data.organization.city is not None:
                setting.city = data.organization.city.strip()
            if data.organization.state is not None:
                setting.state = data.organization.state.strip()
            if data.organization.country is not None:
                setting.country = data.organization.country.strip()

        # Update attendance settings if present
        if data.attendance:
            setting.require_gps = data.attendance.require_gps
            setting.require_selfie = data.attendance.require_selfie
            setting.geofence_radius_meters = data.attendance.geofence_radius_meters
            setting.grace_period_mins = data.attendance.grace_period_mins
            setting.auto_half_day_under_hours = data.attendance.auto_half_day_under_hours
            setting.strict_geofence = data.attendance.strict_geofence

        # Update shift settings if present
        if data.shift:
            setting.default_working_hours = data.shift.default_working_hours
            setting.break_duration_mins = data.shift.break_duration_mins
            setting.working_days = data.shift.working_days
            setting.allow_overtime = data.shift.allow_overtime

        # Update notifications settings if present
        if data.notifications:
            setting.email_notifications = data.notifications.email_notifications
            setting.in_app_notifications = data.notifications.in_app_notifications
            setting.leave_alerts = data.notifications.leave_alerts
            setting.attendance_alerts = data.notifications.attendance_alerts
            setting.subscription_reminders = data.notifications.subscription_reminders

        # Update security settings if present
        if data.security:
            setting.two_factor_auth = data.security.two_factor_auth
            setting.session_timeout_mins = data.security.session_timeout_mins

        self.repo.update_tenant(db, tenant)
        self.repo.save_tenant_settings(db, setting)
        db.commit()
        logger.info(f"Updated unified settings for tenant ID {tenant_id}")
        return self.get_all_settings(db, tenant_id)

    # ----------------------------------------------------
    # Department Logic
    # ----------------------------------------------------
    def _to_dept_response(
        self, db: Session, dept: Department, tenant_id: int
    ) -> DepartmentResponse:
        count = self.repo.count_department_employees(db, dept.id, tenant_id)
        return DepartmentResponse(
            id=dept.id,
            tenant_id=dept.tenant_id,
            name=dept.name,
            code=dept.code,
            description=dept.description,
            manager_name=dept.manager_name,
            employee_count=count,
            created_at=dept.created_at.isoformat() if dept.created_at else "",
            updated_at=dept.updated_at.isoformat() if dept.updated_at else "",
        )

    def list_departments(
        self, db: Session, tenant_id: int, search: Optional[str] = None
    ) -> DepartmentListResponse:
        """Retrieve all tenant departments with real-time employee counts."""
        departments = self.repo.list_departments(db, tenant_id, search=search)
        items = [self._to_dept_response(db, d, tenant_id) for d in departments]
        return DepartmentListResponse(total=len(items), items=items)

    def get_department(
        self, db: Session, tenant_id: int, department_id: int
    ) -> DepartmentResponse:
        """Retrieve department details."""
        dept = self.repo.get_department_by_id(db, department_id, tenant_id)
        if not dept:
            raise NotFoundException("Department", department_id)
        return self._to_dept_response(db, dept, tenant_id)

    def create_department(
        self, db: Session, tenant_id: int, data: DepartmentCreate
    ) -> DepartmentResponse:
        """Provision a new department within the tenant."""
        code = data.code.strip().upper() if data.code else None
        if code:
            existing = self.repo.get_department_by_code(db, code, tenant_id)
            if existing:
                raise ConflictException(f"Department code '{code}' already exists in your organization.")

        dept = Department(
            tenant_id=tenant_id,
            name=data.name.strip(),
            code=code,
            description=data.description.strip() if data.description else None,
            manager_name=data.manager_name.strip() if data.manager_name else None,
        )
        dept = self.repo.create_department(db, dept)
        db.commit()
        db.refresh(dept)
        logger.info(f"Created department '{dept.name}' ({dept.code}) for tenant {tenant_id}")
        return self._to_dept_response(db, dept, tenant_id)

    def update_department(
        self, db: Session, tenant_id: int, department_id: int, data: DepartmentUpdate
    ) -> DepartmentResponse:
        """Update existing department."""
        dept = self.repo.get_department_by_id(db, department_id, tenant_id)
        if not dept:
            raise NotFoundException("Department", department_id)

        if data.code is not None:
            new_code = data.code.strip().upper() if data.code else None
            if new_code and new_code != dept.code:
                existing = self.repo.get_department_by_code(db, new_code, tenant_id)
                if existing and existing.id != department_id:
                    raise ConflictException(f"Department code '{new_code}' already exists in your organization.")
            dept.code = new_code

        if data.name is not None:
            dept.name = data.name.strip()
        if data.description is not None:
            dept.description = data.description.strip() if data.description else None
        if data.manager_name is not None:
            dept.manager_name = data.manager_name.strip() if data.manager_name else None

        self.repo.update_department(db, dept)
        db.commit()
        db.refresh(dept)
        return self._to_dept_response(db, dept, tenant_id)

    def delete_department(self, db: Session, tenant_id: int, department_id: int) -> None:
        """Delete department if no active employees are assigned."""
        dept = self.repo.get_department_by_id(db, department_id, tenant_id)
        if not dept:
            raise NotFoundException("Department", department_id)

        emp_count = self.repo.count_department_employees(db, department_id, tenant_id)
        if emp_count > 0:
            raise ConflictException(
                f"Cannot delete department '{dept.name}'. {emp_count} active employees are currently assigned to it."
            )

        self.repo.delete_department(db, dept)
        db.commit()
        logger.info(f"Deleted department ID {department_id} for tenant {tenant_id}")

    # ----------------------------------------------------
    # Branch & Geofence Logic
    # ----------------------------------------------------
    def _to_branch_response(
        self, db: Session, branch: Branch, tenant_id: int
    ) -> BranchResponse:
        count = self.repo.count_branch_employees(db, branch.id, tenant_id)
        return BranchResponse(
            id=branch.id,
            tenant_id=branch.tenant_id,
            name=branch.name,
            code=branch.code,
            address=branch.address,
            city=branch.city,
            state=branch.state,
            latitude=float(branch.latitude),
            longitude=float(branch.longitude),
            radius_meters=branch.radius_meters,
            is_active=branch.is_active,
            employee_count=count,
            created_at=branch.created_at.isoformat() if branch.created_at else "",
            updated_at=branch.updated_at.isoformat() if branch.updated_at else "",
        )

    def list_branches(
        self,
        db: Session,
        tenant_id: int,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> BranchListResponse:
        """List physical branches and coordinates."""
        branches = self.repo.list_branches(db, tenant_id, is_active=is_active, search=search)
        items = [self._to_branch_response(db, b, tenant_id) for b in branches]
        return BranchListResponse(total=len(items), items=items)

    def get_branch(self, db: Session, tenant_id: int, branch_id: int) -> BranchResponse:
        """Fetch branch details with radius boundary."""
        branch = self.repo.get_branch_by_id(db, branch_id, tenant_id)
        if not branch:
            raise NotFoundException("Branch", branch_id)
        return self._to_branch_response(db, branch, tenant_id)

    def create_branch(
        self, db: Session, tenant_id: int, data: BranchCreate
    ) -> BranchResponse:
        """Provision physical branch with geofence boundary."""
        code = data.code.strip().upper() if data.code else None
        if code:
            existing = self.repo.get_branch_by_code(db, code, tenant_id)
            if existing:
                raise ConflictException(f"Branch code '{code}' already exists in your organization.")

        branch = Branch(
            tenant_id=tenant_id,
            name=data.name.strip(),
            code=code,
            address=data.address.strip() if data.address else None,
            city=data.city.strip() if data.city else None,
            state=data.state.strip() if data.state else None,
            latitude=data.latitude,
            longitude=data.longitude,
            radius_meters=data.radius_meters,
            is_active=data.is_active,
        )
        branch = self.repo.create_branch(db, branch)
        db.commit()
        db.refresh(branch)
        logger.info(f"Registered physical branch '{branch.name}' (Radius: {branch.radius_meters}m) for tenant {tenant_id}")
        return self._to_branch_response(db, branch, tenant_id)

    def update_branch(
        self, db: Session, tenant_id: int, branch_id: int, data: BranchUpdate
    ) -> BranchResponse:
        """Update branch location and geofence parameters."""
        branch = self.repo.get_branch_by_id(db, branch_id, tenant_id)
        if not branch:
            raise NotFoundException("Branch", branch_id)

        if data.code is not None:
            new_code = data.code.strip().upper() if data.code else None
            if new_code and new_code != branch.code:
                existing = self.repo.get_branch_by_code(db, new_code, tenant_id)
                if existing and existing.id != branch_id:
                    raise ConflictException(f"Branch code '{new_code}' already exists in your organization.")
            branch.code = new_code

        if data.name is not None:
            branch.name = data.name.strip()
        if data.address is not None:
            branch.address = data.address.strip() if data.address else None
        if data.city is not None:
            branch.city = data.city.strip() if data.city else None
        if data.state is not None:
            branch.state = data.state.strip() if data.state else None
        if data.latitude is not None:
            branch.latitude = data.latitude
        if data.longitude is not None:
            branch.longitude = data.longitude
        if data.radius_meters is not None:
            branch.radius_meters = data.radius_meters
        if data.is_active is not None:
            branch.is_active = data.is_active

        self.repo.update_branch(db, branch)
        db.commit()
        db.refresh(branch)
        return self._to_branch_response(db, branch, tenant_id)

    def delete_branch(self, db: Session, tenant_id: int, branch_id: int) -> None:
        """Remove physical branch if unlinked."""
        branch = self.repo.get_branch_by_id(db, branch_id, tenant_id)
        if not branch:
            raise NotFoundException("Branch", branch_id)

        emp_count = self.repo.count_branch_employees(db, branch_id, tenant_id)
        if emp_count > 0:
            raise ConflictException(
                f"Cannot delete branch '{branch.name}'. {emp_count} active employees are currently assigned to it."
            )

        self.repo.delete_branch(db, branch)
        db.commit()
        logger.info(f"Deleted branch ID {branch_id} for tenant {tenant_id}")


organization_service = OrganizationService()
