from fastapi import APIRouter
from app.routes.health_routes import router as health_router
from app.routes import (
    auth_router,
    organization_router,
    department_router,
    employee_router,
    shift_router,
    attendance_router,
    leave_router,
    uniform_router,
    subscription_router,
    payment_router,
    report_router,
    notification_router,
    super_admin_router,
)

api_router = APIRouter()

# System Diagnostic Health
api_router.include_router(health_router, tags=["Health"])

# Register domain routers under clean RESTful prefixes
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(organization_router, prefix="/organizations", tags=["Organizations"])
api_router.include_router(department_router, prefix="/departments", tags=["Departments"])
api_router.include_router(employee_router, prefix="/employees", tags=["Employees"])
api_router.include_router(shift_router, prefix="/shifts", tags=["Shifts"])
api_router.include_router(attendance_router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(leave_router, prefix="/leaves", tags=["Leaves"])
api_router.include_router(uniform_router, prefix="/uniforms", tags=["Uniforms"])
api_router.include_router(subscription_router, prefix="/subscriptions", tags=["Subscriptions"])
api_router.include_router(payment_router, prefix="/payments", tags=["Payments & Razorpay"])
api_router.include_router(report_router, prefix="/reports", tags=["Reports & Analytics"])
api_router.include_router(notification_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(super_admin_router, prefix="/super-admin", tags=["Super Admin"])
api_router.include_router(super_admin_router, prefix="/superadmin", tags=["Super Admin"])
