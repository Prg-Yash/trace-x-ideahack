import pytest
import httpx
import time

API_BASE_URL = "http://127.0.0.1:8000/api/v1"

# We'll use a known account ID format from the synthetic generator.
# Note: If this account doesn't exist in Neo4j during the test, it may return a fallback or 404.
# Ensure the backend is running with seeded data before executing this.
TEST_ACCOUNT_ID = "ACC_05042"

@pytest.mark.asyncio
async def test_fraud_score_endpoint_latency_and_format():
    """
    E2E Test to verify the OCI Cloud VM runtime + Neo4j AsyncGraphDatabase performance.
    Hits the /fraud/score endpoint to measure latency and validate payload schema.
    """
    async with httpx.AsyncClient() as client:
        start_time = time.time()
        response = await client.get(f"{API_BASE_URL}/score/{TEST_ACCOUNT_ID}")
        end_time = time.time()
        
        rtt_ms = (end_time - start_time) * 1000.0
        print(f"\nRTT Latency: {rtt_ms:.2f} ms")
        
        assert response.status_code == 200, f"Failed to fetch score, status {response.status_code}"
        data = response.json()
        
        # Assert schema
        assert "account_id" in data
        assert "combined_score" in data
        assert "risk_level" in data
        assert "flagged_for" in data
        assert "detections" in data
        
        # Assert Latency (Allowing some overhead for localhost networking vs OCI)
        # In a local/Windows environment, cold DB connections may take a few seconds.
        assert rtt_ms < 10000.0, f"Latency SLA breach! RTT was {rtt_ms:.2f}ms. Ensure AsyncGraphDatabase is optimized."
        
@pytest.mark.asyncio
async def test_fraud_report_endpoint():
    """
    E2E Test to verify the unified evidence report generation.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{API_BASE_URL}/report/{TEST_ACCOUNT_ID}")
        assert response.status_code == 200, f"Failed to fetch report, status {response.status_code}"
        data = response.json()
        
        assert "score" in data
        assert "traces" in data
        assert "explanations" in data
