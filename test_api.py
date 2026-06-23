"""
Tests for MyChoice Pages Functions API (D1 backend)
Run: cd /home/ec2-user/mychoice && source backend/venv/bin/activate && python -m pytest test_api.py -v
"""
import requests
import pytest

BASE = "https://mychoice.pages.dev"


def test_get_items_list():
    """GET /items/ returns array"""
    r = requests.get(f"{BASE}/items/")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_create_item_returns_201():
    """POST /items/ returns 201 with created item"""
    r = requests.post(f"{BASE}/items/", json={"name": "PytestCreate", "group": "Primary"})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "PytestCreate"
    assert data["group"] == "Primary"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


def test_unique_per_group_rejects_duplicate():
    """Unique per group: same name+group returns 400"""
    name = f"UniqueTest_{id(pytest)}"
    # First create — should succeed
    r1 = requests.post(f"{BASE}/items/", json={"name": name, "group": "Primary"})
    assert r1.status_code == 201

    # Second create — should fail (unique per group)
    r2 = requests.post(f"{BASE}/items/", json={"name": name, "group": "Primary"})
    assert r2.status_code == 400
    assert "already exists" in r2.json()["detail"]


def test_same_name_different_group_ok():
    """Same name can exist in different groups"""
    name = f"CrossGroup_{id(pytest)}"
    r1 = requests.post(f"{BASE}/items/", json={"name": name, "group": "Primary"})
    assert r1.status_code == 201
    r2 = requests.post(f"{BASE}/items/", json={"name": name, "group": "Secondary"})
    assert r2.status_code == 201
    assert r1.json()["id"] != r2.json()["id"]


def test_get_single_item_200():
    """GET /items/:id returns single item"""
    r = requests.get(f"{BASE}/items/1")
    assert r.status_code == 200
    assert r.json()["id"] == 1


def test_get_nonexistent_returns_404():
    """GET /items/:id with bad id returns 404"""
    r = requests.get(f"{BASE}/items/999999")
    assert r.status_code == 404
    assert "not found" in r.json()["detail"].lower()


def test_patch_updates_item():
    """PATCH /items/:id partially updates"""
    # Create fresh item
    name = f"PatchTest_{id(pytest)}"
    r1 = requests.post(f"{BASE}/items/", json={"name": name, "group": "Secondary"})
    item_id = r1.json()["id"]
    original_created = r1.json()["created_at"]

    # Patch only name
    r2 = requests.patch(f"{BASE}/items/{item_id}", json={"name": f"{name}_UPDATED"})
    assert r2.status_code == 200
    data = r2.json()
    assert data["name"] == f"{name}_UPDATED"
    assert data["group"] == "Secondary"  # unchanged
    assert data["created_at"] == original_created  # timestamp preserved! (trap)


def test_patch_nonexistent_returns_404():
    """PATCH /items/:id with bad id returns 404"""
    r = requests.patch(f"{BASE}/items/999999", json={"name": "Ghost"})
    assert r.status_code == 404


def test_put_returns_405():
    """PUT is not allowed (PATCH only)"""
    r = requests.put(f"{BASE}/items/1", json={"name": "PutTest"})
    assert r.status_code == 405


def test_delete_returns_405():
    """DELETE is not allowed (no DELETE endpoint)"""
    r = requests.delete(f"{BASE}/items/1")
    assert r.status_code == 405


def test_bad_group_returns_400():
    """Invalid group returns 400"""
    r = requests.post(f"{BASE}/items/", json={"name": "BadGroup", "group": "Tertiary"})
    assert r.status_code == 400


def test_empty_name_returns_400():
    """Empty name returns 400"""
    r = requests.post(f"{BASE}/items/", json={"name": "", "group": "Primary"})
    assert r.status_code == 400


def test_timestamps_server_managed():
    """Timestamps are server-managed, client values ignored"""
    r = requests.post(f"{BASE}/items/", json={
        "name": f"TimestampTest_{id(pytest)}",
        "group": "Primary",
        "created_at": "1999-01-01T00:00:00Z",  # should be ignored
        "updated_at": "1999-01-01T00:00:00Z",  # should be ignored
    })
    assert r.status_code == 201
    data = r.json()
    # Should NOT be 1999 — server sets timestamps
    assert not data["created_at"].startswith("1999")
    assert not data["updated_at"].startswith("1999")
