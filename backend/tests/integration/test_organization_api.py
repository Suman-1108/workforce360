import secrets
import pytest
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


def test_get_organization_profile_unauthenticated():
    res = client.get("/api/v1/organizations/profile")
    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHORIZED"


def test_get_organization_profile_authenticated():
    headers = get_owner_token()
    res = client.get("/api/v1/organizations/profile", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert "Apex" in data["name"]
    assert data["status"] == "active"
    assert data["department_count"] >= 4
    assert data["branch_count"] >= 1


def test_update_organization_profile():
    headers = get_owner_token()
    update_payload = {
        "contact_phone": "+1-555-888-9999",
        "address": "100 Innovation Boulevard, Tech Park Suite 400",
    }
    res = client.put(
        "/api/v1/organizations/profile",
        headers=headers,
        json=update_payload,
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["contact_phone"] == "+1-555-888-9999"
    assert body["data"]["address"] == "100 Innovation Boulevard, Tech Park Suite 400"


def test_list_departments():
    headers = get_owner_token()
    res = client.get("/api/v1/organizations/departments", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["total"] >= 4
    dept_names = [d["name"] for d in body["data"]["items"]]
    assert "Engineering" in dept_names
    assert "Operations" in dept_names


def test_direct_departments_endpoint():
    """Verify frontend compatibility alias /api/v1/departments."""
    headers = get_owner_token()
    res = client.get("/api/v1/departments", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["total"] >= 4


def test_department_lifecycle_crud():
    headers = get_owner_token()
    unique_suffix = secrets.token_hex(3).upper()
    dept_code = f"QA{unique_suffix}"

    # 1. Create Department
    create_payload = {
        "name": f"Quality Assurance {unique_suffix}",
        "code": dept_code,
        "description": "Automated regression testing and compliance",
        "manager_name": "Test Lead",
    }
    create_res = client.post(
        "/api/v1/organizations/departments",
        headers=headers,
        json=create_payload,
    )
    assert create_res.status_code == 201
    created_dept = create_res.json()["data"]
    dept_id = created_dept["id"]
    assert created_dept["code"] == dept_code

    # 2. Duplicate Code Conflict Check
    dup_res = client.post(
        "/api/v1/organizations/departments",
        headers=headers,
        json=create_payload,
    )
    assert dup_res.status_code == 409
    assert dup_res.json()["error_code"] == "RESOURCE_CONFLICT"

    # 3. Get Department Details
    get_res = client.get(
        f"/api/v1/organizations/departments/{dept_id}",
        headers=headers,
    )
    assert get_res.status_code == 200
    assert get_res.json()["data"]["name"] == f"Quality Assurance {unique_suffix}"

    # 4. Update Department
    update_res = client.put(
        f"/api/v1/organizations/departments/{dept_id}",
        headers=headers,
        json={"manager_name": "Senior Test Lead", "description": "Updated scope"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["manager_name"] == "Senior Test Lead"

    # 5. Delete Department
    del_res = client.delete(
        f"/api/v1/organizations/departments/{dept_id}",
        headers=headers,
    )
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 6. Verify Deleted
    verify_res = client.get(
        f"/api/v1/organizations/departments/{dept_id}",
        headers=headers,
    )
    assert verify_res.status_code == 404


def test_delete_department_with_employees_rejected():
    headers = get_owner_token()
    # Department 1 (Engineering) has an assigned employee
    res = client.delete("/api/v1/organizations/departments/1", headers=headers)
    assert res.status_code == 409
    assert res.json()["error_code"] == "RESOURCE_CONFLICT"


def test_list_branches():
    headers = get_owner_token()
    res = client.get("/api/v1/organizations/branches", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["total"] >= 1
    branch = body["data"]["items"][0]
    assert branch["name"] == "Apex HQ Campus"
    assert branch["latitude"] == pytest.approx(37.7749, rel=1e-3)
    assert branch["longitude"] == pytest.approx(-122.419, rel=1e-3)
    assert branch["radius_meters"] == 300


def test_branch_lifecycle_crud():
    headers = get_owner_token()
    unique_suffix = secrets.token_hex(3).upper()
    branch_code = f"HUB{unique_suffix}"

    # 1. Validation rejection on invalid latitude
    bad_res = client.post(
        "/api/v1/organizations/branches",
        headers=headers,
        json={
            "name": f"Invalid Branch {unique_suffix}",
            "code": branch_code,
            "latitude": 150.0,  # Invalid latitude > 90
            "longitude": -121.8863,
            "radius_meters": 250,
        },
    )
    assert bad_res.status_code == 422

    # 2. Valid Create Branch
    create_payload = {
        "name": f"Distribution Hub {unique_suffix}",
        "code": branch_code,
        "address": "450 Logistics Way",
        "city": "San Jose",
        "state": "CA",
        "latitude": 37.3382,
        "longitude": -121.8863,
        "radius_meters": 250,
        "is_active": True,
    }
    create_res = client.post(
        "/api/v1/organizations/branches",
        headers=headers,
        json=create_payload,
    )
    assert create_res.status_code == 201
    created_branch = create_res.json()["data"]
    branch_id = created_branch["id"]
    assert created_branch["code"] == branch_code
    assert created_branch["radius_meters"] == 250

    # 3. Get Branch
    get_res = client.get(
        f"/api/v1/organizations/branches/{branch_id}",
        headers=headers,
    )
    assert get_res.status_code == 200
    assert get_res.json()["data"]["city"] == "San Jose"

    # 4. Update Branch
    up_res = client.put(
        f"/api/v1/organizations/branches/{branch_id}",
        headers=headers,
        json={"radius_meters": 350, "city": "San Jose South"},
    )
    assert up_res.status_code == 200
    assert up_res.json()["data"]["radius_meters"] == 350
    assert up_res.json()["data"]["city"] == "San Jose South"

    # 5. Delete Branch
    del_res = client.delete(
        f"/api/v1/organizations/branches/{branch_id}",
        headers=headers,
    )
    assert del_res.status_code == 200

    # 6. Verify 404
    v_res = client.get(
        f"/api/v1/organizations/branches/{branch_id}",
        headers=headers,
    )
    assert v_res.status_code == 404
