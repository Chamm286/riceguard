"""Giả lập SSH Brute Force - gửi nhiều login thất bại."""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(__file__))
from common import *

banner("SSH Brute Force Test")

users = ["admin", "root", "admin123", "test", "user"]
passwords = ["123456", "password", "admin", "root", "qwerty"]

print("\n[1] Backend login endpoint - 20 lần thất bại")
for i in range(20):
    u = users[i % len(users)]
    pw = passwords[i % len(passwords)]
    status, body = post("/api/auth/login", {"username": u, "password": pw})
    print(f"  attempt {i+1:2}: user={u:10} -> HTTP {status}")

print("\n[2] n8n webhook SOC - brute force pattern")
for i in range(10):
    status, body = webhook("/webhook/security-event", {
        "ip": "192.168.40.103",
        "method": "POST",
        "path": "/api/auth/login",
        "user_agent": "Hydra/9.4",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "username": users[i % len(users)],
    })
    print(f"  attempt {i+1:2} -> HTTP {status}")
