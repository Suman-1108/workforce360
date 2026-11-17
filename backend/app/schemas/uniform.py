from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel


class UniformItemBase(BaseModel):
    name: str
    category: Optional[str] = None
    sizes_available: Optional[str] = None
    total_stock: int = 0
    distributed_stock: int = 0


class UniformItemCreate(UniformItemBase):
    pass


class UniformItemOut(UniformItemBase):
    id: int
    tenant_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UniformDistributionCreate(BaseModel):
    employee_id: int
    uniform_item_id: int
    size: str
    quantity: int = 1
    notes: Optional[str] = None


class UniformDistributionOut(BaseModel):
    id: int
    tenant_id: int
    employee_id: int
    uniform_item_id: int
    size: str
    quantity: int
    issued_date: date
    status: str
    notes: Optional[str] = None
    created_at: datetime
    uniform_item: Optional[UniformItemOut] = None

    class Config:
        from_attributes = True
