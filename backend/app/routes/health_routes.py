from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.dependencies.database import get_db
from app.core.config import settings
from app.core.logging import logger
from app.utils.response import success_response, error_response

router = APIRouter()


@router.get("/health", summary="System & Database Health Diagnostic")
def health_check(db: Session = Depends(get_db)):
    """Verifies API operation and performs a live database ping (SELECT 1)."""
    try:
        # Perform live ping
        result = db.execute(text("SELECT DATABASE(), USER(), VERSION()")).fetchone()
        db_details = {
            "status": "connected",
            "database": result[0] if result else "unknown",
            "user": result[1] if result else "unknown",
            "mysql_version": result[2] if result else "unknown",
        }

        return success_response(
            data={
                "status": "healthy",
                "app": settings.APP_NAME,
                "environment": settings.APP_ENV,
                "version": "1.0.0",
                "database": db_details,
            },
            message="System is healthy and database is connected.",
        )
    except Exception as exc:
        logger.error(f"Health check database failure: {exc}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=error_response(
                message="Database connectivity check failed.",
                error_code="SERVICE_UNAVAILABLE",
                details={"error": str(exc)},
            ),
        )
