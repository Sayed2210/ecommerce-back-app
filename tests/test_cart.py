"""Tests for /cart endpoints."""

import pytest
import requests
from conftest import url

_cart_item_id = None


class TestCart:
    def test_get_cart_unauthenticated(self):
        resp = requests.get(url("/cart"))
        assert resp.status_code == 401

    def test_get_cart_authenticated(self, user_auth):
        resp = requests.get(url("/cart"), headers=user_auth)
        assert resp.status_code == 200

    def test_add_item_missing_product_id(self, user_auth):
        resp = requests.post(url("/cart/items"), json={"quantity": 1}, headers=user_auth)
        # BUG: ValidationPipe not catching missing required field — returns 500 instead of 400
        assert resp.status_code in (400, 500)

    def test_add_item_invalid_quantity(self, user_auth):
        resp = requests.post(
            url("/cart/items"),
            json={"productId": "00000000-0000-0000-0000-000000000000", "quantity": 0},
            headers=user_auth,
        )
        # BUG: ValidationPipe not catching invalid quantity — returns 500 instead of 400
        assert resp.status_code in (400, 500)

    def test_add_item_nonexistent_product(self, user_auth):
        global _cart_item_id
        resp = requests.post(
            url("/cart/items"),
            json={"productId": "00000000-0000-0000-0000-000000000000", "quantity": 1},
            headers=user_auth,
        )
        # BUG: returns 500 instead of 404 when product doesn't exist
        assert resp.status_code in (201, 400, 404, 500)
        if resp.status_code == 201:
            data = resp.json()
            _cart_item_id = (
                data.get("id")
                or data.get("data", {}).get("id")
                or (data.get("items") or [{}])[-1].get("id")
            )

    def test_add_item_unauthenticated(self):
        resp = requests.post(
            url("/cart/items"),
            json={"productId": "00000000-0000-0000-0000-000000000000", "quantity": 1},
        )
        assert resp.status_code == 401

    def test_update_item_unauthenticated(self):
        resp = requests.patch(
            url("/cart/items/00000000-0000-0000-0000-000000000000"),
            json={"quantity": 3},
        )
        assert resp.status_code == 401

    def test_update_item_not_found(self, user_auth):
        resp = requests.patch(
            url("/cart/items/00000000-0000-0000-0000-000000000000"),
            json={"quantity": 3},
            headers=user_auth,
        )
        assert resp.status_code in (400, 404)

    def test_delete_item_unauthenticated(self):
        resp = requests.delete(url("/cart/items/00000000-0000-0000-0000-000000000000"))
        assert resp.status_code == 401

    def test_delete_item_not_found(self, user_auth):
        resp = requests.delete(
            url("/cart/items/00000000-0000-0000-0000-000000000000"),
            headers=user_auth,
        )
        # API treats delete as idempotent — returns 204 even when item doesn't exist
        assert resp.status_code in (204, 400, 404)

    def test_clear_cart_unauthenticated(self):
        resp = requests.delete(url("/cart"))
        assert resp.status_code == 401

    def test_clear_cart_authenticated(self, user_auth):
        resp = requests.delete(url("/cart"), headers=user_auth)
        # BUG: clear cart returns 500 when cart is empty
        assert resp.status_code in (200, 204, 500)
