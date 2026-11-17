from typing import Optional
from fastapi import Depends, Header
from app.core.exceptions import ForbiddenException, TenantAccessDeniedException
from app.dependencies.authentication import get_current_user
from app.models.user import User


def get_tenant_id(
    current_user: User = Depends(get_current_user),
    x_tenant_id: Optional[str] = Header(None, alias="X-Tenant-ID"),
) -> int:
    """Enforces multi-tenant row-level boundary.
    - SuperAdmin can optionally switch tenant scope via X-Tenant-ID.
    - Owners, Managers, and Employees are strictly bounded to their organization tenant_id.
    """
    if current_user.role == "superadmin":
        if x_tenant_id and x_tenant_id.isdigit():
            return int(x_tenant_id)
        return current_user.tenant_id or 1

    if not current_user.tenant_id:
        raise TenantAccessDeniedException("User is not affiliated with any active organization tenant.")

    # Guard: Non-superadmin cannot spoof X-Tenant-ID to access another tenant's data
    if x_tenant_id and x_tenant_id.isdigit():
        requested_id = int(x_tenant_id)
        if requested_id != current_user.tenant_id:
            raise TenantAccessDeniedException("Attempted unauthorized cross-tenant data access.")

    return current_user.tenant_id
