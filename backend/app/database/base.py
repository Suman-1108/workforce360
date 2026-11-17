from datetime import datetime, timezone
from app.database.mongo_odm import MongoDocument, Field

Base = MongoDocument


class TimestampMixin:
    """Reusable audit mixin providing automatic UTC timestamps."""

    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
