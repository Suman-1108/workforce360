from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class OrganizationProfileResponse(BaseModel):
    """Organization tenant public profile details."""
    id: int
    uuid: str
    name: str
    subdomain: Optional[str] = None
    contact_email: str
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    status: str
    employee_count: int = 0
    department_count: int = 0
    branch_count: int = 0
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class OrganizationProfileUpdate(BaseModel):
    """Allowed modifications to tenant organization metadata."""
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Organization legal/trade name")
    contact_phone: Optional[str] = Field(None, max_length=30, description="Primary company telephone")
    address: Optional[str] = Field(None, max_length=500, description="Registered business headquarters address")
    logo_url: Optional[str] = Field(None, max_length=255, description="Public CDN logo URL")


# ==========================================
# Department Schemas
# ==========================================

class DepartmentCreate(BaseModel):
    """Schema for department provisioning."""
    name: str = Field(..., min_length=2, max_length=100, examples=["Operations & Supply Chain"])
    code: Optional[str] = Field(None, max_length=20, examples=["OPS"])
    description: Optional[str] = Field(None, max_length=500)
    manager_name: Optional[str] = Field(None, max_length=100, examples=["Sarah Jenkins"])


class DepartmentUpdate(BaseModel):
    """Schema for modifying department records."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    code: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = Field(None, max_length=500)
    manager_name: Optional[str] = Field(None, max_length=100)


class DepartmentResponse(BaseModel):
    """Serialized department representation."""
    id: int
    tenant_id: int
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    manager_name: Optional[str] = None
    employee_count: int = 0
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class DepartmentListResponse(BaseModel):
    """Paginated or listed departments container."""
    total: int
    items: List[DepartmentResponse]


# ==========================================
# Branch & Geofence Schemas
# ==========================================

class BranchCreate(BaseModel):
    """Schema for registering a physical branch with GPS geofence boundary."""
    name: str = Field(..., min_length=2, max_length=100, examples=["Apex HQ Campus"])
    code: Optional[str] = Field(None, max_length=20, examples=["HQ-01"])
    address: Optional[str] = Field(None, max_length=255, examples=["100 Market St"])
    city: Optional[str] = Field(None, max_length=100, examples=["San Francisco"])
    state: Optional[str] = Field(None, max_length=100, examples=["CA"])
    latitude: float = Field(..., ge=-90.0, le=90.0, examples=[37.7749])
    longitude: float = Field(..., ge=-180.0, le=180.0, examples=[-122.4190])
    radius_meters: int = Field(200, ge=10, le=50000, description="Geofence punch-in radius in meters", examples=[300])
    is_active: bool = Field(True, description="Whether branch is active for workforce assignment")


class BranchUpdate(BaseModel):
    """Schema for updating branch properties."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    code: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    radius_meters: Optional[int] = Field(None, ge=10, le=50000)
    is_active: Optional[bool] = None


class BranchResponse(BaseModel):
    """Serialized branch representation with geofence properties."""
    id: int
    tenant_id: int
    name: str
    code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    latitude: float
    longitude: float
    radius_meters: int
    is_active: bool
    employee_count: int = 0
    created_at: str
    updated_at: str

    model_config = ConfigDict(from_attributes=True)


class BranchListResponse(BaseModel):
    """Collection response for branches."""
    total: int
    items: List[BranchResponse]
