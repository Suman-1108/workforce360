from datetime import datetime, timezone
from app.database.mongo_odm import MongoDocument, Field, Relation


class User(MongoDocument):
    __collection__ = "users"

    id = Field(int, primary_key=True)
    tenant_id = Field(int, fk_target="Tenant")
    email = Field(str)
    password_hash = Field(str)
    first_name = Field(str)
    last_name = Field(str)
    phone = Field(str)
    role = Field(str, default="employee")
    avatar_url = Field(str)
    is_active = Field(bool, default=True)
    is_verified = Field(bool, default=False)
    verification_token = Field(str)
    last_login_at = Field(datetime)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
    updated_at = Field(
        datetime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tenant = Relation("Tenant", fk_field="tenant_id", remote_field="id", uselist=False)
    employee = Relation("Employee", fk_field="id", remote_field="user_id", uselist=False)


class OTPVerification(MongoDocument):
    __collection__ = "otp_verifications"

    id = Field(int, primary_key=True)
    email = Field(str)
    otp = Field(str)
    purpose = Field(str, default="registration")
    expires_at = Field(datetime)
    is_used = Field(bool, default=False)
    created_at = Field(datetime, default=lambda: datetime.now(timezone.utc))
