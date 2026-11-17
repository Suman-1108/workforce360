from datetime import date
from typing import List, Optional, Tuple
from app.database.session import Session
from app.database.mongo_odm import or_, func, and_
from app.models.shift import Shift, EmployeeShift
from app.models.employee import Employee
from app.models.user import User


class ShiftRepository:
    """Repository managing persistence for shift templates and employee schedule assignments."""

    # ----------------------------------------------------
    # Shift Template Operations
    # ----------------------------------------------------
    def get_by_id(self, db: Session, shift_id: int, tenant_id: int) -> Optional[Shift]:
        """Fetch shift by ID bounded strictly by tenant_id."""
        return (
            db.query(Shift)
            .filter(Shift.id == shift_id, Shift.tenant_id == tenant_id)
            .first()
        )

    def get_by_code(self, db: Session, code: str, tenant_id: int) -> Optional[Shift]:
        """Fetch shift by unique code within tenant."""
        return (
            db.query(Shift)
            .filter(Shift.code == code, Shift.tenant_id == tenant_id)
            .first()
        )

    def list_shifts(
        self,
        db: Session,
        tenant_id: int,
        is_active: Optional[bool] = None,
        shift_type: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Shift]:
        """List all shifts for tenant with optional filters."""
        query = db.query(Shift).filter(Shift.tenant_id == tenant_id)
        if is_active is not None:
            query = query.filter(Shift.is_active == is_active)
        if shift_type:
            query = query.filter(Shift.type == shift_type)
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Shift.name.ilike(pattern),
                    Shift.code.ilike(pattern),
                )
            )
        return query.order_by(Shift.start_time.asc()).all()

    def count_assigned_employees(self, db: Session, shift_id: int, tenant_id: int) -> int:
        """Count distinct active employee assignments to this shift."""
        today = date.today()
        return (
            db.query(func.count(EmployeeShift.id))
            .filter(
                EmployeeShift.shift_id == shift_id,
                EmployeeShift.tenant_id == tenant_id,
                EmployeeShift.effective_date <= today,
                or_(
                    EmployeeShift.end_date.is_(None),
                    EmployeeShift.end_date >= today,
                ),
            )
            .scalar()
            or 0
        )

    def create(self, db: Session, shift: Shift) -> Shift:
        """Persist new shift template."""
        db.add(shift)
        db.flush()
        return shift

    def update(self, db: Session, shift: Shift) -> Shift:
        """Commit updates to shift."""
        db.flush()
        return shift

    def delete(self, db: Session, shift: Shift) -> None:
        """Remove shift template."""
        db.delete(shift)
        db.flush()

    # ----------------------------------------------------
    # Employee Shift Assignment Operations
    # ----------------------------------------------------
    def get_assignment_by_id(
        self, db: Session, assignment_id: int, tenant_id: int
    ) -> Optional[EmployeeShift]:
        """Fetch assignment by ID bounded by tenant."""
        return (
            db.query(EmployeeShift)
            .filter(
                EmployeeShift.id == assignment_id,
                EmployeeShift.tenant_id == tenant_id,
            )
            .first()
        )

    def get_active_assignment_for_employee(
        self,
        db: Session,
        employee_id: int,
        tenant_id: int,
        target_date: Optional[date] = None,
    ) -> Optional[EmployeeShift]:
        """Fetch active shift assignment for an employee on a given calendar date."""
        check_date = target_date or date.today()
        return (
            db.query(EmployeeShift)
            .filter(
                EmployeeShift.employee_id == employee_id,
                EmployeeShift.tenant_id == tenant_id,
                EmployeeShift.effective_date <= check_date,
                or_(
                    EmployeeShift.end_date.is_(None),
                    EmployeeShift.end_date >= check_date,
                ),
            )
            .order_by(EmployeeShift.effective_date.desc())
            .first()
        )

    def list_assignments(
        self,
        db: Session,
        tenant_id: int,
        shift_id: Optional[int] = None,
        employee_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[EmployeeShift], int]:
        """Retrieve paginated shift assignments."""
        query = db.query(EmployeeShift).filter(EmployeeShift.tenant_id == tenant_id)
        if shift_id:
            query = query.filter(EmployeeShift.shift_id == shift_id)
        if employee_id:
            query = query.filter(EmployeeShift.employee_id == employee_id)

        total = query.count()
        assignments = (
            query.order_by(EmployeeShift.effective_date.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return assignments, total

    def create_assignment(
        self, db: Session, assignment: EmployeeShift
    ) -> EmployeeShift:
        """Persist new employee shift allocation."""
        db.add(assignment)
        db.flush()
        return assignment

    def delete_assignment(self, db: Session, assignment: EmployeeShift) -> None:
        """Remove shift allocation."""
        db.delete(assignment)
        db.flush()


shift_repository = ShiftRepository()
