import urllib.request
import urllib.error
import time

BASE_URL = "http://localhost:8000/api/v1"

# Sample IDs for testing endpoints
ACCOUNT_ID = "ACC_00000"
TXN_ID = "TXN_00000" # Or whatever arbitrary ID to avoid 500s on missing param, 404 is fine if the endpoint handles it.

endpoints = [
    ("GET", "/health"),
    ("GET", "/stats"),
    ("GET", f"/score/{ACCOUNT_ID}"),
    ("GET", "/alerts"),
    ("GET", "/alerts/quick"),
    ("GET", f"/trace/{ACCOUNT_ID}"),
    ("GET", "/feed"),
    ("GET", f"/report/{ACCOUNT_ID}"),
    ("GET", f"/explain/dormant/{ACCOUNT_ID}"),
    ("GET", f"/explain/smurfing/{ACCOUNT_ID}"),
    ("GET", f"/explain/kyc_mismatch/{ACCOUNT_ID}"),
    ("GET", f"/explain/{ACCOUNT_ID}"),
    ("GET", f"/narrative/{ACCOUNT_ID}"),
    ("GET", "/accounts"),
    ("GET", "/transactions"),
    ("GET", f"/accounts/{ACCOUNT_ID}"),
    # We'll skip transaction by ID because we don't have a reliable mock ID, 
    # but we can try an arbitrary one.
    ("GET", f"/transactions/TXN_00001"),
]

def run_tests():
    print("Starting API Endpoint Checks...\n")
    passed = 0
    failed = 0
    
    for method, path in endpoints:
        url = f"{BASE_URL}{path}"
        try:
            start = time.time()
            if method == "GET":
                try:
                    req = urllib.request.Request(url)
                    with urllib.request.urlopen(req, timeout=10) as response:
                        status_code = response.getcode()
                        body = response.read().decode('utf-8')
                except urllib.error.HTTPError as e:
                    status_code = e.code
                    body = str(e)
            else:
                continue
                
            duration_ms = int((time.time() - start) * 1000)
            
            if status_code in [200, 404]:
                print(f"[PASS] {method} {path} - {status_code} ({duration_ms}ms)")
                passed += 1
            else:
                print(f"[FAIL] {method} {path} - {status_code} ({duration_ms}ms)\n   Response: {body[:200]}")
                failed += 1
        except Exception as e:
            print(f"[ERROR] {method} {path} - {e}")
            failed += 1
            
    print(f"\nSummary: {passed} passed, {failed} failed.")

if __name__ == "__main__":
    run_tests()
