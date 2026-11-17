from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base


class UniformItem(Base):
    __tablename__ = "uniform_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=True)
    category = Column(String(50), nullable=True)
    gender_group = Column(String(50), default="Unisex", nullable=False)
    model_image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    colors = Column(String(100), nullable=True)
    items_breakdown = Column(Text, nullable=True)
    sizes_available = Column(String(100), nullable=True)
    total_stock = Column(Integer, default=0, nullable=False)
    distributed_stock = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="uniform_items")
    distributions = relationship("UniformDistribution", back_populates="uniform_item", cascade="all, delete-orphan")


class UniformDistribution(Base):
    __tablename__ = "uniform_distributions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    uniform_item_id = Column(Integer, ForeignKey("uniform_items.id", ondelete="CASCADE"), nullable=False)
    size = Column(String(20), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    issued_date = Column(Date, default=date.today, nullable=False)
    status = Column(
        Enum("Issued", "Returned", "Damaged", "Lost", name="uniform_distribution_status_enum"),
        default="Issued",
        nullable=False
    )
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    tenant = relationship("Tenant", back_populates="uniform_distributions")
    employee = relationship("Employee", back_populates="uniform_distributions")
    uniform_item = relationship("UniformItem", back_populates="distributions")
