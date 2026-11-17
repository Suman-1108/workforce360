from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    employees,
    attendance,
    shifts,
    departments,
    leaves,
    uniforms,
    subscriptions,
    superadmin,
    reports
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & OTP"])
api_router.include_router(employees.router, prefix="/employees", tags=["Employee Management"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["GPS & Attendance Tracking"])
api_router.include_router(shifts.router, prefix="/shifts", tags=["Shift Management"])
api_router.include_router(departments.router, prefix="/departments", tags=["Department Management"])
api_router.include_router(leaves.router, prefix="/leaves", tags=["Leave Management"])
api_router.include_router(uniforms.router, prefix="/uniforms", tags=["Uniform & Gear Tracking"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions & Razorpay"])
api_router.include_router(superadmin.router, prefix="/superadmin", tags=["Super Admin Multi-Tenant"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports & Analytics"])
