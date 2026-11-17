from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class TenantMiddleware(BaseHTTPMiddleware):
    """Extracts tenant identifiers from incoming headers and binds to request state."""

    async def dispatch(self, request: Request, call_next) -> Response:
        tenant_id_header: Optional[str] = request.headers.get("X-Tenant-ID")
        if tenant_id_header and tenant_id_header.isdigit():
            request.state.tenant_id = int(tenant_id_header)
        else:
            request.state.tenant_id = None

        return await call_next(request)
