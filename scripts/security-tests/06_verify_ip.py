"""Kiểm tra IP thật được ghi nhận (không phải localhost)."""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(__file__))
from common import *

banner("Verify Real IP Capture")

# Gửi 1 event với IP giả lập hacker
status, body = webhook("/webhook/security-event", {
    "ip": "203.0.113.77",
    "method": "GET",
    "path": "/api/fields?search=1' OR '1'='1",
    "user_agent": "sqlmap/1.7",
    "timestamp": datetime.datetime.utcnow().isoformat(),
})
print(f"  webhook response: HTTP {status}")

# Kiểm tra DB
print("\n  Kiểm tra DB alerts (cần chạy từ backend):")
print("  SELECT id, ip_address, title FROM alerts ORDER BY id DESC LIMIT 3;")
