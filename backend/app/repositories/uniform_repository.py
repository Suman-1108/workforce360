from typing import List, Optional, Tuple
from app.database.session import Session
from app.database.mongo_odm import or_
from app.models.uniform import UniformItem, UniformDistribution
from app.models.employee import Employee
from app.models.user import User


class UniformRepository:
    """Repository managing catalog inventory and employee distribution records."""

    def list_items(
        self,
        db: Session,
        tenant_id: int,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[UniformItem]:
        """Fetch all uniform items for tenant with optional category/search filters."""
        query = db.query(UniformItem).filter(UniformItem.tenant_id == tenant_id)
        if category:
            query = query.filter(UniformItem.category == category)
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    UniformItem.name.ilike(pattern),
                    UniformItem.category.ilike(pattern),
                )
            )
        return query.order_by(UniformItem.name.asc()).all()

    def get_item_by_id(
        self, db: Session, item_id: int, tenant_id: int
    ) -> Optional[UniformItem]:
        """Fetch catalog item bounded by tenant."""
        return (
            db.query(UniformItem)
            .filter(UniformItem.id == item_id, UniformItem.tenant_id == tenant_id)
            .first()
        )

    def create_item(self, db: Session, item: UniformItem) -> UniformItem:
        """Persist a new inventory item."""
        db.add(item)
        db.flush()
        return item

    def update_item(self, db: Session, item: UniformItem) -> UniformItem:
        """Commit catalog updates."""
        db.flush()
        return item

    def delete_item(self, db: Session, item: UniformItem) -> None:
        """Remove item from catalog."""
        db.delete(item)
        db.flush()

    def list_distributions(
        self,
        db: Session,
        tenant_id: int,
        employee_id: Optional[int] = None,
        uniform_item_id: Optional[int] = None,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[UniformDistribution], int]:
        """Retrieve paginated uniform distribution logs."""
        query = db.query(UniformDistribution).filter(UniformDistribution.tenant_id == tenant_id)

        if employee_id:
            query = query.filter(UniformDistribution.employee_id == employee_id)
        if uniform_item_id:
            query = query.filter(UniformDistribution.uniform_item_id == uniform_item_id)
        if status:
            query = query.filter(UniformDistribution.status == status)

        total = query.count()
        records = (
            query.order_by(UniformDistribution.issued_date.desc(), UniformDistribution.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        return records, total

    def get_distribution_by_id(
        self, db: Session, dist_id: int, tenant_id: int
    ) -> Optional[UniformDistribution]:
        """Fetch distribution assignment bounded by tenant."""
        return (
            db.query(UniformDistribution)
            .filter(
                UniformDistribution.id == dist_id,
                UniformDistribution.tenant_id == tenant_id,
            )
            .first()
        )

    def create_distribution(
        self, db: Session, dist: UniformDistribution
    ) -> UniformDistribution:
        """Record issuance of apparel asset."""
        db.add(dist)
        db.flush()
        return dist

    def update_distribution(
        self, db: Session, dist: UniformDistribution
    ) -> UniformDistribution:
        """Update distribution state."""
        db.flush()
        return dist


uniform_repository = UniformRepository()
