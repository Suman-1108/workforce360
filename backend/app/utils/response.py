from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel


class ApiResponse(BaseModel):
    """Standardized API JSON response envelope."""

    success: bool
    message: str = "Operation completed successfully"
    data: Optional[Any] = None
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: str = ""

    def __init__(self, **data):
        if "timestamp" not in data or not data["timestamp"]:
            data["timestamp"] = datetime.now(timezone.utc).isoformat()
        super().__init__(**data)


def success_response(
    data: Any = None,
    message: str = "Success",
) -> Dict[str, Any]:
    """Helper to return standardized success dictionary."""
    return ApiResponse(
        success=True,
        message=message,
        data=data,
    ).model_dump()


def error_response(
    message: str,
    error_code: str = "INTERNAL_ERROR",
    details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Helper to return standardized error dictionary."""
    return ApiResponse(
        success=False,
        message=message,
        error_code=error_code,
        details=details or {},
    ).model_dump()
