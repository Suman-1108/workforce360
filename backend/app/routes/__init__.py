from app.routes.auth_routes import router as auth_router
from app.routes.organization_routes import router as organization_router
from app.routes.department_routes import router as department_router
from app.routes.employee_routes import router as employee_router
from app.routes.shift_routes import router as shift_router
from app.routes.attendance_routes import router as attendance_router
from app.routes.leave_routes import router as leave_router
from app.routes.uniform_routes import router as uniform_router
from app.routes.subscription_routes import router as subscription_router
from app.routes.payment_routes import router as payment_router
from app.routes.report_routes import router as report_router
from app.routes.notification_routes import router as notification_router
from app.routes.super_admin_routes import router as super_admin_router

__all__ = [
    "auth_router",
    "organization_router",
    "department_router",
    "employee_router",
    "shift_router",
    "attendance_router",
    "leave_router",
    "uniform_router",
    "subscription_router",
    "payment_router",
    "report_router",
    "notification_router",
    "super_admin_router",
]
