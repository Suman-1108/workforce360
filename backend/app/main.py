from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import setup_logging, logger
from app.database.connection import check_db_connection
from app.database.session import ensure_database_initialized
from app.middleware import (
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
    TenantMiddleware,
    RateLimitMiddleware,
)
from app.utils.response import error_response, success_response


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifecycle events: startup diagnostics and shutdown cleanup."""
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} in '{settings.APP_ENV}' environment...")

    # Validate database connection and auto-initialize schema/seed if empty
    db_health = check_db_connection()
    if db_health.get("connected"):
        logger.info(
            f"Database successfully connected: {db_health.get('database')} "
            f"(User: {db_health.get('user')}, Engine: {db_health.get('version')})"
        )
        try:
            ensure_database_initialized()
        except Exception as exc:
            logger.error(f"Startup DB initialization failed: {exc}")
    else:
        logger.error(f"Database connection error on startup: {db_health.get('error')}")

    yield

    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise Multi-Tenant SaaS Employee and Workforce Management Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# 1. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 3. Tenant Context Middleware
app.add_middleware(TenantMiddleware)

# 4. Rate Limiting Middleware
app.add_middleware(RateLimitMiddleware, requests_per_minute=settings.RATE_LIMIT_PER_MINUTE)

# 5. Request Logging & Process Time Middleware
app.add_middleware(RequestLoggingMiddleware)


# ==========================================
# Centralized Exception Handlers
# ==========================================


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom application exceptions with structured envelope."""
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response(
            message=exc.message,
            error_code=exc.error_code,
            details=exc.details,
        ),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Transform Pydantic validation errors into consistent, readable structure."""
    field_errors = {}
    for err in exc.errors():
        loc = ".".join(str(p) for p in err.get("loc", []) if p != "body")
        field_errors[loc or "general"] = err.get("msg")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response(
            message="Validation failed for the submitted payload.",
            error_code="VALIDATION_ERROR",
            details={"fields": field_errors},
        ),
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors securely without exposing schema details."""
    logger.error(f"Database operation failed: {exc}", exc_info=settings.DEBUG)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response(
            message="A database persistence error occurred. Please contact support.",
            error_code="DATABASE_ERROR",
        ),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled server exceptions."""
    logger.error(f"Unhandled system error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response(
            message="An unexpected system error occurred. Our engineering team has been notified.",
            error_code="INTERNAL_SERVER_ERROR",
        ),
    )


# ==========================================
# Root Operational Endpoints
# ==========================================


@app.get("/", summary="Root Application Status")
@app.get("/api", summary="API Root Operational Status")
async def root():
    """Operational root endpoint providing platform health and documentation links."""
    return success_response(
        data={
            "app": settings.APP_NAME,
            "environment": settings.APP_ENV,
            "version": "1.0.0",
            "docs_url": "/api/docs",
            "api_v1": settings.API_V1_STR,
        },
        message=f"{settings.APP_NAME} operational.",
    )


# Mount Central API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)
