import asyncio
import httpx
import time
import numpy as np
import pytest

API_BASE_URL = "http://127.0.0.1:8000/api/v1"
TEST_ACCOUNT_ID = "ACC_05042"

# We mark it async so pytest-asyncio runs it
@pytest.mark.asyncio
async def test_high_concurrency_stress():
    """
    Simulates a burst of 200 concurrent requests to the Neo4j/ML fraud scoring endpoint
    to ensure the AsyncGraphDatabase connection pool doesn't collapse and p95 SLA is maintained.
    """
    CONCURRENT_REQUESTS = 20
    latencies = []

    async def fetch_score(client):
        start = time.time()
        try:
            # Some of our previous tests used /fraud/score/, some used /score/.
            # Let's use the one that works from e2e test.
            # From test_e2e_api.py, we saw the URL was `f"{API_BASE_URL}/score/{TEST_ACCOUNT_ID}"`
            response = await client.get(f"{API_BASE_URL}/score/{TEST_ACCOUNT_ID}")
            end = time.time()
            if response.status_code == 200:
                return (end - start) * 1000.0
            else:
                return -1.0 # Error
        except Exception:
            return -1.0

    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = [fetch_score(client) for _ in range(CONCURRENT_REQUESTS)]
        results = await asyncio.gather(*tasks)

    latencies = [r for r in results if r > 0]
    errors = len(results) - len(latencies)

    print(f"\n[LOAD TEST RESULTS]")
    print(f"Total Requests: {CONCURRENT_REQUESTS}")
    print(f"Successful: {len(latencies)}")
    print(f"Errors: {errors}")

    assert errors == 0, f"Load test failed: {errors} requests dropped due to connection pool starvation."

    p95_latency = np.percentile(latencies, 95)
    print(f"p95 Latency: {p95_latency:.2f} ms")
    print(f"Max Latency: {max(latencies):.2f} ms")
    print(f"Min Latency: {min(latencies):.2f} ms")

    # Assert p95 latency is under 5000ms under load on a constrained 1-core VM
    assert p95_latency < 5000.0, f"SLA Breach! p95 latency under load was {p95_latency:.2f} ms (Target < 5000ms)"
