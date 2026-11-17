from typing import Tuple
from fastapi import Depends
from app.core.exceptions import ForbiddenException
from app.dependencies.authentication import get_current_user
from app.models.user import User


def require_roles(*allowed_roles: str):
    """Factory creating dependency to enforce Role-Based Access Control (RBAC)."""

    def role_verifier(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(
                f"Access denied: Role '{current_user.role}' is not authorized for this resource."
            )
        return current_user

    return role_verifier
