from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user, require_roles, get_tenant_id
from app.controllers.uniform_controller import uniform_controller
from app.schemas.uniform_schema import (
    UniformItemCreate,
    UniformItemUpdate,
    UniformIssueRequest,
    UniformReturnRequest,
    UniformBulkIssueRequest,
)
from app.models.user import User

router = APIRouter()


@router.get("/status", summary="Uniform Module Health Probe")
async def uniform_status():
    return {"module": "uniform", "status": "active"}


@router.get("/items", summary="List Uniform Inventory Items")
def list_items(
    category: Optional[str] = Query(None, description="Filter by category (Apparel, Footwear, Protective Gear)"),
    search: Optional[str] = Query(None, description="Search by item name or category"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve catalog items with stock availability."""
    return uniform_controller.list_items(
        db=db, tenant_id=tenant_id, category=category, search=search
    )


@router.post("/items", status_code=status.HTTP_201_CREATED, summary="Add Uniform Item")
def create_item(
    data: UniformItemCreate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Register a new uniform gear definition in the warehouse."""
    return uniform_controller.create_item(db=db, tenant_id=tenant_id, data=data)


@router.get("/items/{item_id}", summary="Get Uniform Item Details")
def get_item(
    item_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetch individual item specification and stock."""
    return uniform_controller.get_item(db=db, tenant_id=tenant_id, item_id=item_id)


@router.put("/items/{item_id}", summary="Update Uniform Item")
def update_item(
    item_id: int,
    data: UniformItemUpdate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Update item catalog metadata or restock warehouse."""
    return uniform_controller.update_item(
        db=db, tenant_id=tenant_id, item_id=item_id, data=data
    )


@router.delete("/items/{item_id}", summary="Delete Uniform Item")
def delete_item(
    item_id: int,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "superadmin")),
    db: Session = Depends(get_db),
):
    """Remove uniform item from catalog if unissued."""
    return uniform_controller.delete_item(db=db, tenant_id=tenant_id, item_id=item_id)


@router.get("/distributions", summary="List Uniform Distributions")
def list_distributions(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    uniform_item_id: Optional[int] = Query(None, description="Filter by uniform item ID"),
    status: Optional[str] = Query(None, description="Filter by Issued, Returned, Damaged, Lost"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve audit history of gear distributed to staff."""
    return uniform_controller.list_distributions(
        db=db,
        tenant_id=tenant_id,
        employee_id=employee_id,
        uniform_item_id=uniform_item_id,
        status=status,
        page=page,
        page_size=page_size,
    )


@router.post("/issue", status_code=status.HTTP_201_CREATED, summary="Issue Uniform to Employee")
def issue_uniform(
    data: UniformIssueRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Issue uniform apparel or protective gear to an employee."""
    return uniform_controller.issue_uniform(db=db, tenant_id=tenant_id, data=data)


@router.post("/distributions/{dist_id}/action", summary="Return or Write-off Uniform Asset")
def return_uniform(
    dist_id: int,
    data: UniformReturnRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Record gear return, damage, or loss with inventory restocking."""
    return uniform_controller.return_uniform(
        db=db, tenant_id=tenant_id, dist_id=dist_id, data=data
    )


@router.post("/bulk-issue", status_code=status.HTTP_201_CREATED, summary="Bulk Issue Uniforms to Staff")
def bulk_issue_uniform(
    data: UniformBulkIssueRequest,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db),
):
    """Assign uniform apparel/gear in bulk to employee list, department, or branch."""
    return uniform_controller.bulk_issue_uniform(db=db, tenant_id=tenant_id, data=data)


@router.get("/my-uniforms", summary="Get Authenticated Employee's Assigned Uniforms")
def get_my_uniforms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve assigned uniform outfits and equipment for caller in employee portal."""
    return uniform_controller.get_my_uniforms(db=db, user=current_user)
