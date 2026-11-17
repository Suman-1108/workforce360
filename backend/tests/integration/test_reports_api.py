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


def test_reports_summary_unauthenticated():
    res = client.get("/api/v1/reports/summary")
    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHORIZED"


def test_reports_summary_authenticated():
    headers = get_owner_token()
    res = client.get("/api/v1/reports/summary", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert "total_employees" in data
    assert "total_shifts" in data
    assert "present_today" in data
    assert "absent_today" in data
    assert "late_arrivals" in data
    assert "on_leave" in data
    assert "on_time_compliance_rate" in data


def test_weekly_attendance_trends():
    headers = get_owner_token()
    res = client.get("/api/v1/reports/weekly-attendance", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["data"]) >= 4
    assert body["data"][0]["week"] == "Week 1"


def test_daily_trends():
    headers = get_owner_token()
    res = client.get("/api/v1/reports/daily-trends", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert len(body["data"]) == 7
    assert "day" in body["data"][0]
    assert "present" in body["data"][0]


def test_department_distribution():
    headers = get_owner_token()
    res = client.get("/api/v1/reports/department-distribution", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_shift_distribution():
    headers = get_owner_token()
    res = client.get("/api/v1/reports/shift-distribution", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)


def test_recent_activity():
    headers = get_owner_token()
    res = client.get("/api/v1/reports/recent-activity", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"], list)
