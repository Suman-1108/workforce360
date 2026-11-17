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
    return res.json()["data"]["access_token"]


def test_list_notifications_unauthenticated():
    res = client.get("/api/v1/notifications")
    assert res.status_code == 401


def test_list_notifications_authenticated():
    token = get_owner_token()
    res = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "items" in body["data"]
    assert "total" in body["data"]
    assert "unread_count" in body["data"]


def test_get_unread_count():
    token = get_owner_token()
    res = client.get(
        "/api/v1/notifications/unread-count",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "unread_count" in body["data"]


def test_mark_single_notification_read():
    token = get_owner_token()
    # List to get a notification
    list_res = client.get(
        "/api/v1/notifications",
        headers={"Authorization": f"Bearer {token}"},
    )
    items = list_res.json()["data"]["items"]
    assert len(items) > 0
    target_id = items[0]["id"]

    res = client.patch(
        f"/api/v1/notifications/{target_id}/read",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.json()["data"]["is_read"] is True


def test_mark_all_notifications_read():
    token = get_owner_token()
    res = client.patch(
        "/api/v1/notifications/read-all",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True

    # Unread count should now be 0
    count_res = client.get(
        "/api/v1/notifications/unread-count",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert count_res.json()["data"]["unread_count"] == 0
