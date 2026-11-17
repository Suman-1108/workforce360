import threading
from typing import Generator
from contextlib import contextmanager
from app.database.connection import get_mongo_db, ensure_mongo_indexes
from app.database.base import Base
from app.database.mongo_odm import MongoSession
from app.core.logging import logger

# Public Session alias for type annotations across repositories, services, controllers, and routes
Session = MongoSession


def SessionLocal() -> MongoSession:
    """Create a new MongoDB unit-of-work session."""
    return MongoSession(get_mongo_db())


_init_lock = threading.Lock()
_db_initialized = False


def ensure_database_initialized() -> None:
    """Ensure MongoDB indexes exist and seed demo collections if empty (runs once per process)."""
    global _db_initialized
    if _db_initialized:
        return

    with _init_lock:
        if _db_initialized:
            return
        try:
            # Register all MongoDocument models
            import app.models  # noqa: F401

            db = get_mongo_db()
            ensure_mongo_indexes(db)

            has_users = db["users"].find_one({}, {"id": 1}) is not None
            if not has_users:
                logger.info("Empty MongoDB database detected — running initial seed_database()...")
                from app.database.seed import seed_database
                seed_database()

            _db_initialized = True
        except Exception as exc:
            logger.error(f"MongoDB auto-initialization error: {exc}", exc_info=True)
            raise


def get_db() -> Generator[MongoSession, None, None]:
    """FastAPI dependency providing a MongoDB session per request."""
    ensure_database_initialized()
    db: MongoSession = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_session() -> Generator[MongoSession, None, None]:
    """Context manager for MongoDB sessions outside FastAPI request lifecycle."""
    ensure_database_initialized()
    session: MongoSession = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
