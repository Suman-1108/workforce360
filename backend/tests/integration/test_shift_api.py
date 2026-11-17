import secrets
from datetime import date
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


def test_list_shifts_unauthenticated():
    res = client.get("/api/v1/shifts")
    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHORIZED"


def test_list_shifts_authenticated():
    headers = get_owner_token()
    res = client.get("/api/v1/shifts", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["total"] >= 3
    shift_names = [s["name"] for s in body["data"]["items"]]
    assert "Standard Day Shift" in shift_names


def test_shift_lifecycle_crud():
    headers = get_owner_token()
    unique_suffix = secrets.token_hex(3).upper()
    shift_code = f"NS{unique_suffix}"

    # 1. Create Shift
    create_payload = {
        "name": f"Night Logistics Shift {unique_suffix}",
        "code": shift_code,
        "type": "Night",
        "start_time": "22:00:00",
        "end_time": "06:00:00",
        "grace_period_mins": 10,
        "is_active": True,
    }
    create_res = client.post(
        "/api/v1/shifts",
        headers=headers,
        json=create_payload,
    )
    assert create_res.status_code == 201
    created_shift = create_res.json()["data"]
    shift_id = created_shift["id"]
    assert created_shift["code"] == shift_code
    assert created_shift["start_time"] == "22:00:00"

    # 2. Duplicate Code Conflict Check
    dup_res = client.post(
        "/api/v1/shifts",
        headers=headers,
        json=create_payload,
    )
    assert dup_res.status_code == 409
    assert dup_res.json()["error_code"] == "RESOURCE_CONFLICT"

    # 3. Get Shift Details
    get_res = client.get(
        f"/api/v1/shifts/{shift_id}",
        headers=headers,
    )
    assert get_res.status_code == 200
    assert get_res.json()["data"]["type"] == "Night"

    # 4. Update Shift
    update_res = client.put(
        f"/api/v1/shifts/{shift_id}",
        headers=headers,
        json={"grace_period_mins": 25, "name": f"Night Logistics Updated {unique_suffix}"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["grace_period_mins"] == 25

    # 5. Delete Shift
    del_res = client.delete(
        f"/api/v1/shifts/{shift_id}",
        headers=headers,
    )
    assert del_res.status_code == 200

    # 6. Verify 404
    verify_res = client.get(
        f"/api/v1/shifts/{shift_id}",
        headers=headers,
    )
    assert verify_res.status_code == 404
    assert verify_res.json()["error_code"] == "RESOURCE_NOT_FOUND"


def test_delete_shift_with_assigned_employees_rejected():
    headers = get_owner_token()
    unique_suffix = secrets.token_hex(3).upper()
    code = f"LCK{unique_suffix}"
    
    # 1. Create designated shift
    create_res = client.post(
        "/api/v1/shifts",
        headers=headers,
        json={
            "name": f"Locked Shift {unique_suffix}",
            "code": code,
            "type": "Day",
            "start_time": "10:00:00",
            "end_time": "19:00:00",
            "grace_period_mins": 15,
            "is_active": True,
        },
    )
    assert create_res.status_code == 201
    shift_id = create_res.json()["data"]["id"]

    # 2. Assign employee 1 to this shift
    assign_res = client.post(
        "/api/v1/shifts/assignments",
        headers=headers,
        json={
            "employee_id": 1,
            "shift_id": shift_id,
            "effective_date": str(date.today()),
        },
    )
    assert assign_res.status_code == 201

    # 3. Attempt deletion while assigned employee is active -> Must return 409
    del_res = client.delete(f"/api/v1/shifts/{shift_id}", headers=headers)
    assert del_res.status_code == 409
    assert del_res.json()["error_code"] == "RESOURCE_CONFLICT"


def test_shift_assignment_and_employee_active_lookup():
    headers = get_owner_token()

    # 1. Fetch employee 1's active shift
    emp_shift_res = client.get("/api/v1/shifts/employee/1", headers=headers)
    assert emp_shift_res.status_code == 200
    assert "start_time" in emp_shift_res.json()["data"]

    # 2. Assign employee 1 to Shift 2 (Early Morning Shift)
    assign_payload = {
        "employee_id": 1,
        "shift_id": 2,
        "effective_date": str(date.today()),
    }
    assign_res = client.post(
        "/api/v1/shifts/assignments",
        headers=headers,
        json=assign_payload,
    )
    assert assign_res.status_code == 201
    assigned_data = assign_res.json()["data"]
    assert assigned_data["shift_id"] == 2
    assert assigned_data["employee_id"] == 1

    # 3. List assignments
    list_res = client.get("/api/v1/shifts/assignments?employee_id=1", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()["data"]["total"] >= 1
