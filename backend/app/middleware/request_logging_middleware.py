import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.logging import logger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs incoming HTTP requests and attaches processing latency headers."""

    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path

        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000
            response.headers["X-Process-Time"] = f"{duration_ms:.2f}ms"

            # Suppress high-frequency health checks from spamming logs
            if not path.endswith("/health"):
                logger.info(
                    f"{method} {path} - {response.status_code} [{duration_ms:.2f}ms] (Client: {client_ip})"
                )
            return response
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"{method} {path} - FAILED [{duration_ms:.2f}ms] (Client: {client_ip}) - {exc}"
            )
            raise exc
