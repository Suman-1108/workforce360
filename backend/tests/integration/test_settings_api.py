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


def test_get_settings_unauthenticated():
    res = client.get("/api/v1/organizations/settings")
    assert res.status_code == 401


def test_get_settings_authenticated():
    headers = get_owner_token()
    res = client.get("/api/v1/organizations/settings", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert "organization" in data
    assert "attendance" in data
    assert "shift" in data
    assert "notifications" in data
    assert "security" in data
    assert data["attendance"]["geofence_radius_meters"] > 0
    assert data["shift"]["default_working_hours"] > 0


def test_update_settings_authenticated():
    headers = get_owner_token()
    update_payload = {
        "attendance": {
            "require_gps": True,
            "require_selfie": True,
            "geofence_radius_meters": 650,
            "grace_period_mins": 20,
            "auto_half_day_under_hours": 4.5,
            "strict_geofence": True,
        },
        "shift": {
            "default_working_hours": 8.0,
            "break_duration_mins": 50,
            "working_days": "Monday,Tuesday,Wednesday,Thursday,Friday",
            "allow_overtime": True,
        },
    }
    res = client.put("/api/v1/organizations/settings", headers=headers, json=update_payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["attendance"]["geofence_radius_meters"] == 650
    assert data["attendance"]["grace_period_mins"] == 20
    assert data["shift"]["break_duration_mins"] == 50


def test_auth_profile_update_and_sessions():
    headers = get_owner_token()
    # Profile update
    res = client.put(
        "/api/v1/auth/profile",
        headers=headers,
        json={"first_name": "Marcus", "last_name": "Vance", "phone": "+1-555-019-2834"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["first_name"] == "Marcus"
    assert data["last_name"] == "Vance"

    # Sessions
    res_sess = client.get("/api/v1/auth/sessions", headers=headers)
    assert res_sess.status_code == 200
    sess_data = res_sess.json()["data"]
    assert len(sess_data) >= 1
    assert sess_data[0]["status"] == "Active"


def test_change_password_invalid_current():
    headers = get_owner_token()
    res = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={
            "current_password": "WrongPassword!999",
            "new_password": "NewSecretPassword@123",
            "confirm_password": "NewSecretPassword@123",
        },
    )
    assert res.status_code == 422 or res.status_code == 400
