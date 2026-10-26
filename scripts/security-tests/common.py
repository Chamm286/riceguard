import json, os, sys, time, urllib.request, urllib.error

BASE = os.getenv("RICEGUARD_URL", "http://localhost:5000")
N8N = os.getenv("N8N_URL", "http://localhost:5678")
TOKEN = os.getenv("RICEGUARD_TOKEN", "")

def post(path, payload, headers=None, base=BASE):
    data = json.dumps(payload).encode()
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    if TOKEN and "Authorization" not in h:
        h["Authorization"] = f"Bearer {TOKEN}"
    req = urllib.request.Request(base + path, data=data, method="POST", headers=h)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return -1, str(e)

def get(path, base=BASE, headers=None):
    h = {}
    if headers:
        h.update(headers)
    if TOKEN and "Authorization" not in h:
        h["Authorization"] = f"Bearer {TOKEN}"
    req = urllib.request.Request(base + path, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return -1, str(e)

def webhook(path, payload):
    return post(path, payload, base=N8N)

def banner(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)
