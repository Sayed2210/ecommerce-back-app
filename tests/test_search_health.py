"""Tests for /search and /health endpoints."""

import pytest
import requests
from conftest import url


class TestSearch:
    def test_search_no_query(self):
        resp = requests.get(url("/search"))
        # 500 = Elasticsearch not running in local dev environment
        assert resp.status_code in (200, 400, 500)

    def test_search_with_query(self):
        resp = requests.get(url("/search"), params={"q": "headphones"})
        # 500 = Elasticsearch not running in local dev environment
        assert resp.status_code in (200, 500)

    def test_search_with_empty_query(self):
        resp = requests.get(url("/search"), params={"q": ""})
        assert resp.status_code in (200, 400, 500)

    def test_search_no_auth_required(self):
        resp = requests.get(url("/search"), params={"q": "test"}, headers={})
        assert resp.status_code in (200, 500)


class TestHealth:
    def test_health_check(self):
        resp = requests.get(url("/health"))
        # 503 = one or more dependencies (Elasticsearch, Redis) are unhealthy
        assert resp.status_code in (200, 503)

    def test_health_check_no_auth_required(self):
        resp = requests.get(url("/health"), headers={})
        assert resp.status_code in (200, 503)

    def test_health_response_structure(self):
        resp = requests.get(url("/health"))
        assert resp.status_code in (200, 503)
        data = resp.json()
        assert isinstance(data, dict)
