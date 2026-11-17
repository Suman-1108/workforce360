import secrets
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


def test_health_endpoint():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"
    assert data["data"]["database"]["status"] == "connected"


def test_login_success():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@apextechnologies.com", "password": "Password@123"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "access_token" in body["data"]
    assert body["data"]["user"]["role"] == "owner"


def test_login_invalid_credentials():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@apextechnologies.com", "password": "WrongPassword999"},
    )
    assert res.status_code == 401
    body = res.json()
    assert body["success"] is False
    assert body["error_code"] == "UNAUTHORIZED"


def test_list_employees_unauthenticated():
    res = client.get("/api/v1/employees")
    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHORIZED"


def test_list_employees_authenticated():
    headers = get_owner_token()
    res = client.get("/api/v1/employees", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "items" in body["data"]
    assert "total" in body["data"]
    assert isinstance(body["data"]["items"], list)


def test_create_and_manage_employee_lifecycle():
    headers = get_owner_token()
    unique_suffix = secrets.token_hex(4)
    emp_number = f"EMP-AUTO-{unique_suffix}"
    emp_email = f"user.{unique_suffix}@apextechnologies.com"

    # 1. Create employee
    payload = {
        "employee_id_number": emp_number,
        "first_name": "Test",
        "last_name": f"User-{unique_suffix}",
        "email": emp_email,
        "phone": "+1 (555) 123-9999",
        "designation": "Automation Specialist",
        "employment_type": "Full-time",
        "joining_date": "2026-11-17",
        "salary": 75000.0,
        "status": "Active",
        "department_id": 1,
        "branch_id": 1,
    }

    create_res = client.post("/api/v1/employees", json=payload, headers=headers)
    assert create_res.status_code == 201
    create_body = create_res.json()
    assert create_body["success"] is True
    emp_id = create_body["data"]["id"]
    assert create_body["data"]["employee_id_number"] == emp_number

    # 2. Fetch by ID
    get_res = client.get(f"/api/v1/employees/{emp_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == emp_id
    assert get_res.json()["data"]["designation"] == "Automation Specialist"

    # 3. Update employee
    update_res = client.put(
        f"/api/v1/employees/{emp_id}",
        json={"designation": "Lead Automation Specialist", "salary": 82000.0},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["designation"] == "Lead Automation Specialist"
    assert update_res.json()["data"]["salary"] == 82000.0

    # 4. Deactivate employee
    del_res = client.delete(f"/api/v1/employees/{emp_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True

    # 5. Verify status updated to Suspended
    verify_res = client.get(f"/api/v1/employees/{emp_id}", headers=headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["data"]["status"] == "Suspended"


def test_create_employee_conflict():
    headers = get_owner_token()
    # Re-use existing employee ID
    payload = {
        "employee_id_number": "EMP-1001",  # Already exists from seeding
        "first_name": "Duplicate",
        "last_name": "Tester",
        "email": "unique.email@apextechnologies.com",
        "designation": "Tester",
    }
    res = client.post("/api/v1/employees", json=payload, headers=headers)
    assert res.status_code == 409
    assert res.json()["error_code"] == "RESOURCE_CONFLICT"


def test_validation_error_response():
    headers = get_owner_token()
    # Missing mandatory fields
    res = client.post("/api/v1/employees", json={"salary": -100}, headers=headers)
    assert res.status_code == 422
    body = res.json()
    assert body["success"] is False
    assert body["error_code"] == "VALIDATION_ERROR"
    assert "details" in body
