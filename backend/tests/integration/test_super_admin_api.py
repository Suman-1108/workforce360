from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_owner_token():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@apextechnologies.com", "password": "Password@123"},
    )
    assert res.status_code == 200
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def get_superadmin_token():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@workforce360.io", "password": "Password@123"},
    )
    assert res.status_code == 200
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_stats_forbidden_for_owner():
    owner_headers = get_owner_token()
    res = client.get("/api/v1/superadmin/stats", headers=owner_headers)
    assert res.status_code == 403
    assert res.json()["error_code"] == "FORBIDDEN"


def test_stats_authenticated_superadmin():
    admin_headers = get_superadmin_token()
    res = client.get("/api/v1/superadmin/stats", headers=admin_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["total_tenants"] >= 1
    assert data["active_tenants"] >= 1
    assert data["total_employees"] >= 1
    assert data["mrr"] >= 0.0
    assert data["arr"] >= 0.0
    # Also verify flattened properties for frontend compatibility
    assert body["total_tenants"] >= 1


def test_list_tenants():
    admin_headers = get_superadmin_token()
    res = client.get("/api/v1/superadmin/tenants", headers=admin_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    tenants = body["data"]
    assert len(tenants) >= 1
    names = [t["name"] for t in tenants]
    assert "Apex Global Technologies" in names


def test_update_tenant_status_lifecycle():
    admin_headers = get_superadmin_token()

    # 1. Suspend tenant 1
    suspend_res = client.post(
        "/api/v1/superadmin/tenants/1/status",
        headers=admin_headers,
        json={"status": "suspended"},
    )
    assert suspend_res.status_code == 200
    assert suspend_res.json()["data"]["status"] == "suspended"

    # 2. Reactivate tenant 1
    activate_res = client.post(
        "/api/v1/superadmin/tenants/1/status",
        headers=admin_headers,
        json={"status": "active"},
    )
    assert activate_res.status_code == 200
    assert activate_res.json()["data"]["status"] == "active"
