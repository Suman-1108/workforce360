from fastapi import APIRouter, Depends
from app.database.session import Session
from app.dependencies import get_db, get_current_user
from app.controllers.auth_controller import auth_controller
from app.schemas.auth_schema import LoginRequest, ProfileUpdateRequest, ChangePasswordRequest
from app.models.user import User
from app.utils.response import success_response

router = APIRouter()


@router.post("/login", summary="User Login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate credentials and issue JWT bearer token."""
    return auth_controller.login(db=db, data=data)


@router.get("/me", summary="Get Current Authenticated User")
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve identity of the caller."""
    return success_response(
        data={
            "id": current_user.id,
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "phone": current_user.phone,
            "avatar_url": current_user.avatar_url,
            "role": current_user.role,
            "tenant_id": current_user.tenant_id,
        },
        message="User identity retrieved.",
    )


@router.put("/profile", summary="Update Current User Profile")
def update_profile(
    data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile details for the authenticated user."""
    return auth_controller.update_profile(db=db, user=current_user, data=data)


@router.post("/change-password", summary="Change Password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Change account password by validating current credential."""
    return auth_controller.change_password(db=db, user=current_user, data=data)


@router.get("/sessions", summary="Get User Sessions & Login History")
def get_sessions(current_user: User = Depends(get_current_user)):
    """Retrieve active session records for the current user."""
    return auth_controller.get_sessions(user=current_user)
