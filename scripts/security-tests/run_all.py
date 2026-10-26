"""Chạy tất cả security tests."""
import subprocess, sys, os

base = os.path.dirname(__file__)
scripts = [
    "01_sql_injection.py",
    "02_xss.py",
    "03_brute_force.py",
    "04_port_scan.py",
    "05_ddos_light.py",
    "06_verify_ip.py",
]
for s in scripts:
    print(f"\n{'#' * 70}")
    print(f"  RUNNING: {s}")
    print(f"{'#' * 70}")
    subprocess.run([sys.executable, os.path.join(base, s)], check=False)
