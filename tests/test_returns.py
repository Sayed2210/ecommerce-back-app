"""Tests for /returns endpoints."""

import pytest
import requests
from conftest import url


class TestReturns:
    def test_list_returns_unauthenticated(self):
        resp = requests.get(url("/returns"))
        assert resp.status_code == 401

    def test_list_returns_authenticated(self, admin_auth):
        resp = requests.get(url("/returns"), headers=admin_auth)
        assert resp.status_code == 200

    def test_my_returns_unauthenticated(self):
        resp = requests.get(url("/returns/my"))
        assert resp.status_code == 401

    def test_my_returns_authenticated(self, user_auth):
        resp = requests.get(url("/returns/my"), headers=user_auth)
        # 403 = endpoint requires email verification or specific role the test user lacks
        assert resp.status_code in (200, 403)

    def test_get_return_not_found(self, user_auth):
        resp = requests.get(
            url("/returns/00000000-0000-0000-0000-000000000000"), headers=user_auth
        )
        assert resp.status_code in (403, 404)

    def test_get_return_unauthenticated(self):
        resp = requests.get(url("/returns/00000000-0000-0000-0000-000000000000"))
        assert resp.status_code == 401

    def test_create_return_missing_required(self, user_auth):
        resp = requests.post(url("/returns"), json={}, headers=user_auth)
        # 403 = endpoint requires email verification or specific role
        assert resp.status_code in (400, 403)

    def test_create_return_invalid_reason(self, user_auth):
        resp = requests.post(
            url("/returns"),
            json={
                "orderId": "00000000-0000-0000-0000-000000000000",
                "orderItemId": "00000000-0000-0000-0000-000000000001",
                "reason": "i_just_dont_like_it",
            },
            headers=user_auth,
        )
        assert resp.status_code in (400, 403)

    def test_create_return_nonexistent_order(self, user_auth):
        resp = requests.post(
            url("/returns"),
            json={
                "orderId": "00000000-0000-0000-0000-000000000000",
                "orderItemId": "00000000-0000-0000-0000-000000000001",
                "reason": "defective",
            },
            headers=user_auth,
        )
        assert resp.status_code in (400, 403, 404)

    def test_create_return_unauthenticated(self):
        resp = requests.post(
            url("/returns"),
            json={
                "orderId": "00000000-0000-0000-0000-000000000000",
                "orderItemId": "00000000-0000-0000-0000-000000000001",
                "reason": "defective",
            },
        )
        assert resp.status_code == 401

    def test_process_return_unauthenticated(self):
        resp = requests.patch(
            url("/returns/00000000-0000-0000-0000-000000000000/process"),
            json={"status": "approved"},
        )
        assert resp.status_code == 401

    def test_process_return_not_found(self, admin_auth):
        resp = requests.patch(
            url("/returns/00000000-0000-0000-0000-000000000000/process"),
            json={"status": "approved"},
            headers=admin_auth,
        )
        assert resp.status_code in (400, 404)
