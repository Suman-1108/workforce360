from typing import List, Optional, Tuple
from app.database.session import Session
from app.database.mongo_odm import or_
from app.models.employee import Employee
from app.models.user import User
from app.models.department import Department
from app.models.branch import Branch


class EmployeeRepository:
    """Data persistence repository for Employee entities with tenant isolation."""

    def get_by_id(self, db: Session, employee_id: int, tenant_id: int) -> Optional[Employee]:
        """Fetch employee by ID bounded strictly by tenant_id."""
        return (
            db.query(Employee)
            .filter(Employee.id == employee_id, Employee.tenant_id == tenant_id)
            .first()
        )

    def get_by_employee_id_number(
        self, db: Session, employee_id_number: str, tenant_id: int
    ) -> Optional[Employee]:
        """Fetch employee by organization badge/id number."""
        return (
            db.query(Employee)
            .filter(
                Employee.employee_id_number == employee_id_number,
                Employee.tenant_id == tenant_id,
            )
            .first()
        )

    def get_by_user_id(self, db: Session, user_id: int, tenant_id: int) -> Optional[Employee]:
        """Fetch employee mapped to a specific user account."""
        return (
            db.query(Employee)
            .filter(Employee.user_id == user_id, Employee.tenant_id == tenant_id)
            .first()
        )

    def list_employees(
        self,
        db: Session,
        tenant_id: int,
        department_id: Optional[int] = None,
        branch_id: Optional[int] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Employee], int]:
        """List employees with filters and pagination, strictly bounded by tenant."""
        query = db.query(Employee).filter(Employee.tenant_id == tenant_id)

        if department_id:
            query = query.filter(Employee.department_id == department_id)
        if branch_id:
            query = query.filter(Employee.branch_id == branch_id)
        if status:
            query = query.filter(Employee.status == status)
        if search:
            search_pattern = f"%{search}%"
            query = query.join(User).filter(
                or_(
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    Employee.employee_id_number.ilike(search_pattern),
                    Employee.designation.ilike(search_pattern),
                )
            )

        total = query.count()
        employees = query.order_by(Employee.id.desc()).offset(skip).limit(limit).all()
        return employees, total

    def count_by_tenant(self, db: Session, tenant_id: int) -> int:
        """Count total employees belonging to tenant."""
        return db.query(Employee).filter(Employee.tenant_id == tenant_id).count()

    def create(self, db: Session, employee: Employee) -> Employee:
        """Persist a new employee entity."""
        db.add(employee)
        db.flush()
        return employee

    def update(self, db: Session, employee: Employee) -> Employee:
        """Update existing employee entity."""
        db.flush()
        return employee

    def delete(self, db: Session, employee: Employee) -> None:
        """Remove employee entity from persistence."""
        db.delete(employee)
        db.flush()


employee_repository = EmployeeRepository()
