import secrets
from fastapi.testclient import TestClient
from app.main import app
from app.services.razorpay_service import razorpay_service

client = TestClient(app)


def get_owner_token():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@apextechnologies.com", "password": "Password@123"},
    )
    assert res.status_code == 200
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_plans_public():
    res = client.get("/api/v1/subscriptions/plans")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["total"] >= 3
    codes = [p["code"] for p in body["data"]["items"]]
    assert "starter" in codes
    assert "professional" in codes
    assert "enterprise" in codes


def test_get_current_subscription():
    headers = get_owner_token()
    res = client.get("/api/v1/subscriptions/current", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["status"] == "active"
    assert "plan_code" in data
    assert "current_employees_count" in data


def test_checkout_order_creation():
    headers = get_owner_token()
    checkout_payload = {
        "plan_code": "enterprise",
        "billing_cycle": "monthly",
    }
    res = client.post("/api/v1/subscriptions/checkout", headers=headers, json=checkout_payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert "order_id" in data
    assert data["plan_code"] == "enterprise"
    assert data["amount"] > 0
    assert "key_id" in data


def test_payment_verification_invalid_signature_rejected():
    headers = get_owner_token()
    bad_payload = {
        "razorpay_order_id": "order_test_999",
        "razorpay_payment_id": "pay_test_999",
        "razorpay_signature": "invalid_forged_signature_12345",
        "plan_code": "enterprise",
        "billing_cycle": "monthly",
    }
    res = client.post("/api/v1/subscriptions/razorpay/verify", headers=headers, json=bad_payload)
    assert res.status_code == 422
    assert res.json()["error_code"] == "VALIDATION_ERROR"


def test_payment_verification_valid_hmac_and_plan_upgrade():
    headers = get_owner_token()
    order_id = f"order_{secrets.token_hex(8)}"
    payment_id = f"pay_{secrets.token_hex(8)}"
    valid_sig = razorpay_service.generate_signature(order_id, payment_id)

    verify_payload = {
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": valid_sig,
        "plan_code": "enterprise",
        "billing_cycle": "yearly",
    }

    res = client.post("/api/v1/subscriptions/razorpay/verify", headers=headers, json=verify_payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    sub_data = body["data"]["subscription"]
    assert sub_data["plan_code"] == "enterprise"
    assert sub_data["billing_cycle"] == "yearly"
    assert sub_data["status"] == "active"

    # Restore tenant to professional plan for testing idempotency
    restore_order = f"order_{secrets.token_hex(8)}"
    restore_pay = f"pay_{secrets.token_hex(8)}"
    restore_sig = razorpay_service.generate_signature(restore_order, restore_pay)
    client.post(
        "/api/v1/subscriptions/razorpay/verify",
        headers=headers,
        json={
            "razorpay_order_id": restore_order,
            "razorpay_payment_id": restore_pay,
            "razorpay_signature": restore_sig,
            "plan_code": "professional",
            "billing_cycle": "monthly",
        },
    )


def test_get_billing_history():
    headers = get_owner_token()
    res = client.get("/api/v1/subscriptions/history", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["data"]) >= 1
    invoice = body["data"][0]
    assert "id" in invoice
    assert "amount" in invoice
    assert invoice["status"] == "Paid"


def test_cancel_subscription():
    headers = get_owner_token()
    res = client.post("/api/v1/subscriptions/cancel", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["status"] == "canceled"
    assert body["data"]["is_auto_renew"] is False

    # Restore to active
    order_id = f"order_{secrets.token_hex(8)}"
    payment_id = f"pay_{secrets.token_hex(8)}"
    sig = razorpay_service.generate_signature(order_id, payment_id)
    client.post(
        "/api/v1/subscriptions/razorpay/verify",
        headers=headers,
        json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": sig,
            "plan_code": "professional",
            "billing_cycle": "monthly",
        },
    )
