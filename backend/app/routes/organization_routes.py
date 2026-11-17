from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, require_roles, get_tenant_id
from app.controllers.organization_controller import organization_controller
from app.schemas.organization_schema import (
    OrganizationProfileUpdate,
    DepartmentCreate,
    DepartmentUpdate,
    BranchCreate,
    BranchUpdate,
)
from app.schemas.settings_schema import UpdateSettingsRequest
from app.models.user import User

router = APIRouter()


@router.get("/status", summary="Organization Module Health Probe")
async def organization_status():
    return {"module": "organization", "status": "active"}


# ====================================================
# Organization Profile Endpoints
# ====================================================

@router.get("/profile", summary="Get Organization Tenant Profile")
def get_organization_profile(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve caller's company profile with branch and department stats."""
    return organization_controller.get_profile(db=db, tenant_id=tenant_id)


@router.put("/profile", summary="Update Organization Profile")
def update_organization_profile(
    data: OrganizationProfileUpdate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db),
):
    """Update tenant metadata, company phone, address, and branding logo."""
    return organization_controller.update_profile(db=db, tenant_id=tenant_id, data=data)


@router.get("/settings", summary="Get Full Organization Settings")
def get_organization_settings(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full configuration: org profile, attendance, shifts, notifications, security."""
    return organization_controller.get_settings(db=db, tenant_id=tenant_id)


@router.put("/settings", summary="Save Organization Settings")
def update_organization_settings(
    data: UpdateSettingsRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db),
):
    """Save organization, attendance, shift, notifications, and security policies (Owner/SuperAdmin only)."""
    return organization_controller.update_settings(db=db, tenant_id=tenant_id, data=data)


# ====================================================
# Department Endpoints
# ====================================================

@router.get("/departments", summary="List Departments")
def list_departments(
    search: Optional[str] = Query(None, description="Search by name, code, or manager"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all corporate departments with real-time employee counts."""
    return organization_controller.list_departments(db=db, tenant_id=tenant_id, search=search)


@router.post(
    "/departments",
    status_code=status.HTTP_201_CREATED,
    summary="Create Department",
)
def create_department(
    data: DepartmentCreate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Provision a new department within the tenant."""
    return organization_controller.create_department(db=db, tenant_id=tenant_id, data=data)


@router.get("/departments/{department_id}", summary="Get Department Details")
def get_department(
    department_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch department metadata and employee metrics."""
    return organization_controller.get_department(
        db=db, tenant_id=tenant_id, department_id=department_id
    )


@router.put("/departments/{department_id}", summary="Update Department")
def update_department(
    department_id: int,
    data: DepartmentUpdate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Update department details."""
    return organization_controller.update_department(
        db=db, tenant_id=tenant_id, department_id=department_id, data=data
    )


@router.delete("/departments/{department_id}", summary="Delete Department")
def delete_department(
    department_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db),
):
    """Delete department if no active employees are attached."""
    return organization_controller.delete_department(
        db=db, tenant_id=tenant_id, department_id=department_id
    )


# ====================================================
# Branch & Geofence Endpoints
# ====================================================

@router.get("/branches", summary="List Physical Branches")
def list_branches(
    is_active: Optional[bool] = Query(None, description="Filter by operational status"),
    search: Optional[str] = Query(None, description="Search by name, code, or city"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List physical branches and GPS geofence coordinates."""
    return organization_controller.list_branches(
        db=db, tenant_id=tenant_id, is_active=is_active, search=search
    )


@router.post(
    "/branches",
    status_code=status.HTTP_201_CREATED,
    summary="Create Physical Branch",
)
def create_branch(
    data: BranchCreate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Register physical facility with GPS coordinates and geofence boundary."""
    return organization_controller.create_branch(db=db, tenant_id=tenant_id, data=data)


@router.get("/branches/{branch_id}", summary="Get Branch Details")
def get_branch(
    branch_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch facility details and geofence radius."""
    return organization_controller.get_branch(
        db=db, tenant_id=tenant_id, branch_id=branch_id
    )


@router.put("/branches/{branch_id}", summary="Update Physical Branch")
def update_branch(
    branch_id: int,
    data: BranchUpdate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Update branch details, geofence radius, and coordinates."""
    return organization_controller.update_branch(
        db=db, tenant_id=tenant_id, branch_id=branch_id, data=data
    )


@router.delete("/branches/{branch_id}", summary="Delete Physical Branch")
def delete_branch(
    branch_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db),
):
    """Remove branch if no active staff or shifts are attached."""
    return organization_controller.delete_branch(
        db=db, tenant_id=tenant_id, branch_id=branch_id
    )
