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


def test_list_uniform_items_unauthenticated():
    res = client.get("/api/v1/uniforms/items")
    assert res.status_code == 401
    assert res.json()["error_code"] == "UNAUTHORIZED"


def test_list_uniform_items():
    headers = get_owner_token()
    res = client.get("/api/v1/uniforms/items", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["total"] >= 3
    names = [i["name"] for i in body["data"]["items"]]
    assert "High-Visibility Safety Vest" in names or "Operations Polo Shirt" in names


def test_uniform_item_lifecycle_crud():
    headers = get_owner_token()
    unique_suffix = secrets.token_hex(3).upper()

    # 1. Create item
    create_payload = {
        "name": f"Flame Resistant Jacket {unique_suffix}",
        "category": "Protective Gear",
        "sizes_available": "M, L, XL",
        "total_stock": 50,
    }
    create_res = client.post("/api/v1/uniforms/items", headers=headers, json=create_payload)
    assert create_res.status_code == 201
    item_data = create_res.json()["data"]
    item_id = item_data["id"]
    assert item_data["available_stock"] == 50

    # 2. Get item
    get_res = client.get(f"/api/v1/uniforms/items/{item_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["category"] == "Protective Gear"

    # 3. Update item
    update_res = client.put(
        f"/api/v1/uniforms/items/{item_id}",
        headers=headers,
        json={"total_stock": 75},
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["total_stock"] == 75
    assert update_res.json()["data"]["available_stock"] == 75

    # 4. Delete item
    del_res = client.delete(f"/api/v1/uniforms/items/{item_id}", headers=headers)
    assert del_res.status_code == 200

    # 5. Verify 404
    v_res = client.get(f"/api/v1/uniforms/items/{item_id}", headers=headers)
    assert v_res.status_code == 404
    assert v_res.json()["error_code"] == "RESOURCE_NOT_FOUND"


def test_issue_and_return_uniform_workflow():
    headers = get_owner_token()
    unique_suffix = secrets.token_hex(3).upper()

    # 1. Create stock item
    create_res = client.post(
        "/api/v1/uniforms/items",
        headers=headers,
        json={
            "name": f"Tactical Belt {unique_suffix}",
            "category": "Equipment",
            "sizes_available": "Standard",
            "total_stock": 10,
        },
    )
    assert create_res.status_code == 201
    item_id = create_res.json()["data"]["id"]

    try:
        # 2. Issue 2 units to Employee 1
        issue_payload = {
            "employee_id": 1,
            "uniform_item_id": item_id,
            "size": "STANDARD",
            "quantity": 2,
            "notes": "Initial deployment gear",
        }
        issue_res = client.post("/api/v1/uniforms/issue", headers=headers, json=issue_payload)
        assert issue_res.status_code == 201
        dist_data = issue_res.json()["data"]
        dist_id = dist_data["id"]
        assert dist_data["quantity"] == 2
        assert dist_data["status"] == "Issued"

        # 3. Verify stock reduced
        get_res = client.get(f"/api/v1/uniforms/items/{item_id}", headers=headers)
        assert get_res.json()["data"]["available_stock"] == 8
        assert get_res.json()["data"]["distributed_stock"] == 2

        # 4. Over-issuance must return 409 Conflict
        over_res = client.post(
            "/api/v1/uniforms/issue",
            headers=headers,
            json={
                "employee_id": 1,
                "uniform_item_id": item_id,
                "size": "STANDARD",
                "quantity": 20,
            },
        )
        assert over_res.status_code == 409
        assert over_res.json()["error_code"] == "RESOURCE_CONFLICT"

        # 5. Deletion must be rejected while units are distributed
        blocked_del_res = client.delete(f"/api/v1/uniforms/items/{item_id}", headers=headers)
        assert blocked_del_res.status_code == 409
        assert blocked_del_res.json()["error_code"] == "RESOURCE_CONFLICT"

        # 6. Return uniform asset to stock
        return_res = client.post(
            f"/api/v1/uniforms/distributions/{dist_id}/action",
            headers=headers,
            json={"status": "Returned", "notes": "Returned upon shift re-assignment"},
        )
        assert return_res.status_code == 200
        assert return_res.json()["data"]["status"] == "Returned"

        # 7. Verify stock restored
        re_get_res = client.get(f"/api/v1/uniforms/items/{item_id}", headers=headers)
        assert re_get_res.json()["data"]["available_stock"] == 10
        assert re_get_res.json()["data"]["distributed_stock"] == 0

    finally:
        # Clean up
        client.delete(f"/api/v1/uniforms/items/{item_id}", headers=headers)


def test_bulk_issue_uniform_workflow():
    headers = get_owner_token()
    unique_suffix = secrets.token_hex(3).upper()

    # 1. Create item with ample stock
    create_res = client.post(
        "/api/v1/uniforms/items",
        headers=headers,
        json={
            "name": f"Bulk Field Kit {unique_suffix}",
            "code": f"UNIF-BULK-{unique_suffix}",
            "category": "Field Engineering",
            "gender_group": "Technical Field Engineers",
            "sizes_available": "M, L, XL",
            "total_stock": 50,
        },
    )
    assert create_res.status_code == 201
    item_id = create_res.json()["data"]["id"]

    try:
        # 2. Bulk issue to employee IDs [1]
        bulk_res = client.post(
            "/api/v1/uniforms/bulk-issue",
            headers=headers,
            json={
                "uniform_item_id": item_id,
                "employee_ids": [1],
                "size": "L",
                "quantity": 2,
                "notes": "Bulk kit deployment test",
            },
        )
        assert bulk_res.status_code == 201
        bulk_data = bulk_res.json()["data"]
        assert bulk_data["total_assigned"] == 1
        assert len(bulk_data["items"]) == 1

        # 3. Check stock deducted
        item_res = client.get(f"/api/v1/uniforms/items/{item_id}", headers=headers)
        assert item_res.json()["data"]["available_stock"] == 48

        # 4. Check my-uniforms returns the item
        my_res = client.get("/api/v1/uniforms/my-uniforms", headers=headers)
        assert my_res.status_code == 200

    finally:
        # Reclaim & cleanup
        dists_res = client.get(f"/api/v1/uniforms/distributions?uniform_item_id={item_id}", headers=headers)
        for d in dists_res.json()["data"]["items"]:
            client.post(f"/api/v1/uniforms/distributions/{d['id']}/action", headers=headers, json={"status": "Returned"})
        client.delete(f"/api/v1/uniforms/items/{item_id}", headers=headers)
