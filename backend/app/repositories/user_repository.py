from typing import Optional
from app.database.session import Session
from app.models.user import User


class UserRepository:
    """Data persistence repository for User authentication accounts."""

    def get_by_id(self, db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, user: User) -> User:
        db.add(user)
        db.flush()
        return user

    def update(self, db: Session, user: User) -> User:
        db.flush()
        return user

    def delete(self, db: Session, user: User) -> None:
        db.delete(user)
        db.flush()


user_repository = UserRepository()
