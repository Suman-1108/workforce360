from typing import Optional
from app.database.session import Session
from app.services.uniform_service import uniform_service, UniformService
from app.schemas.uniform_schema import (
    UniformItemCreate,
    UniformItemUpdate,
    UniformIssueRequest,
    UniformReturnRequest,
    UniformBulkIssueRequest,
)
from app.models.user import User
from app.utils.response import success_response


class UniformController:
    """Controller layer handling HTTP request/response orchestration for Uniforms and Equipment."""

    def __init__(self, service: UniformService = uniform_service):
        self.service = service

    def list_items(
        self,
        db: Session,
        tenant_id: int,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ):
        result = self.service.list_items(
            db=db, tenant_id=tenant_id, category=category, search=search
        )
        return success_response(
            data=result.model_dump(),
            message="Uniform catalog items retrieved successfully.",
        )

    def get_item(self, db: Session, tenant_id: int, item_id: int):
        result = self.service.get_item(db=db, tenant_id=tenant_id, item_id=item_id)
        return success_response(
            data=result.model_dump(),
            message="Uniform item details retrieved.",
        )

    def create_item(self, db: Session, tenant_id: int, data: UniformItemCreate):
        result = self.service.create_item(db=db, tenant_id=tenant_id, data=data)
        return success_response(
            data=result.model_dump(),
            message="Uniform item added to catalog successfully.",
        )

    def update_item(
        self, db: Session, tenant_id: int, item_id: int, data: UniformItemUpdate
    ):
        result = self.service.update_item(
            db=db, tenant_id=tenant_id, item_id=item_id, data=data
        )
        return success_response(
            data=result.model_dump(),
            message="Uniform item updated successfully.",
        )

    def delete_item(self, db: Session, tenant_id: int, item_id: int):
        self.service.delete_item(db=db, tenant_id=tenant_id, item_id=item_id)
        return success_response(
            data=None,
            message="Uniform item deleted successfully.",
        )

    def issue_uniform(self, db: Session, tenant_id: int, data: UniformIssueRequest):
        result = self.service.issue_uniform(db=db, tenant_id=tenant_id, data=data)
        return success_response(
            data=result.model_dump(),
            message="Uniform issued to employee successfully.",
        )

    def return_uniform(
        self, db: Session, tenant_id: int, dist_id: int, data: UniformReturnRequest
    ):
        result = self.service.return_uniform(
            db=db, tenant_id=tenant_id, dist_id=dist_id, data=data
        )
        return success_response(
            data=result.model_dump(),
            message=f"Uniform distribution marked as {data.status}.",
        )

    def list_distributions(
        self,
        db: Session,
        tenant_id: int,
        employee_id: Optional[int] = None,
        uniform_item_id: Optional[int] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ):
        result = self.service.list_distributions(
            db=db,
            tenant_id=tenant_id,
            employee_id=employee_id,
            uniform_item_id=uniform_item_id,
            status=status,
            page=page,
            page_size=page_size,
        )
        return success_response(
            data=result.model_dump(),
            message="Uniform distribution logs retrieved successfully.",
        )

    def bulk_issue_uniform(
        self, db: Session, tenant_id: int, data: UniformBulkIssueRequest
    ):
        result = self.service.bulk_issue_uniform(db=db, tenant_id=tenant_id, data=data)
        return success_response(
            data=result.model_dump(),
            message=f"Successfully issued {result.total_assigned} uniform kits.",
        )

    def get_my_uniforms(self, db: Session, user: User):
        result = self.service.get_my_uniforms(db=db, user=user)
        return success_response(
            data=[r.model_dump() for r in result],
            message="Assigned workforce uniforms retrieved.",
        )


uniform_controller = UniformController()
