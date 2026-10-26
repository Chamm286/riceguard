"""Giả lập SQL Injection vào các endpoint và webhook n8n."""
import sys, os, urllib.parse
sys.path.insert(0, os.path.dirname(__file__))
from common import *

banner("SQL Injection Test")

payloads = [
    "1' OR '1'='1",
    "1; DROP TABLE users;--",
    "' UNION SELECT username,password FROM users--",
    "admin'--",
    "1' AND 1=1--",
]

# 1. Qua backend WAF
print("\n[1] Backend WAF - /api/fields?search=...")
for p in payloads:
    status, body = get(f"/api/fields?search={urllib.parse.quote(p)}")
    print(f"  payload={p[:30]:32} -> HTTP {status}")

# 2. Qua n8n webhook SOC
print("\n[2] n8n webhook SOC - security-event")
for p in payloads:
    status, body = webhook("/webhook/security-event", {
        "ip": "192.168.40.101",
        "method": "GET",
        "path": f"/api/fields?search={p}",
        "user_agent": "sqlmap/1.7",
        "timestamp": time.time() if False else __import__("datetime").datetime.utcnow().isoformat(),
    })
    print(f"  payload={p[:30]:32} -> HTTP {status}")

import urllib.parse
