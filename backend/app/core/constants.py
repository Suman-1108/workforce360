from enum import Enum


class UserRole(str, Enum):
    SUPER_ADMIN = "superadmin"
    OWNER = "owner"
    MANAGER = "manager"
    EMPLOYEE = "employee"


class TenantStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    TRIALING = "trialing"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    INCOMPLETE = "incomplete"


class BillingCycle(str, Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"


class PlanCode(str, Enum):
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class EmploymentType(str, Enum):
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"
    CONTRACT = "Contract"
    INTERN = "Intern"


class EmployeeStatus(str, Enum):
    ACTIVE = "Active"
    ON_LEAVE = "On Leave"
    SUSPENDED = "Suspended"
    TERMINATED = "Terminated"


class AttendanceStatus(str, Enum):
    PRESENT = "Present"
    LATE = "Late"
    HALF_DAY = "Half-day"
    ABSENT = "Absent"
    ON_LEAVE = "On Leave"


class ShiftType(str, Enum):
    MORNING = "Morning"
    DAY = "Day"
    EVENING = "Evening"
    NIGHT = "Night"
    ROTATIONAL = "Rotational"


class LeaveStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"


class UniformStatus(str, Enum):
    ISSUED = "Issued"
    RETURNED = "Returned"
    DAMAGED = "Damaged"
    LOST = "Lost"


class OTPPurpose(str, Enum):
    REGISTRATION = "registration"
    LOGIN = "login"
    RESET_PASSWORD = "reset_password"
