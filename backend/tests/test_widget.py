"""Backend tests for the Retirement Countdown widget endpoints."""
import os
from datetime import datetime, timezone
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://retirement-countdown-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module", autouse=True)
def reset_widget(client):
    """Reset widget at start of test session so we start at 1025."""
    r = client.post(f"{API}/widget/reset", timeout=15)
    assert r.status_code == 200, f"Reset failed: {r.status_code} {r.text}"
    yield


# ---------- GET /api/widget ----------
class TestGetWidget:
    def test_get_widget_returns_default(self, client):
        r = client.get(f"{API}/widget", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == "default"
        assert data["shifts_remaining"] == 1025
        assert "target_date" in data and isinstance(data["target_date"], str)
        assert "updated_at" in data

    def test_target_date_approximately_correct(self, client):
        """target_date should be ~ 4y 10m 25d from now (within 1 day)."""
        r = client.get(f"{API}/widget", timeout=15)
        data = r.json()
        target = datetime.fromisoformat(data["target_date"])
        if target.tzinfo is None:
            target = target.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        diff_days = (target - now).days
        # 4y 10m 25d ~ 4*365 + 10*30 + 25 = 1785; with leap years a bit more (~1789)
        assert 1770 <= diff_days <= 1800, f"Expected ~1785 days, got {diff_days}"

    def test_target_date_persists_across_calls(self, client):
        r1 = client.get(f"{API}/widget", timeout=15).json()
        r2 = client.get(f"{API}/widget", timeout=15).json()
        assert r1["target_date"] == r2["target_date"], "target_date must not change between GETs"


# ---------- PUT /api/widget/shifts ----------
class TestUpdateShifts:
    def test_update_shifts_success_and_persists(self, client):
        r = client.put(f"{API}/widget/shifts", json={"shifts_remaining": 1000}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["shifts_remaining"] == 1000

        # Verify persistence
        r2 = client.get(f"{API}/widget", timeout=15)
        assert r2.json()["shifts_remaining"] == 1000

    def test_update_shifts_to_zero(self, client):
        r = client.put(f"{API}/widget/shifts", json={"shifts_remaining": 0}, timeout=15)
        assert r.status_code == 200
        assert r.json()["shifts_remaining"] == 0

    def test_update_shifts_negative_rejected(self, client):
        r = client.put(f"{API}/widget/shifts", json={"shifts_remaining": -1}, timeout=15)
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"

    def test_update_shifts_target_date_unchanged(self, client):
        before = client.get(f"{API}/widget", timeout=15).json()
        client.put(f"{API}/widget/shifts", json={"shifts_remaining": 500}, timeout=15)
        after = client.get(f"{API}/widget", timeout=15).json()
        assert before["target_date"] == after["target_date"]


# ---------- POST /api/widget/reset ----------
class TestResetWidget:
    def test_reset_sets_shifts_to_1025(self, client):
        # First mutate
        client.put(f"{API}/widget/shifts", json={"shifts_remaining": 42}, timeout=15)
        r = client.post(f"{API}/widget/reset", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["shifts_remaining"] == 1025

        # Verify GET also shows 1025
        r2 = client.get(f"{API}/widget", timeout=15)
        assert r2.json()["shifts_remaining"] == 1025

    def test_reset_creates_fresh_target_date(self, client):
        r = client.post(f"{API}/widget/reset", timeout=15)
        assert r.status_code == 200
        data = r.json()
        target = datetime.fromisoformat(data["target_date"])
        if target.tzinfo is None:
            target = target.replace(tzinfo=timezone.utc)
        diff_days = (target - datetime.now(timezone.utc)).days
        assert 1770 <= diff_days <= 1800


# ---------- Response cleanliness ----------
class TestResponseShape:
    def test_no_mongo_id_in_response(self, client):
        r = client.get(f"{API}/widget", timeout=15)
        assert "_id" not in r.json()
