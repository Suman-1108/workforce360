from datetime import date, datetime, timezone
from typing import Optional, List
from app.database.session import Session
from app.models.uniform import UniformItem, UniformDistribution
from app.models.employee import Employee
from app.models.user import User
from app.repositories.uniform_repository import uniform_repository, UniformRepository
from app.repositories.employee_repository import employee_repository, EmployeeRepository
from app.schemas.uniform_schema import (
    UniformItemCreate,
    UniformItemUpdate,
    UniformItemResponse,
    UniformItemListResponse,
    UniformIssueRequest,
    UniformReturnRequest,
    UniformDistributionResponse,
    UniformDistributionListResponse,
    UniformBulkIssueRequest,
    UniformBulkIssueResponse,
    MyUniformItemResponse,
)
from app.core.exceptions import NotFoundException, ConflictException, ValidationException
from app.core.logging import logger


class UniformService:
    """Service handling multi-tenant uniform warehouse stock, sizing allocations, and distribution logs."""

    def __init__(
        self,
        uniform_repo: UniformRepository = uniform_repository,
        emp_repo: EmployeeRepository = employee_repository,
    ):
        self.uniform_repo = uniform_repo
        self.emp_repo = emp_repo

    def _to_item_response(self, item: UniformItem) -> UniformItemResponse:
        available = max(0, item.total_stock - item.distributed_stock)
        return UniformItemResponse(
            id=item.id,
            tenant_id=item.tenant_id,
            name=item.name,
            code=item.code,
            category=item.category,
            gender_group=item.gender_group or "Unisex",
            model_image_url=item.model_image_url,
            description=item.description,
            colors=item.colors,
            items_breakdown=item.items_breakdown,
            sizes_available=item.sizes_available,
            total_stock=item.total_stock,
            distributed_stock=item.distributed_stock,
            available_stock=available,
            is_active=item.is_active,
            is_archived=item.is_archived,
            created_at=item.created_at.isoformat() if item.created_at else "",
        )

    def _to_dist_response(self, dist: UniformDistribution) -> UniformDistributionResponse:
        emp = dist.employee
        user = emp.user if emp else None
        emp_name = f"{user.first_name} {user.last_name}".strip() if user else f"Employee #{dist.employee_id}"
        badge = emp.employee_id_number if emp else "N/A"
        item_name = dist.uniform_item.name if dist.uniform_item else "Unknown Item"

        return UniformDistributionResponse(
            id=dist.id,
            tenant_id=dist.tenant_id,
            employee_id=dist.employee_id,
            employee_name=emp_name,
            employee_id_number=badge,
            uniform_item_id=dist.uniform_item_id,
            uniform_item_name=item_name,
            size=dist.size,
            quantity=dist.quantity,
            issued_date=dist.issued_date.isoformat(),
            status=str(dist.status),
            notes=dist.notes,
            created_at=dist.created_at.isoformat() if dist.created_at else "",
        )

    # ----------------------------------------------------
    # Inventory Catalog Management
    # ----------------------------------------------------
    def list_items(
        self,
        db: Session,
        tenant_id: int,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> UniformItemListResponse:
        """List uniform inventory items with real-time stock balance."""
        items = self.uniform_repo.list_items(db, tenant_id, category=category, search=search)
        responses = [self._to_item_response(i) for i in items]
        return UniformItemListResponse(total=len(responses), items=responses)

    def get_item(self, db: Session, tenant_id: int, item_id: int) -> UniformItemResponse:
        """Fetch item details from catalog."""
        item = self.uniform_repo.get_item_by_id(db, item_id, tenant_id)
        if not item:
            raise NotFoundException("UniformItem", item_id)
        return self._to_item_response(item)

    def create_item(
        self, db: Session, tenant_id: int, data: UniformItemCreate
    ) -> UniformItemResponse:
        """Add a new SKU/gear definition to inventory."""
        item = UniformItem(
            tenant_id=tenant_id,
            name=data.name.strip(),
            code=data.code.strip() if data.code else f"UNIF-{tenant_id}-{int(datetime.now().timestamp()) % 10000}",
            category=data.category.strip() if data.category else "Corporate & Executive",
            gender_group=data.gender_group.strip() if data.gender_group else "Unisex",
            model_image_url=data.model_image_url.strip() if data.model_image_url else None,
            description=data.description.strip() if data.description else None,
            colors=data.colors.strip() if data.colors else None,
            items_breakdown=data.items_breakdown.strip() if data.items_breakdown else None,
            sizes_available=data.sizes_available.strip() if data.sizes_available else None,
            total_stock=data.total_stock,
            distributed_stock=0,
            is_active=data.is_active,
            is_archived=False,
        )
        item = self.uniform_repo.create_item(db, item)
        db.commit()
        db.refresh(item)
        logger.info(f"Registered uniform item '{item.name}' (Stock: {item.total_stock}) for tenant {tenant_id}")
        return self._to_item_response(item)

    def update_item(
        self, db: Session, tenant_id: int, item_id: int, data: UniformItemUpdate
    ) -> UniformItemResponse:
        """Update catalog information or restock inventory."""
        item = self.uniform_repo.get_item_by_id(db, item_id, tenant_id)
        if not item:
            raise NotFoundException("UniformItem", item_id)

        if data.name is not None:
            item.name = data.name.strip()
        if data.code is not None:
            item.code = data.code.strip()
        if data.category is not None:
            item.category = data.category.strip()
        if data.gender_group is not None:
            item.gender_group = data.gender_group.strip()
        if data.model_image_url is not None:
            item.model_image_url = data.model_image_url.strip()
        if data.description is not None:
            item.description = data.description.strip()
        if data.colors is not None:
            item.colors = data.colors.strip()
        if data.items_breakdown is not None:
            item.items_breakdown = data.items_breakdown.strip()
        if data.sizes_available is not None:
            item.sizes_available = data.sizes_available.strip()
        if data.is_active is not None:
            item.is_active = data.is_active
        if data.is_archived is not None:
            item.is_archived = data.is_archived
        if data.total_stock is not None:
            if data.total_stock < item.distributed_stock:
                raise ValidationException(
                    f"Total stock ({data.total_stock}) cannot be less than currently distributed stock ({item.distributed_stock})."
                )
            item.total_stock = data.total_stock

        self.uniform_repo.update_item(db, item)
        db.commit()
        db.refresh(item)
        return self._to_item_response(item)

    def delete_item(self, db: Session, tenant_id: int, item_id: int) -> None:
        """Delete inventory item if no issued units exist."""
        item = self.uniform_repo.get_item_by_id(db, item_id, tenant_id)
        if not item:
            raise NotFoundException("UniformItem", item_id)

        if item.distributed_stock > 0:
            raise ConflictException(
                f"Cannot delete uniform item '{item.name}'. {item.distributed_stock} units are currently issued to personnel."
            )

        self.uniform_repo.delete_item(db, item)
        db.commit()
        logger.info(f"Deleted uniform item ID {item_id} for tenant {tenant_id}")

    # ----------------------------------------------------
    # Distribution & Issuance
    # ----------------------------------------------------
    def issue_uniform(
        self, db: Session, tenant_id: int, data: UniformIssueRequest
    ) -> UniformDistributionResponse:
        """Issue uniform to employee and atomically deduct from available stock."""
        item = self.uniform_repo.get_item_by_id(db, data.uniform_item_id, tenant_id)
        if not item:
            raise NotFoundException("UniformItem", data.uniform_item_id)

        emp = self.emp_repo.get_by_id(db, data.employee_id, tenant_id)
        if not emp:
            raise NotFoundException("Employee", data.employee_id)

        available = item.total_stock - item.distributed_stock
        if data.quantity > available:
            raise ConflictException(
                f"Insufficient stock for '{item.name}'. Available: {available}, Requested: {data.quantity}."
            )

        # Allocate stock
        item.distributed_stock += data.quantity
        self.uniform_repo.update_item(db, item)

        dist = UniformDistribution(
            tenant_id=tenant_id,
            employee_id=data.employee_id,
            uniform_item_id=data.uniform_item_id,
            size=data.size.strip().upper(),
            quantity=data.quantity,
            issued_date=date.today(),
            status="Issued",
            notes=data.notes.strip() if data.notes else None,
        )
        dist = self.uniform_repo.create_distribution(db, dist)
        db.commit()
        db.refresh(dist)
        logger.info(f"Issued {data.quantity}x {item.name} ({data.size}) to employee #{emp.id}")
        return self._to_dist_response(dist)

    def return_uniform(
        self, db: Session, tenant_id: int, dist_id: int, data: UniformReturnRequest
    ) -> UniformDistributionResponse:
        """Record return, damage, or loss of uniform asset with stock reconciliation."""
        dist = self.uniform_repo.get_distribution_by_id(db, dist_id, tenant_id)
        if not dist:
            raise NotFoundException("UniformDistribution", dist_id)

        if dist.status != "Issued":
            raise ConflictException(
                f"Uniform asset distribution #{dist_id} has already been actioned (Status: {dist.status})."
            )

        item = dist.uniform_item
        if data.status == "Returned" and item:
            # Reclaim available inventory
            item.distributed_stock = max(0, item.distributed_stock - dist.quantity)
            self.uniform_repo.update_item(db, item)

        dist.status = data.status
        if data.notes:
            dist.notes = f"{dist.notes or ''}; Return note: {data.notes}".strip("; ")

        self.uniform_repo.update_distribution(db, dist)
        db.commit()
        db.refresh(dist)
        logger.info(f"Distribution #{dist_id} updated to {data.status}")
        return self._to_dist_response(dist)

    def list_distributions(
        self,
        db: Session,
        tenant_id: int,
        employee_id: Optional[int] = None,
        uniform_item_id: Optional[int] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> UniformDistributionListResponse:
        """List uniform asset allocations across the organization."""
        skip = (page - 1) * page_size
        records, total = self.uniform_repo.list_distributions(
            db=db,
            tenant_id=tenant_id,
            employee_id=employee_id,
            uniform_item_id=uniform_item_id,
            status=status,
            skip=skip,
            limit=page_size,
        )
        items = [self._to_dist_response(d) for d in records]
        return UniformDistributionListResponse(total=total, items=items)

    def bulk_issue_uniform(
        self, db: Session, tenant_id: int, data: UniformBulkIssueRequest
    ) -> UniformBulkIssueResponse:
        """Assign uniform gear to multiple employees, or by entire department/branch."""
        item = self.uniform_repo.get_item_by_id(db, data.uniform_item_id, tenant_id)
        if not item:
            raise NotFoundException("UniformItem", data.uniform_item_id)

        # Determine target employees
        query = db.query(Employee).filter(Employee.tenant_id == tenant_id, Employee.status == "Active")
        if data.employee_ids:
            query = query.filter(Employee.id.in_(data.employee_ids))
        elif data.department_id:
            query = query.filter(Employee.department_id == data.department_id)
        elif data.branch_id:
            query = query.filter(Employee.branch_id == data.branch_id)
        else:
            raise ValidationException("Please specify employee IDs, department ID, or branch ID for assignment.")

        target_emps = query.all()
        if not target_emps:
            raise ValidationException("No active employees found matching the specified assignment criteria.")

        total_units_needed = len(target_emps) * data.quantity
        available_stock = item.total_stock - item.distributed_stock
        if total_units_needed > available_stock:
            raise ConflictException(
                f"Insufficient stock for '{item.name}'. Available: {available_stock}, Needed for {len(target_emps)} staff: {total_units_needed}."
            )

        # Parse issued date if given
        parsed_date = date.today()
        if data.issued_date:
            try:
                parsed_date = date.fromisoformat(data.issued_date)
            except ValueError:
                parsed_date = date.today()

        issued_records = []
        for emp in target_emps:
            dist = UniformDistribution(
                tenant_id=tenant_id,
                employee_id=emp.id,
                uniform_item_id=item.id,
                size=data.size.strip().upper(),
                quantity=data.quantity,
                issued_date=parsed_date,
                status="Issued",
                notes=data.notes.strip() if data.notes else None,
            )
            dist = self.uniform_repo.create_distribution(db, dist)
            issued_records.append(dist)

        item.distributed_stock += total_units_needed
        self.uniform_repo.update_item(db, item)
        db.commit()

        for d in issued_records:
            db.refresh(d)

        logger.info(
            f"Bulk issued {total_units_needed}x {item.name} across {len(target_emps)} employees in tenant {tenant_id}"
        )
        return UniformBulkIssueResponse(
            total_assigned=len(issued_records),
            uniform_item_name=item.name,
            items=[self._to_dist_response(d) for d in issued_records],
        )

    def get_my_uniforms(self, db: Session, user: User) -> List[MyUniformItemResponse]:
        """Retrieve uniforms issued to the current authenticated employee."""
        emp = db.query(Employee).filter(Employee.user_id == user.id).first()
        if not emp:
            return []

        dists = (
            db.query(UniformDistribution)
            .filter(
                UniformDistribution.employee_id == emp.id,
                UniformDistribution.tenant_id == emp.tenant_id,
            )
            .order_by(UniformDistribution.issued_date.desc())
            .all()
        )

        results = []
        for d in dists:
            item = d.uniform_item
            if not item:
                continue
            results.append(
                MyUniformItemResponse(
                    distribution_id=d.id,
                    uniform_item_id=item.id,
                    name=item.name,
                    code=item.code,
                    category=item.category,
                    model_image_url=item.model_image_url,
                    description=item.description,
                    colors=item.colors,
                    items_breakdown=item.items_breakdown,
                    size=d.size,
                    quantity=d.quantity,
                    issued_date=d.issued_date.isoformat(),
                    status=str(d.status),
                    notes=d.notes,
                )
            )
        return results


uniform_service = UniformService()
