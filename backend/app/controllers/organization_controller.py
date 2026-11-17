from typing import Optional
from sqlalchemy.orm import Session
from app.services.organization_service import (
    organization_service,
    OrganizationService,
)
from app.schemas.organization_schema import (
    OrganizationProfileUpdate,
    DepartmentCreate,
    DepartmentUpdate,
    BranchCreate,
    BranchUpdate,
)
from app.schemas.settings_schema import UpdateSettingsRequest
from app.utils.response import success_response


class OrganizationController:
    """Controller orchestrating Organization Profile, Departments, and Branches endpoints."""

    def __init__(self, service: OrganizationService = organization_service):
        self.service = service

    # ----------------------------------------------------
    # Organization Profile
    # ----------------------------------------------------
    def get_profile(self, db: Session, tenant_id: int):
        result = self.service.get_profile(db=db, tenant_id=tenant_id)
        return success_response(
            data=result.model_dump(),
            message="Organization profile retrieved successfully.",
        )

    def update_profile(
        self, db: Session, tenant_id: int, data: OrganizationProfileUpdate
    ):
        result = self.service.update_profile(db=db, tenant_id=tenant_id, data=data)
        return success_response(
            data=result.model_dump(),
            message="Organization profile updated successfully.",
        )

    # ----------------------------------------------------
    # Unified Organization & System Settings
    # ----------------------------------------------------
    def get_settings(self, db: Session, tenant_id: int):
        result = self.service.get_all_settings(db=db, tenant_id=tenant_id)
        return success_response(
            data=result.model_dump(),
            message="Organization settings retrieved successfully.",
        )

    def update_settings(self, db: Session, tenant_id: int, data: UpdateSettingsRequest):
        result = self.service.update_all_settings(db=db, tenant_id=tenant_id, data=data)
        return success_response(
            data=result.model_dump(),
            message="Organization settings saved successfully.",
        )

    # ----------------------------------------------------
    # Departments
    # ----------------------------------------------------
    def list_departments(
        self, db: Session, tenant_id: int, search: Optional[str] = None
    ):
        result = self.service.list_departments(db=db, tenant_id=tenant_id, search=search)
        return success_response(
            data=result.model_dump(),
            message="Departments retrieved successfully.",
        )

    def get_department(self, db: Session, tenant_id: int, department_id: int):
        result = self.service.get_department(
            db=db, tenant_id=tenant_id, department_id=department_id
        )
        return success_response(
            data=result.model_dump(),
            message="Department details retrieved.",
        )

    def create_department(self, db: Session, tenant_id: int, data: DepartmentCreate):
        result = self.service.create_department(db=db, tenant_id=tenant_id, data=data)
        return success_response(
            data=result.model_dump(),
            message="Department created successfully.",
        )

    def update_department(
        self, db: Session, tenant_id: int, department_id: int, data: DepartmentUpdate
    ):
        result = self.service.update_department(
            db=db, tenant_id=tenant_id, department_id=department_id, data=data
        )
        return success_response(
            data=result.model_dump(),
            message="Department updated successfully.",
        )

    def delete_department(self, db: Session, tenant_id: int, department_id: int):
        self.service.delete_department(
            db=db, tenant_id=tenant_id, department_id=department_id
        )
        return success_response(
            data=None,
            message="Department deleted successfully.",
        )

    # ----------------------------------------------------
    # Branches & Geofence
    # ----------------------------------------------------
    def list_branches(
        self,
        db: Session,
        tenant_id: int,
        is_active: Optional[bool] = None,
        search: Optional[str] = None,
    ):
        result = self.service.list_branches(
            db=db, tenant_id=tenant_id, is_active=is_active, search=search
        )
        return success_response(
            data=result.model_dump(),
            message="Branches retrieved successfully.",
        )

    def get_branch(self, db: Session, tenant_id: int, branch_id: int):
        result = self.service.get_branch(
            db=db, tenant_id=tenant_id, branch_id=branch_id
        )
        return success_response(
            data=result.model_dump(),
            message="Branch details retrieved.",
        )

    def create_branch(self, db: Session, tenant_id: int, data: BranchCreate):
        result = self.service.create_branch(db=db, tenant_id=tenant_id, data=data)
        return success_response(
            data=result.model_dump(),
            message="Branch created successfully.",
        )

    def update_branch(
        self, db: Session, tenant_id: int, branch_id: int, data: BranchUpdate
    ):
        result = self.service.update_branch(
            db=db, tenant_id=tenant_id, branch_id=branch_id, data=data
        )
        return success_response(
            data=result.model_dump(),
            message="Branch updated successfully.",
        )

    def delete_branch(self, db: Session, tenant_id: int, branch_id: int):
        self.service.delete_branch(
            db=db, tenant_id=tenant_id, branch_id=branch_id
        )
        return success_response(
            data=None,
            message="Branch deleted successfully.",
        )


organization_controller = OrganizationController()
