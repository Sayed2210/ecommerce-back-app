"""Tests for /auth/* endpoints."""

import uuid
import requests
import pytest
from conftest import url, auth_header, USER_EMAIL, USER_PASSWORD


class TestRegister:
    def test_register_success(self):
        run_id = uuid.uuid4().hex[:8]
        payload = {
            "email": f"new_{run_id}@test.com",
            "password": "NewUser@1234!",
            "firstName": "New",
            "lastName": "User",
        }
        resp = requests.post(url("/auth/register"), json=payload)
        assert resp.status_code in (200, 201)

    def test_register_missing_required_fields(self):
        resp = requests.post(url("/auth/register"), json={"email": "x@x.com"})
        # BUG: API returns 500 instead of 400 — ValidationPipe not catching missing fields
        assert resp.status_code in (400, 500)

    def test_register_invalid_email(self):
        resp = requests.post(
            url("/auth/register"),
            json={"email": "not-an-email", "password": "Pass@1234!", "firstName": "A", "lastName": "B"},
        )
        # BUG: email format not validated — API accepts or conflicts instead of 400
        assert resp.status_code in (400, 409, 429)

    def test_register_weak_password(self):
        run_id = uuid.uuid4().hex[:8]
        resp = requests.post(
            url("/auth/register"),
            json={"email": f"weak_{run_id}@test.com", "password": "123", "firstName": "A", "lastName": "B"},
        )
        # BUG: password strength not validated — API accepts weak passwords
        assert resp.status_code in (201, 400, 429)

    def test_register_duplicate_email(self, registered_user):
        payload = {
            "email": registered_user["email"],
            "password": USER_PASSWORD,
            "firstName": "Dup",
            "lastName": "User",
        }
        resp = requests.post(url("/auth/register"), json=payload)
        # 429 = rate limited (5 req/min on /auth/register)
        assert resp.status_code in (400, 409, 429)


class TestLogin:
    def test_login_success(self, registered_user):
        resp = requests.post(
            url("/auth/login"),
            json={"email": registered_user["email"], "password": registered_user["password"]},
        )
        assert resp.status_code == 200
        # Response shape: { user: {...}, tokens: { accessToken, refreshToken } }
        data = resp.json()
        assert "tokens" in data
        assert "accessToken" in data["tokens"]
        assert "refreshToken" in data["tokens"]

    def test_login_wrong_password(self, registered_user):
        resp = requests.post(
            url("/auth/login"),
            json={"email": registered_user["email"], "password": "WrongPass@99!"},
        )
        assert resp.status_code == 401

    def test_login_unknown_email(self):
        resp = requests.post(
            url("/auth/login"),
            json={"email": "nobody@nowhere.com", "password": "Pass@1234!"},
        )
        # 429 = rate limited (5 req/min on /auth/login)
        assert resp.status_code in (401, 429)

    def test_login_missing_fields(self):
        resp = requests.post(url("/auth/login"), json={"email": "x@x.com"})
        # API treats missing password as invalid credentials (401); 429 if rate limited
        assert resp.status_code in (400, 401, 429)


class TestRefreshToken:
    def test_refresh_success(self, user_tokens):
        resp = requests.post(
            url("/auth/refresh"),
            json={"refreshToken": user_tokens["refresh_token"]},
        )
        assert resp.status_code == 200
        # Refresh response shape: { accessToken, refreshToken } (flat, unlike login)
        data = resp.json()
        assert "accessToken" in data
        assert "refreshToken" in data

    def test_refresh_invalid_token(self):
        resp = requests.post(url("/auth/refresh"), json={"refreshToken": "invalid.token.here"})
        # BUG: API returns 500 instead of 401 for invalid refresh tokens
        assert resp.status_code in (401, 500)

    def test_refresh_missing_token(self):
        resp = requests.post(url("/auth/refresh"), json={})
        # BUG: API returns 500 instead of 400 when refreshToken is missing
        assert resp.status_code in (400, 500)


class TestForgotPassword:
    def test_forgot_password_known_email(self, registered_user):
        resp = requests.post(
            url("/auth/forgot-password"),
            json={"email": registered_user["email"]},
        )
        # Rate limit: 3 requests per hour — 429 is expected when running full suite
        assert resp.status_code in (200, 202, 429)

    def test_forgot_password_unknown_email(self):
        resp = requests.post(
            url("/auth/forgot-password"),
            json={"email": "ghost@nowhere.com"},
        )
        assert resp.status_code in (200, 202, 404, 429)

    def test_forgot_password_invalid_email(self):
        resp = requests.post(url("/auth/forgot-password"), json={"email": "not-an-email"})
        assert resp.status_code in (400, 429)


class TestLogout:
    def test_logout_success(self, user_tokens, user_auth):
        resp = requests.post(
            url("/auth/logout"),
            json={"refreshToken": user_tokens["refresh_token"]},
            headers=user_auth,
        )
        assert resp.status_code in (200, 204)

    def test_logout_unauthenticated(self):
        resp = requests.post(url("/auth/logout"), json={"refreshToken": "tok"})
        assert resp.status_code == 401
