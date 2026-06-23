from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from .models import Item


class ItemAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.list_url = "/items/"

    def detail_url(self, pk):
        return f"/items/{pk}/"

    # ------------------------------------------------------------------
    # Create item — success
    # ------------------------------------------------------------------
    def test_create_item_success(self):
        payload = {"name": "Widget", "group": "Primary"}
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["name"], "Widget")
        self.assertEqual(data["group"], "Primary")
        self.assertIn("id", data)
        self.assertIn("created_at", data)
        self.assertIn("updated_at", data)
        self.assertEqual(Item.objects.count(), 1)

    # ------------------------------------------------------------------
    # Create duplicate name+group — 400
    # ------------------------------------------------------------------
    def test_create_duplicate_name_group_returns_400(self):
        Item.objects.create(name="Widget", group="Primary")
        payload = {"name": "Widget", "group": "Primary"}
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # The error may surface via serializer validation or DB constraint —
        # either way the response body must be a non-empty error dict.
        body = response.json()
        self.assertIsInstance(body, dict)
        self.assertTrue(len(body) > 0, "Expected a non-empty error body")

    # ------------------------------------------------------------------
    # Same name, different group — allowed (201)
    # ------------------------------------------------------------------
    def test_same_name_different_group_allowed(self):
        Item.objects.create(name="Widget", group="Primary")
        payload = {"name": "Widget", "group": "Secondary"}
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Item.objects.count(), 2)

    # ------------------------------------------------------------------
    # Invalid group value — 400
    # ------------------------------------------------------------------
    def test_create_invalid_group_returns_400(self):
        payload = {"name": "Widget", "group": "Tertiary"}
        response = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        body = response.json()
        self.assertIn("group", body)

    # ------------------------------------------------------------------
    # List items
    # ------------------------------------------------------------------
    def test_list_items(self):
        Item.objects.create(name="Alpha", group="Primary")
        Item.objects.create(name="Beta", group="Secondary")
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 2)
        names = [item["name"] for item in data]
        self.assertIn("Alpha", names)
        self.assertIn("Beta", names)

    def test_list_items_empty(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])

    # ------------------------------------------------------------------
    # Get item by id
    # ------------------------------------------------------------------
    def test_get_item_by_id(self):
        item = Item.objects.create(name="Alpha", group="Primary")
        response = self.client.get(self.detail_url(item.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["id"], item.pk)
        self.assertEqual(data["name"], "Alpha")
        self.assertEqual(data["group"], "Primary")

    def test_get_item_404_for_missing(self):
        response = self.client.get(self.detail_url(99999))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        body = response.json()
        self.assertIn("detail", body)

    # ------------------------------------------------------------------
    # Patch item
    # ------------------------------------------------------------------
    def test_patch_item_name(self):
        item = Item.objects.create(name="Alpha", group="Primary")
        response = self.client.patch(
            self.detail_url(item.pk), {"name": "AlphaUpdated"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["name"], "AlphaUpdated")
        self.assertEqual(data["group"], "Primary")  # unchanged

    def test_patch_item_group(self):
        item = Item.objects.create(name="Alpha", group="Primary")
        response = self.client.patch(
            self.detail_url(item.pk), {"group": "Secondary"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["group"], "Secondary")

    def test_patch_item_404_for_missing(self):
        response = self.client.patch(
            self.detail_url(99999), {"name": "Ghost"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_item_duplicate_conflict_returns_400(self):
        Item.objects.create(name="Alpha", group="Primary")
        item2 = Item.objects.create(name="Beta", group="Primary")
        # Try to rename item2 to Alpha in the same group — should conflict
        response = self.client.patch(
            self.detail_url(item2.pk), {"name": "Alpha"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ------------------------------------------------------------------
    # Trap 5: created_at / updated_at are read-only (client can't set them)
    # ------------------------------------------------------------------
    def test_timestamps_are_read_only(self):
        fake_ts = "2000-01-01T00:00:00Z"
        response = self.client.post(
            self.list_url,
            {"name": "Widget", "group": "Primary", "created_at": fake_ts, "updated_at": fake_ts},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertNotEqual(data["created_at"], fake_ts)
        self.assertNotEqual(data["updated_at"], fake_ts)
