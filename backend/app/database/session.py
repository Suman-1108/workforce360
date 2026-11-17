import threading
from typing import Generator
from contextlib import contextmanager
from sqlalchemy.orm import sessionmaker, Session
from app.database.connection import engine
from app.database.base import Base
from app.core.logging import logger

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

_init_lock = threading.Lock()
_db_initialized = False


def ensure_database_initialized() -> None:
    """Ensure tables exist and seed demo accounts if the database is empty (runs once per process)."""
    global _db_initialized
    if _db_initialized:
        return

    with _init_lock:
        if _db_initialized:
            return
        try:
            # Import all models so Base.metadata registers every table
            import app.models  # noqa: F401
            from app.models.user import User

            Base.metadata.create_all(bind=engine)

            db = SessionLocal()
            try:
                has_users = db.query(User.id).first() is not None
            finally:
                db.close()

            if not has_users:
                logger.info("Empty database detected — running initial seed_database()...")
                from app.database.seed import seed_database
                seed_database()

            _db_initialized = True
        except Exception as exc:
            logger.error(f"Database auto-initialization error: {exc}", exc_info=True)
            raise


def get_db() -> Generator[Session, None, None]:
    """FastAPI transactional dependency providing a database session per request."""
    ensure_database_initialized()
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """Context manager for database sessions outside FastAPI request lifecycle."""
    ensure_database_initialized()
    session: Session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
