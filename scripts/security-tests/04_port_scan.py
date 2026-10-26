"""Giả lập Port Scan."""
import sys, os, datetime
sys.path.insert(0, os.path.dirname(__file__))
from common import *

banner("Port Scan Test")

ports = [22, 80, 443, 3306, 5432, 6379, 8080, 8443, 27017, 5678]

print("\n[1] Backend WAF - port scan paths")
for port in ports:
    status, body = get(f"/api/ping?port={port}")
    print(f"  port={port:5} -> HTTP {status}")

print("\n[2] n8n webhook SOC - port scan pattern")
for port in ports:
    status, body = webhook("/webhook/security-event", {
        "ip": "192.168.40.104",
        "method": "GET",
        "path": f"/?port={port}",
        "user_agent": "Nmap/7.94",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "scan_type": "port_scan",
    })
    print(f"  port={port:5} -> HTTP {status}")
