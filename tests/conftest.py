"""
Shared fixtures and configuration for the e-commerce API test suite.

Setup:
    pip install pytest requests pytest-order

Run all tests:
    pytest tests/ -v

Run a single module:
    pytest tests/test_auth.py -v

Environment variables (optional overrides):
    API_BASE_URL   - default: http://localhost:3000
    ADMIN_EMAIL    - default: admin@test.com
    ADMIN_PASSWORD - default: Admin@1234!
"""

import os
import uuid
import pytest
import requests

BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000")

# ─── credentials ────────────────────────────────────────────────────────────

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@Seed2024!")

# unique suffix keeps parallel runs from colliding
_RUN_ID = uuid.uuid4().hex[:8]
USER_EMAIL = f"testuser_{_RUN_ID}@test.com"
USER_PASSWORD = "TestUser@1234!"


# ─── helpers ────────────────────────────────────────────────────────────────

def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def url(path: str) -> str:
    return f"{BASE_URL}{path}"


# ─── session-scoped auth fixtures ───────────────────────────────────────────

@pytest.fixture(scope="session")
def registered_user() -> dict:
    """Register a fresh user once per test session and return credentials."""
    payload = {
        "email": USER_EMAIL,
        "password": USER_PASSWORD,
        "firstName": "Test",
        "lastName": "User",
    }
    resp = requests.post(url("/auth/register"), json=payload)
    assert resp.status_code in (200, 201), (
        f"Registration failed: {resp.status_code} {resp.text}"
    )
    return {"email": USER_EMAIL, "password": USER_PASSWORD}


def _extract_tokens(data: dict) -> dict:
    """
    Handle both response shapes:
      - Login:   { user: {...}, tokens: { accessToken, refreshToken } }
      - Refresh: { accessToken, refreshToken }
    """
    tokens = data.get("tokens", data)
    return {
        "access_token": tokens.get("accessToken") or tokens.get("access_token"),
        "refresh_token": tokens.get("refreshToken") or tokens.get("refresh_token"),
    }


@pytest.fixture(scope="session")
def user_tokens(registered_user) -> dict:
    """Login as the test user and return {access_token, refresh_token}."""
    resp = requests.post(
        url("/auth/login"),
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )
    assert resp.status_code == 200, f"User login failed: {resp.status_code} {resp.text}"
    return _extract_tokens(resp.json())


@pytest.fixture(scope="session")
def admin_tokens() -> dict:
    """Login as admin and return {access_token, refresh_token}."""
    resp = requests.post(
        url("/auth/login"),
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert resp.status_code == 200, (
        f"Admin login failed: {resp.status_code} {resp.text}\n"
        f"Make sure ADMIN_EMAIL / ADMIN_PASSWORD env vars are set correctly."
    )
    return _extract_tokens(resp.json())


@pytest.fixture(scope="session")
def user_auth(user_tokens) -> dict:
    return auth_header(user_tokens["access_token"])


@pytest.fixture(scope="session")
def admin_auth(admin_tokens) -> dict:
    return auth_header(admin_tokens["access_token"])
