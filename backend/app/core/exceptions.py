from typing import Any, Dict, Optional
from fastapi import status


class AppException(Exception):
    """Base application exception for all domain-specific errors."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error_code: str = "BAD_REQUEST",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


class NotFoundException(AppException):
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            message=f"{resource} with identifier '{identifier}' was not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="RESOURCE_NOT_FOUND",
        )


class UnauthorizedException(AppException):
    def __init__(self, message: str = "Invalid or expired authentication credentials."):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
        )


class ForbiddenException(AppException):
    def __init__(self, message: str = "Access forbidden: Insufficient permissions."):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN",
        )


class TenantAccessDeniedException(AppException):
    def __init__(self, message: str = "Cross-tenant access prohibited. Action blocked."):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="TENANT_ISOLATION_VIOLATION",
        )


class SubscriptionLimitExceededException(AppException):
    def __init__(self, feature: str, limit: int, current: int, plan_name: str):
        super().__init__(
            message=(
                f"Subscription quota reached for '{feature}' "
                f"({current}/{limit} on {plan_name}). Please upgrade your plan."
            ),
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="SUBSCRIPTION_QUOTA_EXCEEDED",
            details={
                "feature": feature,
                "limit": limit,
                "current": current,
                "plan": plan_name,
            },
        )


class FeatureNotEnabledException(AppException):
    def __init__(self, feature: str, plan_name: str):
        super().__init__(
            message=f"The feature '{feature}' is not available on the {plan_name} plan. Upgrade to unlock.",
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FEATURE_NOT_ENABLED",
        )


class ConflictException(AppException):
    def __init__(self, message: str):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code="RESOURCE_CONFLICT",
        )


class ValidationException(AppException):
    def __init__(self, message: str, errors: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            details=errors or {},
        )
