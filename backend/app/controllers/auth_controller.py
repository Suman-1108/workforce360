from sqlalchemy.orm import Session
from app.services.auth_service import auth_service, AuthService
from app.schemas.auth_schema import LoginRequest, ProfileUpdateRequest, ChangePasswordRequest
from app.models.user import User
from app.utils.response import success_response


class AuthController:
    """Controller handling authentication operations."""

    def __init__(self, service: AuthService = auth_service):
        self.service = service

    def login(self, db: Session, data: LoginRequest):
        result = self.service.authenticate_user(db, email=data.email, password=data.password)
        return success_response(data=result, message="Login successful.")

    def update_profile(self, db: Session, user: User, data: ProfileUpdateRequest):
        result = self.service.update_profile(db=db, user=user, data=data)
        return success_response(data=result, message="Profile updated successfully.")

    def change_password(self, db: Session, user: User, data: ChangePasswordRequest):
        result = self.service.change_password(db=db, user=user, data=data)
        return success_response(data=result, message="Password updated successfully.")

    def get_sessions(self, user: User):
        result = self.service.get_sessions(user=user)
        return success_response(data=result, message="Sessions retrieved.")


auth_controller = AuthController()
