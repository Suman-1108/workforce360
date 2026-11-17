import secrets
from datetime import date
from fastapi.testclient import TestClient
from app.main import app
from app.services.geo import verify_geofence, calculate_haversine_distance

client = TestClient(app)


def get_owner_token():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@apextechnologies.com", "password": "Password@123"},
    )
    assert res.status_code == 200
    token = res.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_attendance_unauthenticated():
    res = client.get("/api/v1/attendance")
    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHORIZED"


def test_list_attendance_authenticated():
    headers = get_owner_token()
    res = client.get("/api/v1/attendance", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["total"] >= 4
    record = body["data"]["items"][0]
    assert "employee_name" in record
    assert "status" in record
    assert "is_geofence_verified" in record


def test_get_today_punch_status():
    headers = get_owner_token()
    res = client.get("/api/v1/attendance/today", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert "has_punched_in" in data
    assert "has_punched_out" in data
    assert "shift_name" in data


def test_geofence_haversine_formula():
    """Verify great-circle haversine calculation for GPS verification."""
    # Exact same point: Distance must be 0
    dist_zero = calculate_haversine_distance(37.7749, -122.4190, 37.7749, -122.4190)
    assert dist_zero == 0.0

    # Inside boundary (approx 50 meters away)
    is_inside, dist = verify_geofence(
        user_lat=37.7749,
        user_lon=-122.4195,  # slight offset
        branch_lat=37.7749,
        branch_lon=-122.4190,
        radius_meters=300,
    )
    assert is_inside is True
    assert dist < 300

    # Outside boundary (New York vs San Francisco > 4,000 km)
    is_outside, dist_far = verify_geofence(
        user_lat=40.7128,
        user_lon=-74.0060,
        branch_lat=37.7749,
        branch_lon=-122.4190,
        radius_meters=300,
    )
    assert is_outside is False
    assert dist_far > 4000000


def test_punch_in_and_punch_out_lifecycle():
    headers = get_owner_token()
    unique_suffix = secrets.token_hex(3).lower()

    # 1. Enroll a temporary test employee
    emp_payload = {
        "first_name": "Punch",
        "last_name": f"Tester{unique_suffix}",
        "email": f"punch_{unique_suffix}@apextechnologies.com",
        "employee_id_number": f"PNC-{unique_suffix.upper()}",
        "designation": "Field Specialist",
        "department_id": 1,
        "branch_id": 1,
        "joining_date": str(date.today()),
        "employment_type": "Full-time",
    }
    emp_res = client.post("/api/v1/employees", headers=headers, json=emp_payload)
    assert emp_res.status_code == 201
    test_emp_id = emp_res.json()["data"]["id"]

    try:
        # 2. Punch-in within Apex HQ Geofence (37.7749, -122.4190)
        punch_in_payload = {
            "employee_id": test_emp_id,
            "latitude": 37.7749,
            "longitude": -122.4190,
            "accuracy": 4.5,
            "address": "Apex HQ Front Gate",
            "selfie_url": "https://storage.workforce360.com/selfies/punch_in_01.jpg",
            "notes": "Arrived on schedule",
        }
        in_res = client.post("/api/v1/attendance/punch-in", headers=headers, json=punch_in_payload)
        assert in_res.status_code == 201
        in_data = in_res.json()["data"]
        assert in_data["is_geofence_verified"] is True
        assert in_data["check_in"] is not None
        assert in_data["check_out"] is None

        # 3. Duplicate punch-in must return 409 Conflict
        dup_in_res = client.post("/api/v1/attendance/punch-in", headers=headers, json=punch_in_payload)
        assert dup_in_res.status_code == 409
        assert dup_in_res.json()["error_code"] == "RESOURCE_CONFLICT"

        # 4. Punch-out
        punch_out_payload = {
            "employee_id": test_emp_id,
            "latitude": 37.7749,
            "longitude": -122.4190,
            "address": "Apex HQ Exit Lobby",
            "notes": "Completed day operations",
        }
        out_res = client.post("/api/v1/attendance/punch-out", headers=headers, json=punch_out_payload)
        assert out_res.status_code == 200
        out_data = out_res.json()["data"]
        assert out_data["check_out"] is not None
        assert out_data["work_duration_minutes"] >= 1

        # 5. Duplicate punch-out must return 409 Conflict
        dup_out_res = client.post("/api/v1/attendance/punch-out", headers=headers, json=punch_out_payload)
        assert dup_out_res.status_code == 409
        assert dup_out_res.json()["error_code"] == "RESOURCE_CONFLICT"

    finally:
        # 6. Clean up test employee
        client.delete(f"/api/v1/employees/{test_emp_id}", headers=headers)
