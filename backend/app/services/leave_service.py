from datetime import date, datetime, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.leave import LeaveType, LeaveRequest
from app.models.employee import Employee
from app.models.user import User
from app.repositories.leave_repository import leave_repository, LeaveRepository
from app.repositories.employee_repository import employee_repository, EmployeeRepository
from app.schemas.leave_schema import (
    LeaveTypeResponse,
    LeaveTypeListResponse,
    LeaveApplyRequest,
    LeaveActionRequest,
    LeaveResponse,
    LeaveListResponse,
)
from app.core.exceptions import (
    NotFoundException,
    ConflictException,
    ValidationException,
    ForbiddenException,
)
from app.core.logging import logger


class LeaveService:
    """Service coordinating leave requests, entitlements, overlapping checks, and approval actions."""

    def __init__(
        self,
        leave_repo: LeaveRepository = leave_repository,
        emp_repo: EmployeeRepository = employee_repository,
    ):
        self.leave_repo = leave_repo
        self.emp_repo = emp_repo

    def _resolve_employee(
        self, db: Session, tenant_id: int, current_user: User, employee_id: Optional[int] = None
    ) -> Employee:
        if employee_id is not None:
            if current_user.role not in ("owner", "manager", "superadmin"):
                raise ForbiddenException("Only managers or owners may apply for leave on behalf of other staff.")
            emp = self.emp_repo.get_by_id(db, employee_id, tenant_id)
            if not emp:
                raise NotFoundException("Employee", employee_id)
            return emp

        emp = self.emp_repo.get_by_user_id(db, current_user.id, tenant_id)
        if not emp:
            if current_user.role in ("owner", "superadmin"):
                employees, total = self.emp_repo.list_employees(db, tenant_id, limit=1)
                if employees:
                    return employees[0]
            raise ValidationException(
                "Your account is not mapped to an active employee profile. Please provide 'employee_id'."
            )
        return emp

    def _to_response(self, req: LeaveRequest) -> LeaveResponse:
        emp = req.employee
        user = emp.user if emp else None
        emp_name = f"{user.first_name} {user.last_name}".strip() if user else f"Employee #{req.employee_id}"
        badge = emp.employee_id_number if emp else "N/A"

        approver_name = None
        if req.approver:
            approver_name = f"{req.approver.first_name} {req.approver.last_name}".strip()

        return LeaveResponse(
            id=req.id,
            tenant_id=req.tenant_id,
            employee_id=req.employee_id,
            employee_name=emp_name,
            employee_id_number=badge,
            leave_type_id=req.leave_type_id,
            leave_type_name=req.leave_type.name if req.leave_type else "Leave",
            leave_type_code=req.leave_type.code if req.leave_type else None,
            start_date=req.start_date.isoformat(),
            end_date=req.end_date.isoformat(),
            total_days=req.total_days,
            reason=req.reason,
            status=str(req.status),
            approved_by_id=req.approved_by,
            approved_by_name=approver_name,
            rejection_reason=req.rejection_reason,
            actioned_at=req.actioned_at.isoformat() if req.actioned_at else None,
            created_at=req.created_at.isoformat() if req.created_at else "",
        )

    def list_leave_types(self, db: Session, tenant_id: int) -> LeaveTypeListResponse:
        """Fetch all leave categories defined for the organization."""
        types = self.leave_repo.list_leave_types(db, tenant_id)
        items = [LeaveTypeResponse.model_validate(t) for t in types]
        return LeaveTypeListResponse(total=len(items), items=items)

    def apply_leave(
        self, db: Session, tenant_id: int, current_user: User, data: LeaveApplyRequest
    ) -> LeaveResponse:
        """Submit a formal leave request with date verification and overlap protection."""
        if data.start_date > data.end_date:
            raise ValidationException("Leave start date cannot be after end date.")

        lt = self.leave_repo.get_leave_type_by_id(db, data.leave_type_id, tenant_id)
        if not lt or not lt.is_active:
            raise NotFoundException("LeaveType", data.leave_type_id)

        emp = self._resolve_employee(db, tenant_id, current_user, data.employee_id)

        # Overlap check
        has_overlap = self.leave_repo.check_overlapping_leaves(
            db=db,
            employee_id=emp.id,
            tenant_id=tenant_id,
            start_date=data.start_date,
            end_date=data.end_date,
        )
        if has_overlap:
            raise ConflictException(
                f"Employee '{emp.employee_id_number}' already has a pending or approved leave request overlapping {data.start_date} to {data.end_date}."
            )

        total_days = (data.end_date - data.start_date).days + 1

        leave_req = LeaveRequest(
            tenant_id=tenant_id,
            employee_id=emp.id,
            leave_type_id=data.leave_type_id,
            start_date=data.start_date,
            end_date=data.end_date,
            total_days=total_days,
            reason=data.reason.strip(),
            status="Pending",
        )
        leave_req = self.leave_repo.create(db, leave_req)
        db.commit()
        db.refresh(leave_req)
        logger.info(
            f"Created leave request #{leave_req.id} for employee {emp.id} ({total_days} days, Type: {lt.name})"
        )
        return self._to_response(leave_req)

    def action_leave(
        self,
        db: Session,
        tenant_id: int,
        current_user: User,
        leave_id: int,
        data: LeaveActionRequest,
    ) -> LeaveResponse:
        """Approve or reject pending leave request with audit attribution."""
        if current_user.role not in ("owner", "manager", "superadmin"):
            raise ForbiddenException("Only managers or owners may approve or reject leave requests.")

        req = self.leave_repo.get_by_id(db, leave_id, tenant_id)
        if not req:
            raise NotFoundException("LeaveRequest", leave_id)

        if str(req.status) != "Pending":
            raise ConflictException(
                f"Leave request #{leave_id} has already been actioned (Status: {req.status})."
            )

        req.status = data.action
        req.approved_by = current_user.id
        req.actioned_at = datetime.now(timezone.utc)
        if data.action == "Rejected":
            req.rejection_reason = (data.rejection_reason or "Leave request declined by management.").strip()

        self.leave_repo.update(db, req)
        db.commit()
        db.refresh(req)
        logger.info(
            f"Leave #{leave_id} marked as {data.action} by user #{current_user.id}"
        )
        return self._to_response(req)

    def get_leave(self, db: Session, tenant_id: int, leave_id: int) -> LeaveResponse:
        """Retrieve individual leave details."""
        req = self.leave_repo.get_by_id(db, leave_id, tenant_id)
        if not req:
            raise NotFoundException("LeaveRequest", leave_id)
        return self._to_response(req)

    def list_leaves(
        self,
        db: Session,
        tenant_id: int,
        current_user: User,
        employee_id: Optional[int] = None,
        status: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> LeaveListResponse:
        """List leave requests with role-based scoping."""
        # Non-managers can only see their own leave requests
        if current_user.role not in ("owner", "manager", "superadmin"):
            emp = self.emp_repo.get_by_user_id(db, current_user.id, tenant_id)
            employee_id = emp.id if emp else -1

        skip = (page - 1) * page_size
        records, total = self.leave_repo.list_leave_requests(
            db=db,
            tenant_id=tenant_id,
            employee_id=employee_id,
            status=status,
            start_date=start_date,
            end_date=end_date,
            skip=skip,
            limit=page_size,
        )
        items = [self._to_response(r) for r in records]
        return LeaveListResponse(total=total, items=items)


leave_service = LeaveService()
