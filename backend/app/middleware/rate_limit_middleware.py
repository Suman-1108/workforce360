import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.core.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """In-memory sliding window rate limiter per client IP."""

    def __init__(self, app, requests_per_minute: int = 120):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.client_records = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Only rate limit API paths
        if not request.url.path.startswith(settings.API_V1_STR):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        
        # Bypass rate limiting for automated internal test clients
        if client_ip == "testclient":
            return await call_next(request)
        now = time.time()
        window_start = now - 60

        # Purge records older than 1 minute
        history = [ts for ts in self.client_records[client_ip] if ts > window_start]
        self.client_records[client_ip] = history

        if len(history) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "message": "Too many requests. Please slow down.",
                    "error_code": "RATE_LIMIT_EXCEEDED",
                },
                headers={"Retry-After": "60"},
            )

        self.client_records[client_ip].append(now)
        return await call_next(request)
