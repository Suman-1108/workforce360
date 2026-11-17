from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from app.models.tenant import Tenant
from app.models.tenant_setting import TenantSetting
from app.models.department import Department
from app.models.branch import Branch
from app.models.employee import Employee


class OrganizationRepository:
    """Repository handling data access for Tenants, Departments, and Physical Branches."""

    # ----------------------------------------------------
    # Tenant Operations
    # ----------------------------------------------------
    def get_tenant_by_id(self, db: Session, tenant_id: int) -> Optional[Tenant]:
        """Fetch tenant by its primary ID."""
        return db.query(Tenant).filter(Tenant.id == tenant_id).first()

    def update_tenant(self, db: Session, tenant: Tenant) -> Tenant:
        """Commit updates to tenant entity."""
        db.flush()
        return tenant

    def get_tenant_settings(self, db: Session, tenant_id: int) -> Optional[TenantSetting]:
        """Fetch tenant settings by tenant_id."""
        return db.query(TenantSetting).filter(TenantSetting.tenant_id == tenant_id).first()

    def save_tenant_settings(self, db: Session, settings: TenantSetting) -> TenantSetting:
        """Persist or update tenant settings."""
        db.add(settings)
        db.flush()
        return settings

    # ----------------------------------------------------
    # Department Operations
    # ----------------------------------------------------
    def get_department_by_id(
        self, db: Session, department_id: int, tenant_id: int
    ) -> Optional[Department]:
        """Fetch department by ID bounded strictly by tenant_id."""
        return (
            db.query(Department)
            .filter(Department.id == department_id, Department.tenant_id == tenant_id)
            .first()
        )

    def get_department_by_code(
        self, db: Session, code: str, tenant_id: int
    ) -> Optional[Department]:
        """Fetch department by unique shortcode within tenant."""
        return (
            db.query(Department)
            .filter(Department.code == code, Department.tenant_id == tenant_id)
            .first()
        )

    def list_departments(
        self, db: Session, tenant_id: int, search: Optional[str] = None
    ) -> List[Department]:
        """List all departments belonging to tenant with optional search."""
        query = db.query(Department).filter(Department.tenant_id == tenant_id)
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Department.name.ilike(pattern),
                    Department.code.ilike(pattern),
                    Department.manager_name.ilike(pattern),
                )
            )
        return query.order_by(Department.name.asc()).all()

    def count_department_employees(
        self, db: Session, department_id: int, tenant_id: int
    ) -> int:
        """Count active employees assigned to this department."""
        return (
            db.query(func.count(Employee.id))
            .filter(
                Employee.department_id == department_id,
                Employee.tenant_id == tenant_id,
            )
            .scalar()
            or 0
        )

    def create_department(self, db: Session, department: Department) -> Department:
        """Persist a new department."""
        db.add(department)
        db.flush()
        return department

    def update_department(self, db: Session, department: Department) -> Department:
        """Commit updates to existing department."""
        db.flush()
        return department

    def delete_department(self, db: Session, department: Department) -> None:
        """Remove department record."""
        db.delete(department)
        db.flush()

    # ----------------------------------------------------
    # Branch & Geofence Operations
    # ----------------------------------------------------
    def get_branch_by_id(
        self, db: Session, branch_id: int, tenant_id: int
    ) -> Optional[Branch]:
        """Fetch branch by ID bounded strictly by tenant_id."""
        return (
            db.query(Branch)
            .filter(Branch.id == branch_id, Branch.tenant_id == tenant_id)
            .first()
        )

    def get_branch_by_code(
        self, db: Session, code: str, tenant_id: int
    ) -> Optional[Branch]:
        """Fetch branch by unique shortcode within tenant."""
        return (
            db.query(Branch)
            .filter(Branch.code == code, Branch.tenant_id == tenant_id)
            .first()
        )

    def list_branches(
        self,
        db: Session,
        tenant_id: int,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ) -> List[Branch]:
        """List physical branches bounded by tenant."""
        query = db.query(Branch).filter(Branch.tenant_id == tenant_id)
        if is_active is not None:
            query = query.filter(Branch.is_active == is_active)
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Branch.name.ilike(pattern),
                    Branch.code.ilike(pattern),
                    Branch.city.ilike(pattern),
                    Branch.state.ilike(pattern),
                )
            )
        return query.order_by(Branch.name.asc()).all()

    def count_branch_employees(
        self, db: Session, branch_id: int, tenant_id: int
    ) -> int:
        """Count active employees assigned to this branch."""
        return (
            db.query(func.count(Employee.id))
            .filter(
                Employee.branch_id == branch_id,
                Employee.tenant_id == tenant_id,
            )
            .scalar()
            or 0
        )

    def create_branch(self, db: Session, branch: Branch) -> Branch:
        """Persist a new physical branch entity."""
        db.add(branch)
        db.flush()
        return branch

    def update_branch(self, db: Session, branch: Branch) -> Branch:
        """Commit updates to branch entity."""
        db.flush()
        return branch

    def delete_branch(self, db: Session, branch: Branch) -> None:
        """Remove physical branch record."""
        db.delete(branch)
        db.flush()


organization_repository = OrganizationRepository()
