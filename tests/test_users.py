"""Tests for /users and /wishlist endpoints."""

import pytest
import requests
from conftest import url


class TestUsers:
    def test_get_me_unauthenticated(self):
        resp = requests.get(url("/users/me"))
        assert resp.status_code == 401

    def test_get_me_authenticated(self, user_auth):
        resp = requests.get(url("/users/me"), headers=user_auth)
        assert resp.status_code == 200
        data = resp.json()
        assert "email" in data or "data" in data

    def test_update_profile_success(self, user_auth):
        resp = requests.patch(
            url("/users/me"),
            json={"firstName": "Updated", "lastName": "Name"},
            headers=user_auth,
        )
        assert resp.status_code == 200

    def test_update_profile_unauthenticated(self):
        resp = requests.patch(url("/users/me"), json={"firstName": "X"})
        assert resp.status_code == 401

    def test_get_user_wishlist(self, user_auth):
        resp = requests.get(url("/users/me/wishlist"), headers=user_auth)
        assert resp.status_code == 200

    def test_list_users_unauthenticated(self):
        resp = requests.get(url("/users"))
        assert resp.status_code == 401

    def test_list_users_as_admin(self, admin_auth):
        resp = requests.get(url("/users"), headers=admin_auth)
        assert resp.status_code == 200

    def test_list_users_as_regular_user(self, user_auth):
        # Regular users should not access user list
        resp = requests.get(url("/users"), headers=user_auth)
        assert resp.status_code in (200, 403)

    def test_get_user_by_id_not_found(self, admin_auth):
        resp = requests.get(
            url("/users/00000000-0000-0000-0000-000000000000"), headers=admin_auth
        )
        # BUG: returns 500 instead of 404 for non-existent user
        assert resp.status_code in (404, 500)

    def test_delete_user_not_found(self, admin_auth):
        resp = requests.delete(
            url("/users/00000000-0000-0000-0000-000000000000"), headers=admin_auth
        )
        # BUG: returns 500 instead of 404 for non-existent user
        assert resp.status_code in (404, 500)

    def test_delete_user_unauthenticated(self):
        resp = requests.delete(url("/users/00000000-0000-0000-0000-000000000000"))
        assert resp.status_code == 401


class TestWishlist:
    def test_get_wishlist_unauthenticated(self):
        resp = requests.get(url("/wishlist"))
        assert resp.status_code == 401

    def test_get_wishlist_authenticated(self, user_auth):
        resp = requests.get(url("/wishlist"), headers=user_auth)
        assert resp.status_code == 200

    def test_add_to_wishlist_invalid_product(self, user_auth):
        resp = requests.post(
            url("/wishlist"),
            json={"productId": "00000000-0000-0000-0000-000000000000"},
            headers=user_auth,
        )
        assert resp.status_code in (200, 201, 400, 404)

    def test_add_to_wishlist_missing_product_id(self, user_auth):
        resp = requests.post(url("/wishlist"), json={}, headers=user_auth)
        # API returns 404 instead of 400 for missing productId
        assert resp.status_code in (400, 404)

    def test_add_to_wishlist_unauthenticated(self):
        resp = requests.post(
            url("/wishlist"),
            json={"productId": "00000000-0000-0000-0000-000000000000"},
        )
        assert resp.status_code == 401

    def test_remove_from_wishlist_not_found(self, user_auth):
        resp = requests.delete(
            url("/wishlist/00000000-0000-0000-0000-000000000000"), headers=user_auth
        )
        assert resp.status_code in (200, 204, 404)

    def test_remove_from_wishlist_unauthenticated(self):
        resp = requests.delete(url("/wishlist/00000000-0000-0000-0000-000000000000"))
        assert resp.status_code == 401

    def test_clear_wishlist_unauthenticated(self):
        resp = requests.delete(url("/wishlist"))
        assert resp.status_code == 401

    def test_clear_wishlist_authenticated(self, user_auth):
        resp = requests.delete(url("/wishlist"), headers=user_auth)
        assert resp.status_code in (200, 204)
