from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_access_token,
)


def test_password_hashing_and_verification():
    raw_password = "SecurePassword@2026"
    hashed = get_password_hash(raw_password)

    # Must be in standard pbkdf2_sha256 format
    assert hashed.startswith("pbkdf2_sha256$")
    assert verify_password(raw_password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False
    assert verify_password("", hashed) is False


def test_salt_randomization():
    raw_password = "IdenticalPassword"
    hash1 = get_password_hash(raw_password)
    hash2 = get_password_hash(raw_password)

    # Different salts must produce distinct hash strings
    assert hash1 != hash2
    assert verify_password(raw_password, hash1) is True
    assert verify_password(raw_password, hash2) is True


def test_jwt_token_lifecycle():
    subject_id = 999
    claims = {"role": "owner", "tenant_id": 1, "email": "test@enterprise.com"}

    token = create_access_token(subject=subject_id, claims=claims)
    assert isinstance(token, str)

    payload = decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == str(subject_id)
    assert payload.get("role") == "owner"
    assert payload.get("tenant_id") == 1
    assert payload.get("email") == "test@enterprise.com"


def test_jwt_invalid_token():
    assert decode_access_token("invalid.token.payload") is None
    assert decode_access_token("") is None
