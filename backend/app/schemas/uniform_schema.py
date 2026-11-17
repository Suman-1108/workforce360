from datetime import date, datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, ConfigDict


DistributionStatusLiteral = Literal["Issued", "Returned", "Damaged", "Lost"]


class UniformItemCreate(BaseModel):
    """Schema for adding new uniform inventory catalog items."""
    name: str = Field(..., min_length=2, max_length=100, examples=["Operations Polo Shirt"])
    code: Optional[str] = Field(None, max_length=50, examples=["UNIF-OPS-01"])
    category: Optional[str] = Field("Apparel", max_length=50, examples=["Apparel"])
    gender_group: Optional[str] = Field("Unisex", max_length=50)
    model_image_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None)
    colors: Optional[str] = Field(None, max_length=100)
    items_breakdown: Optional[str] = Field(None)
    sizes_available: Optional[str] = Field("S, M, L, XL, XXL", max_length=100)
    total_stock: int = Field(0, ge=0, description="Total units physically stocked in warehouse")
    is_active: bool = Field(True)


class UniformItemUpdate(BaseModel):
    """Schema for adjusting stock or catalog details."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    code: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=50)
    gender_group: Optional[str] = Field(None, max_length=50)
    model_image_url: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None)
    colors: Optional[str] = Field(None, max_length=100)
    items_breakdown: Optional[str] = Field(None)
    sizes_available: Optional[str] = Field(None, max_length=100)
    total_stock: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    is_archived: Optional[bool] = None


class UniformItemResponse(BaseModel):
    """Serialized uniform catalog item with real-time availability."""
    id: int
    tenant_id: int
    name: str
    code: Optional[str] = None
    category: Optional[str] = None
    gender_group: Optional[str] = "Unisex"
    model_image_url: Optional[str] = None
    description: Optional[str] = None
    colors: Optional[str] = None
    items_breakdown: Optional[str] = None
    sizes_available: Optional[str] = None
    total_stock: int
    distributed_stock: int
    available_stock: int
    is_active: bool = True
    is_archived: bool = False
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class UniformItemListResponse(BaseModel):
    total: int
    items: List[UniformItemResponse]


class UniformIssueRequest(BaseModel):
    """Schema for issuing uniform gear to an employee."""
    employee_id: int = Field(..., description="Recipient employee ID")
    uniform_item_id: int = Field(..., description="Target uniform catalog ID")
    size: str = Field(..., max_length=20, examples=["L"])
    quantity: int = Field(1, ge=1, le=100, description="Number of units to issue")
    notes: Optional[str] = Field(None, max_length=500, description="Issuance condition note or batch tag")


class UniformReturnRequest(BaseModel):
    """Schema for processing return, damage, or loss of issued uniform."""
    status: Literal["Returned", "Damaged", "Lost"] = Field("Returned")
    notes: Optional[str] = Field(None, max_length=500)


class UniformDistributionResponse(BaseModel):
    """Serialized record of uniform asset assigned to personnel."""
    id: int
    tenant_id: int
    employee_id: int
    employee_name: str
    employee_id_number: str
    uniform_item_id: int
    uniform_item_name: str
    size: str
    quantity: int
    issued_date: str
    status: str
    notes: Optional[str] = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class UniformDistributionListResponse(BaseModel):
    total: int
    items: List[UniformDistributionResponse]


class UniformBulkIssueRequest(BaseModel):
    """Schema for assigning uniform gear to multiple staff, by department, or by branch."""
    uniform_item_id: int = Field(..., description="Target uniform catalog ID")
    employee_ids: Optional[List[int]] = Field(None, description="List of specific employee IDs")
    department_id: Optional[int] = Field(None, description="Department ID to assign to all staff in department")
    branch_id: Optional[int] = Field(None, description="Branch ID to assign to all staff at branch")
    size: str = Field("Standard", max_length=20, examples=["L"])
    quantity: int = Field(1, ge=1, le=10, description="Sets per employee")
    issued_date: Optional[str] = Field(None, description="Issuance date YYYY-MM-DD")
    notes: Optional[str] = Field(None, max_length=500)


class UniformBulkIssueResponse(BaseModel):
    """Summary result of bulk issuance."""
    total_assigned: int
    uniform_item_name: str
    items: List[UniformDistributionResponse]


class MyUniformItemResponse(BaseModel):
    """Detailed employee assigned outfit with visual model and components."""
    distribution_id: int
    uniform_item_id: int
    name: str
    code: Optional[str] = None
    category: Optional[str] = None
    model_image_url: Optional[str] = None
    description: Optional[str] = None
    colors: Optional[str] = None
    items_breakdown: Optional[str] = None
    size: str
    quantity: int
    issued_date: str
    status: str
    notes: Optional[str] = None
