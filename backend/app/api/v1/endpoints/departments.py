from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.database.session import Session
from app.database.session import get_db
from app.models.department import Department
from app.models.employee import Employee
from app.models.user import User
from app.api.deps import get_current_user, get_tenant_id, require_roles

router = APIRouter()


class DepartmentCreate(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    manager_name: Optional[str] = None


@router.get("", summary="List Departments")
def list_departments(
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List departments with active employee count."""
    depts = db.query(Department).filter(Department.tenant_id == tenant_id).all()
    results = []
    for d in depts:
        count = db.query(Employee).filter(Employee.department_id == d.id).count()
        results.append({
            "id": d.id,
            "tenant_id": d.tenant_id,
            "name": d.name,
            "code": d.code,
            "description": d.description,
            "manager_name": d.manager_name,
            "employee_count": count,
            "created_at": d.created_at.isoformat()
        })
    return results


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Department")
def create_department(
    data: DepartmentCreate,
    tenant_id: int = Depends(get_tenant_id),
    current_user: User = Depends(require_roles("owner", "manager", "superadmin")),
    db: Session = Depends(get_db)
):
    """Create a new department."""
    dept = Department(
        tenant_id=tenant_id,
        name=data.name,
        code=data.code,
        description=data.description,
        manager_name=data.manager_name
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)

    return {"id": dept.id, "name": dept.name, "message": "Department created successfully"}
