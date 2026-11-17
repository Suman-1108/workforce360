from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from app.database.session import Session
from app.dependencies import get_db, require_roles
from app.controllers.super_admin_controller import super_admin_controller
from app.schemas.super_admin_schema import TenantStatusUpdateRequest
from app.models.user import User

router = APIRouter()


@router.get("/status", summary="Super Admin Module Health Probe")
async def super_admin_health_status():
    return {"module": "super_admin", "status": "active"}


@router.get("/stats", summary="Get Platform Metrics & MRR")
def get_platform_stats(
    current_user: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db),
):
    """Fetch global platform KPIs, active customer count, and MRR."""
    return super_admin_controller.get_stats(db=db)


@router.get("/tenants", summary="List All Multi-Tenant Organizations")
def list_tenants(
    search: Optional[str] = Query(None, description="Search by organization name, subdomain, or email"),
    current_user: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db),
):
    """Retrieve all tenant organizations and their plan allocations."""
    return super_admin_controller.list_tenants(db=db, search=search)


@router.post("/tenants/{tenant_id}/status", summary="Update Tenant Operational Status")
def update_tenant_status(
    tenant_id: int,
    data: TenantStatusUpdateRequest,
    current_user: User = Depends(require_roles("superadmin")),
    db: Session = Depends(get_db),
):
    """Suspend or reactivate a customer organization."""
    return super_admin_controller.update_tenant_status(
        db=db, tenant_id=tenant_id, data=data
    )
