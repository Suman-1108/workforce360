from datetime import date
from typing import List, Optional, Tuple
from app.database.session import Session
from app.database.mongo_odm import and_, or_
from app.models.leave import LeaveType, LeaveRequest
from app.models.employee import Employee
from app.models.user import User


class LeaveRepository:
    """Repository managing leave categories, balances, and request workflows."""

    def list_leave_types(self, db: Session, tenant_id: int) -> List[LeaveType]:
        """Fetch all operational leave categories for tenant."""
        return (
            db.query(LeaveType)
            .filter(LeaveType.tenant_id == tenant_id, LeaveType.is_active == True)
            .order_by(LeaveType.id.asc())
            .all()
        )

    def get_leave_type_by_id(
        self, db: Session, leave_type_id: int, tenant_id: int
    ) -> Optional[LeaveType]:
        """Fetch leave category by ID bounded by tenant."""
        return (
            db.query(LeaveType)
            .filter(LeaveType.id == leave_type_id, LeaveType.tenant_id == tenant_id)
            .first()
        )

    def get_by_id(
        self, db: Session, leave_id: int, tenant_id: int
    ) -> Optional[LeaveRequest]:
        """Fetch leave request by ID with tenant bounding."""
        return (
            db.query(LeaveRequest)
            .filter(LeaveRequest.id == leave_id, LeaveRequest.tenant_id == tenant_id)
            .first()
        )

    def check_overlapping_leaves(
        self,
        db: Session,
        employee_id: int,
        tenant_id: int,
        start_date: date,
        end_date: date,
        exclude_id: Optional[int] = None,
    ) -> bool:
        """Check if employee has an active/pending leave overlapping the requested date range."""
        query = db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == employee_id,
            LeaveRequest.tenant_id == tenant_id,
            LeaveRequest.status.in_(["Pending", "Approved"]),
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date,
        )
        if exclude_id:
            query = query.filter(LeaveRequest.id != exclude_id)
        return query.first() is not None

    def list_leave_requests(
        self,
        db: Session,
        tenant_id: int,
        employee_id: Optional[int] = None,
        status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[LeaveRequest], int]:
        """Retrieve paginated leave requests."""
        query = db.query(LeaveRequest).filter(LeaveRequest.tenant_id == tenant_id)

        if employee_id:
            query = query.filter(LeaveRequest.employee_id == employee_id)
        if status:
            query = query.filter(LeaveRequest.status == status)
        if start_date:
            query = query.filter(LeaveRequest.start_date >= start_date)
        if end_date:
            query = query.filter(LeaveRequest.end_date <= end_date)

        total = query.count()
        records = (
            query.order_by(LeaveRequest.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return records, total

    def create(self, db: Session, leave_request: LeaveRequest) -> LeaveRequest:
        """Persist a new leave application."""
        db.add(leave_request)
        db.flush()
        return leave_request

    def update(self, db: Session, leave_request: LeaveRequest) -> LeaveRequest:
        """Commit status transition on leave application."""
        db.flush()
        return leave_request


leave_repository = LeaveRepository()
