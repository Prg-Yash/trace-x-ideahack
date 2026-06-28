"""
simulate_production_stream.py

This script simulates an enterprise banking environment where the fraud models 
(Pattern 4 & 5) are subjected to a high-throughput, asynchronous transaction stream.

In a real bank (e.g., using Apache Kafka + Apache Flink), events do not arrive sequentially; 
they arrive in massive concurrent bursts. This script uses Python's `asyncio` and `aiohttp` 
to simulate that burst load against the TRACE-X Fraud API, measuring critical production 
metrics like p95 latency, throughput (TPS), and alert rates.

DO NOT RUN this script on a weak machine during the live demo without adjusting the CONCURRENCY_LIMIT.
"""

import asyncio
import aiohttp
import time
import random
import statistics
import logging
from typing import List, Dict

# ── Configuration ────────────────────────────────────────────────────────────
API_URL = "http://localhost:8000/api/v1/score/{account_id}"
CONCURRENCY_LIMIT = 50   # How many simultaneous requests (simulating Flink workers)
TOTAL_EVENTS = 1000      # Total number of transaction events to simulate

# Configure enterprise-style logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [STREAM-WORKER] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# Sample account pool (mix of normal and potentially fraudulent seeded accounts)
ACCOUNT_POOL = [
    # Known Anomalous/Fraudulent Accounts
    "ACC_02005", "ACC_00464", "ACC_02179", "ACC_00067", "ACC_18768", 
    "ACC_00101", "ACC_00102", "ACC_00103", "ACC_00104", "ACC_00105",
    
    # Clean / Normal Baseline Accounts
    "ACC_00000", "ACC_00001", "ACC_00002", "ACC_00003", "ACC_00004", 
    "ACC_00005", "ACC_00006", "ACC_00007", "ACC_00008", "ACC_00009"
]

# ── Enterprise Metrics Tracker ────────────────────────────────────────────────
class MetricsTracker:
    def __init__(self):
        self.latencies: List[float] = []
        self.success_count = 0
        self.error_count = 0
        self.flagged_count = 0
        self.start_time = 0.0
        self.end_time = 0.0

    def start(self):
        self.start_time = time.time()

    def stop(self):
        self.end_time = time.time()

    def record(self, latency: float, is_flagged: bool, error: bool):
        if error:
            self.error_count += 1
        else:
            self.success_count += 1
            self.latencies.append(latency)
            if is_flagged:
                self.flagged_count += 1

    def print_report(self):
        total_time = self.end_time - self.start_time
        tps = self.success_count / total_time if total_time > 0 else 0
        
        if self.latencies:
            p50 = statistics.median(self.latencies) * 1000
            p95 = statistics.quantiles(self.latencies, n=20)[18] * 1000
            p99 = statistics.quantiles(self.latencies, n=100)[98] * 1000
        else:
            p50 = p95 = p99 = 0.0

        print("\n" + "="*50)
        print("🏦 ENTERPRISE STREAMING LOAD TEST RESULTS 🏦")
        print("="*50)
        print(f"Total Events Processed : {self.success_count + self.error_count}")
        print(f"Successful Evaluations : {self.success_count}")
        print(f"Failed Evaluations     : {self.error_count}")
        print(f"Accounts Flagged       : {self.flagged_count} ({(self.flagged_count/max(1, self.success_count))*100:.2f}%)")
        print("-" * 50)
        print(f"Total Time Taken       : {total_time:.2f} seconds")
        print(f"Throughput (TPS)       : {tps:.2f} transactions/sec")
        print("-" * 50)
        print("Latency Metrics:")
        print(f"  Median (p50)         : {p50:.2f} ms")
        print(f"  95th Percentile (p95): {p95:.2f} ms  <-- Critical Production SLA")
        print(f"  99th Percentile (p99): {p99:.2f} ms")
        print("="*50 + "\n")


# ── Asynchronous Worker Definition ───────────────────────────────────────────
async def score_account_event(session: aiohttp.ClientSession, account_id: str, tracker: MetricsTracker, semaphore: asyncio.Semaphore):
    """
    Simulates a single worker consuming a transaction event from a Kafka topic
    and calling the ML scoring service.
    """
    url = API_URL.format(account_id=account_id)
    
    async with semaphore:
        start_time = time.time()
        try:
            async with session.get(url, timeout=10.0) as response:
                latency = time.time() - start_time
                if response.status == 200:
                    data = await response.json()
                    is_flagged = data.get("is_flagged", False)
                    tracker.record(latency, is_flagged, error=False)
                else:
                    tracker.record(latency, False, error=True)
                    logger.warning(f"API Error {response.status} for {account_id}")
        except Exception as e:
            latency = time.time() - start_time
            tracker.record(latency, False, error=True)
            logger.error(f"Network error for {account_id}: {str(e)}")

# ── Main Event Loop ──────────────────────────────────────────────────────────
async def run_enterprise_simulation():
    logger.info(f"Initializing Kafka Stream Simulation... (Target Events: {TOTAL_EVENTS})")
    tracker = MetricsTracker()
    semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)
    
    # Generate the synthetic event stream (Randomly selecting accounts)
    event_stream = [random.choice(ACCOUNT_POOL) for _ in range(TOTAL_EVENTS)]
    
    tracker.start()
    
    # Use connection pooling to simulate enterprise microservice persistent connections
    connector = aiohttp.TCPConnector(limit=CONCURRENCY_LIMIT)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = []
        for account_id in event_stream:
            task = asyncio.create_task(score_account_event(session, account_id, tracker, semaphore))
            tasks.append(task)
            
        # Wait for all stream events to be processed
        await asyncio.gather(*tasks)
        
    tracker.stop()
    tracker.print_report()

if __name__ == "__main__":
    # Execute the asynchronous event loop
    asyncio.run(run_enterprise_simulation())
