"""Test tất cả API endpoints - trả về 200 OK."""
import sys, os, json, urllib.request, urllib.error
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'security-tests'))
from common import get, post

TOKEN = os.getenv("RICEGUARD_TOKEN", "")
BASE = os.getenv("RICEGUARD_URL", "http://localhost:5000")

def api(method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, ""
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:80]
    except Exception as e:
        return -1, str(e)

# Login first
if not TOKEN:
    status, body = post("/api/auth/login", {"username": "qa_screenshot_admin", "password": "QaTemp123!"})
    try:
        TOKEN = json.loads(body)["token"]
        os.environ["RICEGUARD_TOKEN"] = TOKEN
    except:
        pass

endpoints = [
    ("GET", "/api/health"),
    ("GET", "/api/auth/me"),
    ("GET", "/api/dashboard/stats"),
    ("GET", "/api/dashboard/alerts-timeline"),
    ("GET", "/api/dashboard/alerts-by-severity"),
    ("GET", "/api/dashboard/recent-alerts"),
    ("GET", "/api/dashboard/ai-summary"),
    ("GET", "/api/alerts"),
    ("GET", "/api/alerts/count"),
    ("GET", "/api/threats"),
    ("GET", "/api/threats/stats"),
    ("GET", "/api/logs"),
    ("GET", "/api/logs/stats"),
    ("GET", "/api/assets"),
    ("GET", "/api/assets/stats"),
    ("GET", "/api/visitors"),
    ("GET", "/api/visitors/stats"),
    ("GET", "/api/visitors/map"),
    ("GET", "/api/workflows"),
    ("GET", "/api/workflows/stats"),
    ("GET", "/api/stats/sidebar"),
    ("GET", "/api/system/status"),
    ("GET", "/api/system/activity"),
    ("GET", "/api/fields"),
    ("GET", "/api/investigations"),
    ("GET", "/api/investigations/stats"),
    ("GET", "/api/users"),
    ("GET", "/api/audit"),
    ("GET", "/api/notifications/mine"),
    ("GET", "/api/notifications/count"),
    ("GET", "/api/compliance"),
    ("GET", "/api/compliance/stats"),
    ("GET", "/api/playbooks"),
    ("GET", "/api/playbooks/stats"),
    ("GET", "/api/firewall/blocked"),
    ("GET", "/api/settings/security"),
    ("GET", "/api/satellite/summary"),
]

print(f"{'Method':6} {'Endpoint':45} {'Status'}")
print("-" * 65)
ok = 0; fail = 0
for method, path in endpoints:
    status, err = api(method, path)
    mark = "OK" if status == 200 else "FAIL"
    if status == 200: ok += 1
    else: fail += 1
    print(f"{method:6} {path:45} {status} {mark} {err[:40]}")

print(f"\nTotal: {len(endpoints)} | OK: {ok} | FAIL: {fail}")
