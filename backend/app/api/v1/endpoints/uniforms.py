from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.uniform import UniformItem, UniformDistribution
from app.models.employee import Employee
from app.models.user import User
from app.schemas.uniform import UniformItemCreate, UniformDistributionCreate
from app.api.deps import get_current_user, get_tenant_id, require_roles

router = APIRouter()


@router.get("/items", summary="List Uniform Items Catalog")
def list_uniform_items(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve uniform catalog inventory."""
    items = db.query(UniformItem).filter(UniformItem.tenant_id == tenant_id).all()
    return [{
        "id": it.id,
        "name": it.name,
        "category": it.category,
        "sizes_available": it.sizes_available,
        "total_stock": it.total_stock,
        "distributed_stock": it.distributed_stock,
        "available_stock": max(0, it.total_stock - it.distributed_stock)
    } for it in items]


@router.post("/items", status_code=status.HTTP_201_CREATED, summary="Add Uniform Item")
def add_uniform_item(
    data: UniformItemCreate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db)
):
    """Add a new item to uniform catalog inventory."""
    item = UniformItem(
        tenant_id=tenant_id,
        name=data.name,
        category=data.category,
        sizes_available=data.sizes_available,
        total_stock=data.total_stock,
        distributed_stock=0
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "name": item.name, "message": "Uniform item created"}


@router.get("/distributions", summary="List Uniform Distributions")
def list_uniform_distributions(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve uniform issuance records."""
    query = db.query(UniformDistribution).filter(UniformDistribution.tenant_id == tenant_id)

    if current_user.role == "employee":
        emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
        if emp:
            query = query.filter(UniformDistribution.employee_id == emp.id)
        else:
            return []

    dists = query.order_by(UniformDistribution.issued_date.desc()).all()
    results = []
    for d in dists:
        emp = d.employee
        u = emp.user if emp else None
        item = d.uniform_item
        results.append({
            "id": d.id,
            "employee_id": d.employee_id,
            "employee_name": f"{u.first_name} {u.last_name}" if u else "Unknown",
            "employee_id_number": emp.employee_id_number if emp else "",
            "item_name": item.name if item else "Uniform Item",
            "size": d.size,
            "quantity": d.quantity,
            "issued_date": d.issued_date.isoformat(),
            "status": d.status,
            "notes": d.notes
        })
    return results


@router.post("/issue", status_code=status.HTTP_201_CREATED, summary="Issue Uniform to Employee")
def issue_uniform(
    data: UniformDistributionCreate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db)
):
    """Issue uniform gear to an employee, updating distribution stock."""
    item = db.query(UniformItem).filter(
        UniformItem.id == data.uniform_item_id,
        UniformItem.tenant_id == tenant_id
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Uniform item not found")

    if (item.total_stock - item.distributed_stock) < data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient stock (only {item.total_stock - item.distributed_stock} available)",
        )

    dist = UniformDistribution(
        tenant_id=tenant_id,
        employee_id=data.employee_id,
        uniform_item_id=data.uniform_item_id,
        size=data.size,
        quantity=data.quantity,
        issued_date=date.today(),
        status="Issued",
        notes=data.notes
    )
    item.distributed_stock += data.quantity
    db.add(dist)
    db.commit()
    db.refresh(dist)

    return {"id": dist.id, "message": "Uniform issued successfully"}
