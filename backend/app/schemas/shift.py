from datetime import time, datetime
from typing import Optional
from pydantic import BaseModel


class ShiftBase(BaseModel):
    name: str
    code: Optional[str] = None
    type: str = "Day"
    start_time: time
    end_time: time
    grace_period_mins: int = 15
    is_active: bool = True


class ShiftCreate(ShiftBase):
    pass


class ShiftOut(ShiftBase):
    id: int
    tenant_id: int
    created_at: datetime

    class Config:
        from_attributes = True
