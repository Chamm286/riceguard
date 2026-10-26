"""Giả lập Cross-Site Scripting."""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(__file__))
from common import *

banner("XSS Test")

payloads = [
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(document.cookie)",
    "<svg onload=alert(1)>",
]

print("\n[1] Backend WAF - /api/logs?search=...")
for p in payloads:
    status, body = get(f"/api/logs?search={p}")
    print(f"  payload={p[:30]:32} -> HTTP {status}")

print("\n[2] n8n webhook SOC - security-event")
for p in payloads:
    status, body = webhook("/webhook/security-event", {
        "ip": "192.168.40.102",
        "method": "GET",
        "path": f"/api/logs?search={p}",
        "user_agent": "Mozilla/5.0",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    })
    print(f"  payload={p[:30]:32} -> HTTP {status}")
