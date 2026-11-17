from typing import Optional
from sqlalchemy.orm import Session
from app.services.super_admin_service import (
    super_admin_service,
    SuperAdminService,
)
from app.schemas.super_admin_schema import TenantStatusUpdateRequest
from app.utils.response import success_response


class SuperAdminController:
    """Controller layer handling HTTP request/response orchestration for Super Admin governance."""

    def __init__(self, service: SuperAdminService = super_admin_service):
        self.service = service

    def get_stats(self, db: Session):
        metrics = self.service.get_stats(db=db).model_dump()
        resp = success_response(data=metrics, message="Platform metrics retrieved successfully.")
        # Flatten stats keys onto top-level dictionary for backward compatibility with frontend clients
        resp.update(metrics)
        return resp

    def list_tenants(self, db: Session, search: Optional[str] = None):
        items = [t.model_dump() for t in self.service.list_tenants(db=db, search=search)]
        resp = success_response(data=items, message="Tenants retrieved successfully.")
        resp["items"] = items
        return resp

    def update_tenant_status(
        self, db: Session, tenant_id: int, data: TenantStatusUpdateRequest
    ):
        result = self.service.update_tenant_status(
            db=db, tenant_id=tenant_id, status=data.status
        )
        return success_response(
            data=result.model_dump(),
            message=f"Tenant organization #{tenant_id} is now {data.status}.",
        )


super_admin_controller = SuperAdminController()
