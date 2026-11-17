from fastapi import APIRouter, Depends
from app.database.session import get_db, Session
from app.database.connection import check_db_connection

router = APIRouter()


@router.get("", summary="System & MongoDB Health Check")
def health_check(db: Session = Depends(get_db)):
    """Verify API operational state and MongoDB connectivity."""
    db_info = check_db_connection()
    return {
        "status": "healthy" if db_info.get("connected") else "degraded",
        "service": "WorkForce 360 API",
        "database": db_info,
    }
