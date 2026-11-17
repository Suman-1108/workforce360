from typing import Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from app.core.config import settings
from app.core.logging import logger

is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if is_sqlite:
    engine: Engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=settings.DEBUG,
    )
else:
    engine: Engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_size=10,
        max_overflow=20,
        echo=settings.DEBUG,
    )


def check_db_connection() -> Dict[str, Any]:
    """Test database connection via lightweight dialect-appropriate query."""
    try:
        with engine.connect() as conn:
            if is_sqlite:
                ver = conn.execute(text("SELECT sqlite_version()")).scalar()
                return {
                    "connected": True,
                    "database": settings.DATABASE_URL,
                    "user": "sqlite",
                    "version": f"SQLite {ver}",
                }
            elif settings.DATABASE_URL.startswith("postgresql"):
                result = conn.execute(text("SELECT current_database(), current_user, version()")).fetchone()
            else:
                result = conn.execute(text("SELECT DATABASE(), USER(), VERSION()")).fetchone()

            if result:
                return {
                    "connected": True,
                    "database": result[0],
                    "user": result[1],
                    "version": result[2],
                }
            return {"connected": True}
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return {
            "connected": False,
            "error": str(e),
        }
