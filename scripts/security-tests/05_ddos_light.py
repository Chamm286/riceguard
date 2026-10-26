"""Giả lập DDoS nhẹ - nhiều request liên tiếp."""
import sys, os, datetime, concurrent.futures
sys.path.insert(0, os.path.dirname(__file__))
from common import *

banner("DDoS Light Test")

def hit(i):
    status, body = get("/api/health")
    return status

print("\n[1] 50 concurrent GET /api/health")
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as ex:
    results = list(ex.map(hit, range(50)))
from collections import Counter
print("  results:", Counter(results))

print("\n[2] n8n webhook - 30 rapid events")
def hit_webhook(i):
    status, body = webhook("/webhook/security-event", {
        "ip": "192.168.40.105",
        "method": "GET",
        "path": "/",
        "user_agent": "DDoS-bot",
        "timestamp": datetime.datetime.utcnow().isoformat(),
    })
    return status

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
    results = list(ex.map(hit_webhook, range(30)))
print("  results:", Counter(results))
