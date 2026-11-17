import secrets
from datetime import date, timedelta
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


def test_list_leaves_unauthenticated():
    res = client.get("/api/v1/leaves")
    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHORIZED"


def test_list_leave_types():
    headers = get_owner_token()
    res = client.get("/api/v1/leaves/types", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["total"] >= 3
    type_names = [t["name"] for t in body["data"]["items"]]
    assert "Casual Leave" in type_names
    assert "Medical / Sick Leave" in type_names


def test_leave_application_and_approval_workflow():
    headers = get_owner_token()
    unique_suffix = secrets.token_hex(3).lower()

    # 1. Enroll temporary employee
    emp_payload = {
        "first_name": "Leave",
        "last_name": f"Tester{unique_suffix}",
        "email": f"leave_{unique_suffix}@apextechnologies.com",
        "employee_id_number": f"LVE-{unique_suffix.upper()}",
        "designation": "Analyst",
        "department_id": 1,
        "branch_id": 1,
        "joining_date": str(date.today()),
        "employment_type": "Full-time",
    }
    emp_res = client.post("/api/v1/employees", headers=headers, json=emp_payload)
    assert emp_res.status_code == 201
    test_emp_id = emp_res.json()["data"]["id"]

    try:
        # 2. Apply for 3 days of leave
        start = date(2026, 12, 1)
        end = date(2026, 12, 3)
        apply_payload = {
            "employee_id": test_emp_id,
            "leave_type_id": 1,
            "start_date": str(start),
            "end_date": str(end),
            "reason": "Personal family commitment",
        }
        apply_res = client.post("/api/v1/leaves", headers=headers, json=apply_payload)
        assert apply_res.status_code == 201
        leave_data = apply_res.json()["data"]
        leave_id = leave_data["id"]
        assert leave_data["status"] == "Pending"
        assert leave_data["total_days"] == 3

        # 3. Overlapping leave must be rejected with 409 Conflict
        overlap_payload = {
            "employee_id": test_emp_id,
            "leave_type_id": 2,
            "start_date": str(date(2026, 12, 2)),
            "end_date": str(date(2026, 12, 5)),
            "reason": "Overlapping request",
        }
        overlap_res = client.post("/api/v1/leaves", headers=headers, json=overlap_payload)
        assert overlap_res.status_code == 409
        assert overlap_res.json()["error_code"] == "RESOURCE_CONFLICT"

        # 4. Approve Leave
        action_res = client.post(
            f"/api/v1/leaves/{leave_id}/action",
            headers=headers,
            json={"action": "Approved"},
        )
        assert action_res.status_code == 200
        approved_data = action_res.json()["data"]
        assert approved_data["status"] == "Approved"
        assert approved_data["approved_by_id"] is not None

        # 5. Subsequent action on non-pending leave must return 409 Conflict
        re_action_res = client.post(
            f"/api/v1/leaves/{leave_id}/action",
            headers=headers,
            json={"action": "Rejected"},
        )
        assert re_action_res.status_code == 409
        assert re_action_res.json()["error_code"] == "RESOURCE_CONFLICT"

    finally:
        client.delete(f"/api/v1/employees/{test_emp_id}", headers=headers)


def test_leave_rejection_workflow():
    headers = get_owner_token()
    unique_suffix = secrets.token_hex(3).lower()

    # 1. Enroll temporary employee
    emp_payload = {
        "first_name": "Reject",
        "last_name": f"Tester{unique_suffix}",
        "email": f"reject_{unique_suffix}@apextechnologies.com",
        "employee_id_number": f"REJ-{unique_suffix.upper()}",
        "designation": "Operator",
        "department_id": 2,
        "branch_id": 1,
        "joining_date": str(date.today()),
        "employment_type": "Full-time",
    }
    emp_res = client.post("/api/v1/employees", headers=headers, json=emp_payload)
    assert emp_res.status_code == 201
    test_emp_id = emp_res.json()["data"]["id"]

    try:
        # 2. Apply for leave
        apply_payload = {
            "employee_id": test_emp_id,
            "leave_type_id": 1,
            "start_date": str(date(2026, 12, 10)),
            "end_date": str(date(2026, 12, 11)),
            "reason": "Short break",
        }
        apply_res = client.post("/api/v1/leaves", headers=headers, json=apply_payload)
        assert apply_res.status_code == 201
        leave_id = apply_res.json()["data"]["id"]

        # 3. Reject with manager reason
        action_res = client.post(
            f"/api/v1/leaves/{leave_id}/action",
            headers=headers,
            json={"action": "Rejected", "rejection_reason": "High shift priority window."},
        )
        assert action_res.status_code == 200
        rejected_data = action_res.json()["data"]
        assert rejected_data["status"] == "Rejected"
        assert rejected_data["rejection_reason"] == "High shift priority window."

    finally:
        client.delete(f"/api/v1/employees/{test_emp_id}", headers=headers)
