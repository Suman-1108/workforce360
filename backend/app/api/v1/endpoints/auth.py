from datetime import datetime, timezone, timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from app.database.session import Session
from app.database.session import get_db
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User, OTPVerification
from app.models.tenant import Tenant
from app.models.subscription import SubscriptionPlan, Subscription
from app.schemas.auth import LoginRequest, RegisterTenantRequest, OTPRequest, VerifyOTPRequest, Token
from app.schemas.user import UserOut
from app.api.deps import get_current_user
from app.services.email import send_otp_email

router = APIRouter()


@router.post("/login", response_model=Token, summary="User Login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password, returning JWT access token."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact your administrator.",
        )

    # Check tenant status if applicable
    tenant_info = None
    if user.tenant_id:
        tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
        if tenant and tenant.status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Organization subscription or account is suspended.",
            )
        if tenant:
            tenant_info = {
                "id": tenant.id,
                "name": tenant.name,
                "subdomain": tenant.subdomain
            }

    # Update last login timestamp
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token_claims = {
        "role": user.role,
        "tenant_id": user.tenant_id,
        "email": user.email,
        "name": f"{user.first_name} {user.last_name}"
    }
    access_token = create_access_token(subject=user.id, claims=token_claims)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "tenant_id": user.tenant_id,
            "tenant": tenant_info
        }
    }


@router.post("/register", response_model=Token, summary="Register New Organization Tenant")
def register_tenant(data: RegisterTenantRequest, db: Session = Depends(get_db)):
    """Register a new organization tenant, creating the owner account and 14-day trial subscription."""
    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == data.contact_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists",
        )

    # Find subscription plan
    plan_code = data.plan_code or "professional"
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == plan_code).first()
    if not plan:
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.code == "starter").first()

    # Generate subdomain if not provided
    subdomain = data.subdomain
    if not subdomain:
        subdomain = data.organization_name.lower().replace(" ", "").replace("-", "")[:20]

    # Check if subdomain already exists
    if db.query(Tenant).filter(Tenant.subdomain == subdomain).first():
        subdomain = f"{subdomain}-{secrets.token_hex(2)}"

    # Create Tenant
    tenant = Tenant(
        name=data.organization_name,
        subdomain=subdomain,
        contact_email=data.contact_email,
        contact_phone=data.contact_phone,
        status="active"
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    # Create Owner User
    now = datetime.now(timezone.utc)
    owner = User(
        tenant_id=tenant.id,
        email=data.contact_email,
        password_hash=get_password_hash(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.contact_phone,
        role="owner",
        is_active=True,
        is_verified=True,
        last_login_at=now
    )
    db.add(owner)

    # Create 14-day trial subscription
    subscription = Subscription(
        tenant_id=tenant.id,
        plan_id=plan.id if plan else 1,
        status="trialing",
        billing_cycle="monthly",
        current_period_start=now,
        current_period_end=now + timedelta(days=14)
    )
    db.add(subscription)
    db.commit()
    db.refresh(owner)

    token_claims = {
        "role": owner.role,
        "tenant_id": owner.tenant_id,
        "email": owner.email,
        "name": f"{owner.first_name} {owner.last_name}"
    }
    access_token = create_access_token(subject=owner.id, claims=token_claims)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": owner.id,
            "email": owner.email,
            "first_name": owner.first_name,
            "last_name": owner.last_name,
            "role": owner.role,
            "tenant_id": owner.tenant_id,
            "tenant": {
                "id": tenant.id,
                "name": tenant.name,
                "subdomain": tenant.subdomain
            }
        }
    }


@router.get("/me", summary="Get Current Authenticated User")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return user profile and tenant details for the authenticated session."""
    tenant_info = None
    if current_user.tenant_id:
        tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
        if tenant:
            tenant_info = {
                "id": tenant.id,
                "name": tenant.name,
                "subdomain": tenant.subdomain,
                "status": tenant.status
            }

    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "role": current_user.role,
        "phone": current_user.phone,
        "avatar_url": current_user.avatar_url,
        "tenant_id": current_user.tenant_id,
        "tenant": tenant_info
    }


@router.post("/otp/request", summary="Request Email OTP Verification")
def request_otp(data: OTPRequest, db: Session = Depends(get_db)):
    """Generate and dispatch a 6-digit OTP code to the requested email."""
    otp = f"{secrets.randbelow(900000) + 100000}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    otp_record = OTPVerification(
        email=data.email,
        otp=otp,
        purpose=data.purpose,
        expires_at=expires_at,
        is_used=False
    )
    db.add(otp_record)
    db.commit()

    # Dispatch email
    send_otp_email(to_email=data.email, otp=otp, purpose=data.purpose)

    return {
        "message": f"OTP verification code sent to {data.email}",
        "expires_in_minutes": 10
    }


@router.post("/otp/verify", summary="Verify Email OTP Code")
def verify_otp(data: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify submitted OTP code against active unexpired records."""
    now = datetime.now(timezone.utc)
    record = (
        db.query(OTPVerification)
        .filter(
            OTPVerification.email == data.email,
            OTPVerification.otp == data.otp,
            OTPVerification.purpose == data.purpose,
            OTPVerification.is_used == False,
            OTPVerification.expires_at >= now
        )
        .order_by(OTPVerification.created_at.desc())
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code",
        )

    record.is_used = True
    db.commit()

    return {"verified": True, "message": "Email verified successfully"}
