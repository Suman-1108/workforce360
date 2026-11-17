from typing import Optional
from fastapi import Depends, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import decode_access_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.database.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False,
)


def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
) -> User:
    """Validate Bearer JWT token and return active user entity."""
    if not token:
        raise UnauthorizedException("Authentication token is missing.")

    payload = decode_access_token(token)
    if not payload:
        raise UnauthorizedException("Invalid, expired, or malformed authentication token.")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Token payload missing subject identity.")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise UnauthorizedException("User associated with token not found.")

    if not user.is_active:
        raise ForbiddenException("User account has been deactivated.")

    return user
