from typing import Optional, List, Dict, Any
from app.database.session import Session
from app.database.mongo_odm import func
from app.models.tenant import Tenant
from app.models.employee import Employee
from app.models.subscription import Subscription
from app.repositories.super_admin_repository import (
    super_admin_repository,
    SuperAdminRepository,
)
from app.schemas.super_admin_schema import (
    PlatformStatsResponse,
    TenantOverviewResponse,
    TenantStatusUpdateRequest,
)
from app.core.exceptions import NotFoundException
from app.core.logging import logger


class SuperAdminService:
    """Service providing global governance, MRR tracking, and tenant lifecycle administration."""

    def __init__(self, repo: SuperAdminRepository = super_admin_repository):
        self.repo = repo

    def get_stats(self, db: Session) -> PlatformStatsResponse:
        """Fetch cross-tenant platform health and MRR."""
        metrics = self.repo.get_platform_metrics(db)
        return PlatformStatsResponse(
            total_tenants=metrics["total_tenants"],
            active_tenants=metrics["active_tenants"],
            total_employees=metrics["total_employees"],
            mrr=metrics["mrr"],
            arr=metrics["arr"],
        )

    def _to_tenant_response(self, db: Session, t: Tenant) -> TenantOverviewResponse:
        emp_count = (
            db.query(func.count(Employee.id))
            .filter(Employee.tenant_id == t.id)
            .scalar()
            or 0
        )
        sub = t.subscription
        p = sub.plan if sub else None

        return TenantOverviewResponse(
            id=t.id,
            name=t.name,
            subdomain=t.subdomain,
            contact_email=t.contact_email,
            contact_phone=t.contact_phone,
            status=str(t.status),
            plan_name=p.name if p else "Professional Tier",
            plan_code=p.code if p else "professional",
            employee_count=emp_count,
            created_at=t.created_at.isoformat() if t.created_at else "",
        )

    def list_tenants(
        self, db: Session, search: Optional[str] = None
    ) -> List[TenantOverviewResponse]:
        """Fetch high-level overview of all organizations."""
        tenants = self.repo.list_all_tenants(db, search=search)
        return [self._to_tenant_response(db, t) for t in tenants]

    def update_tenant_status(
        self, db: Session, tenant_id: int, status: str
    ) -> TenantOverviewResponse:
        """Toggle tenant active or suspended state."""
        tenant = self.repo.get_tenant_by_id(db, tenant_id)
        if not tenant:
            raise NotFoundException("Tenant", tenant_id)

        tenant.status = status
        self.repo.update_tenant(db, tenant)
        db.commit()
        db.refresh(tenant)
        logger.info(f"Super Admin transitioned tenant #{tenant_id} to status: {status}")
        return self._to_tenant_response(db, tenant)


super_admin_service = SuperAdminService()
