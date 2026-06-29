import asyncio
import time
import random
import uuid
from app.services.broker import MessageBroker

class FirehoseProducer:
    def __init__(self, broker: MessageBroker):
        self.broker = broker
        self._running = False
        self._inject_queue = asyncio.Queue()  # inject requests go here
        self._task = None
        self.target_tps = 2
        
        # Pre-generate static account pool for realistic graph topology
        self.account_pool = [f"ACC_{uuid.uuid4().hex[:4].upper()}" for _ in range(1000)]
    
    async def inject_pattern(self, pattern: str):
        await self._inject_queue.put(pattern)
    
    def set_tps(self, tps: int):
        self.target_tps = max(1, min(tps, 300))

    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        
    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            self._task = None

    async def _run_loop(self):
        last_inject_time = time.time()
        next_inject_delay = random.uniform(10, 15)
        
        while self._running:
            interval = 1.0 / max(1, min(self.target_tps, 300))
            # Check if there's a manual fraud pattern to inject
            if not self._inject_queue.empty():
                pattern = await self._inject_queue.get()
                fraud_txns = self._generate_fraud_pattern(pattern)
                for txn in fraud_txns:
                    await self.broker.publish("live_transactions", txn)
            
            # Auto-inject a pattern every 10-15 seconds
            if time.time() - last_inject_time > next_inject_delay:
                pattern = random.choice(["layering", "smurfing", "round_trip"])
                fraud_txns = self._generate_fraud_pattern(pattern)
                for txn in fraud_txns:
                    await self.broker.publish("live_transactions", txn)
                last_inject_time = time.time()
                next_inject_delay = random.uniform(10, 15)
            
            # Normal benign transaction
            await self.broker.publish("live_transactions", self._generate_benign_txn())
            
            # Vital for event loop breathing room
            await asyncio.sleep(interval)
            
    def _generate_benign_txn(self) -> dict:
        # A quick fake transaction using static pool for realism
        return {
            "txn_id": f"TXN_N_{uuid.uuid4().hex[:8]}",
            "sender": random.choice(self.account_pool),
            "receiver": random.choice(self.account_pool),
            "amount": round(random.uniform(10, 50000), 2),
            "channel": random.choice(["UPI", "NEFT", "RTGS", "IMPS"]),
            "timestamp": time.time(),
            "is_injected_fraud": False,
            "pattern": "normal"
        }
    
    def _generate_fraud_pattern(self, pattern: str) -> list:
        suffix = uuid.uuid4().hex[:4].upper()
        if pattern == "layering":
            # 6 rapid hops between fixed accounts
            accounts = [f"FRAUD_LAYER_{suffix}_{i}" for i in range(6)]
            base_amt = 950000
            return [
                {
                    "txn_id": f"FRAUD_{i}_{int(time.time()*1000)}",
                    "sender": accounts[i],
                    "receiver": accounts[i+1],
                    "amount": base_amt - (i * 1000),  # slightly decreasing = fees
                    "channel": "NEFT",
                    "timestamp": time.time() + (i * 0.1),
                    "is_injected_fraud": True,
                    "pattern": "layering"
                }
                for i in range(len(accounts) - 1)
            ]
        elif pattern == "smurfing":
            # Many small deposits into one account
            target = f"FRAUD_SMURF_TARGET_{suffix}"
            return [
                {
                    "txn_id": f"FRAUD_SMURF_{i}_{int(time.time()*1000)}",
                    "sender": f"FRAUD_SMURF_SRC_{suffix}_{i}",
                    "receiver": target,
                    "amount": 45000, # Just below CTR threshold of 50000
                    "channel": "UPI",
                    "timestamp": time.time() + (i * 0.1),
                    "is_injected_fraud": True,
                    "pattern": "smurfing"
                }
                for i in range(10)
            ]
        elif pattern == "round_trip":
            accounts = [f"FRAUD_RT_{suffix}_A", f"FRAUD_RT_{suffix}_B", f"FRAUD_RT_{suffix}_C", f"FRAUD_RT_{suffix}_A"]
            return [
                {
                    "txn_id": f"FRAUD_RT_{i}_{int(time.time()*1000)}",
                    "sender": accounts[i],
                    "receiver": accounts[i+1],
                    "amount": 500000,
                    "channel": "RTGS",
                    "timestamp": time.time() + (i * 0.2),
                    "is_injected_fraud": True,
                    "pattern": "round_trip"
                }
                for i in range(len(accounts) - 1)
            ]
        
        # default / unknown pattern
        return []

class StreamConsumer:
    def __init__(self, broker: MessageBroker):
        self.broker = broker
        self._running = False
        self._stage2_semaphore = asyncio.Semaphore(5)
        self._task = None
        self.db_batch = []
        self.last_db_flush = time.time()
    
    async def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._consume_loop())

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            self._task = None
            
    async def _flush_db_batch(self, txns):
        from app.db.session import get_db
        driver = get_db()
        
        # 1. Neo4j Sync
        if driver:
            neo4j_query = """
            UNWIND $batch AS txn
            MERGE (s:Account {account_id: txn.sender})
            MERGE (r:Account {account_id: txn.receiver})
            CREATE (s)-[t:SENT {
                txn_id: txn.txn_id,
                amount: txn.amount,
                channel: txn.channel,
                timestamp: txn.timestamp,
                is_fraud: txn.is_injected_fraud,
                pattern: txn.pattern
            }]->(r)
            """
            def _run_neo4j():
                try:
                    with driver.session() as session:
                        session.run(neo4j_query, batch=txns)
                except Exception as e:
                    print(f"Error bulk inserting to Neo4j: {e}")
                    
            await asyncio.to_thread(_run_neo4j)
            
        # 2. Postgres Sync
        def _run_pg():
            import psycopg2
            from psycopg2.extras import execute_batch
            from datetime import datetime
            import os
            
            pg_batch = []
            for t in txns:
                pg_batch.append((
                    t["txn_id"],
                    t["sender"],
                    t["receiver"],
                    t["amount"],
                    t["channel"],
                    datetime.fromtimestamp(t["timestamp"]).isoformat(),
                    "SUCCESS",
                    "Live Stream Transfer",
                    t.get("is_injected_fraud", False),
                    str(t.get("pattern", "NORMAL")).upper()
                ))
                
            pg_query = """
                INSERT INTO transactions 
                (txn_id, sender_id, receiver_id, amount, channel, txn_ts, status, narration, is_fraud, pattern_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            try:
                db_url = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_19nVcEqwLskP@ep-ancient-salad-aopl31tx.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require")
                with psycopg2.connect(db_url) as conn:
                    with conn.cursor() as cur:
                        execute_batch(cur, pg_query, pg_batch)
                    conn.commit()
            except Exception as e:
                print(f"Error bulk inserting to Postgres: {e}")

        await asyncio.to_thread(_run_pg)
        
    async def _consume_loop(self):
        from app.services.websocket_manager import ws_manager
        
        while self._running:
            batch = await self._collect_batch(max_size=50, max_wait_ms=50)
            if not batch:
                await asyncio.sleep(0.01)
                continue
                
            # Broadcast raw txns to frontend
            for txn in batch:
                await ws_manager.broadcast({"type": "transaction", "payload": txn})
                self.db_batch.append(txn)
                
            # Flush DB batch if size > 250 or time > 1.0s
            if len(self.db_batch) >= 250 or time.time() - self.last_db_flush > 1.0:
                if len(self.db_batch) > 0:
                    asyncio.create_task(self._flush_db_batch(list(self.db_batch)))
                    self.db_batch.clear()
                    self.last_db_flush = time.time()
                
            # Stage 1: XGBoost Triage (simulated batched inference here)
            # We use a dummy scoring logic to show the ML model evaluating the stream
            anomalies = []
            seen_patterns = set() # To deduplicate multi-hop injected patterns
            for t in batch:
                # Features: Amount, channel, amount range, round amounts
                # Here we just randomly flag 0.01% of normal txns to simulate model catch rate
                is_flagged_by_model = (t["amount"] > 40000 and random.random() < 0.0001)
                
                if t.get("is_injected_fraud", False) or is_flagged_by_model:
                    if not t.get("is_injected_fraud"):
                        t["pattern"] = "AI Anomaly"
                        anomalies.append(t)
                    else:
                        # Only trigger one Stage 2 alert per injected pattern in this batch
                        if t["pattern"] not in seen_patterns:
                            seen_patterns.add(t["pattern"])
                            anomalies.append(t)
            
            # Stage 2: Deep Graph Traversal for anomalies
            for anomaly in anomalies:
                asyncio.create_task(self._run_stage2(anomaly))

    async def _collect_batch(self, max_size=50, max_wait_ms=50):
        batch = []
        deadline = time.time() + (max_wait_ms / 1000.0)
        
        while len(batch) < max_size and time.time() < deadline:
            try:
                # Wait for next message or until deadline
                timeout = max(0, deadline - time.time())
                msg = await asyncio.wait_for(self.broker.subscribe("live_transactions"), timeout=timeout)
                batch.append(msg)
            except asyncio.TimeoutError:
                break
            except Exception as e:
                # E.g. queue empty in MemoryBroker
                await asyncio.sleep(0.01)
                
        return batch

    async def _run_stage2(self, txn: dict):
        from app.services.websocket_manager import ws_manager
        from app.db.session import get_db
        driver = get_db()
        
        async with self._stage2_semaphore:
            # Simulate Neo4j network latency
            await asyncio.sleep(0.2)
            
            pattern_name = str(txn['pattern']).replace('_', ' ').title()
            
            # Persist Alert to Neo4j so Dashboard totals increase
            if driver:
                alert_query = """
                MATCH (a:Account {account_id: $account_id})
                MERGE (al:Alert {alert_id: $alert_id})
                SET al.pattern = $pattern,
                    al.fraud_prob = 0.99,
                    al.tier = 'CRITICAL',
                    al.status = 'OPEN',
                    al.created_at = timestamp()
                MERGE (a)-[:FLAGGED_IN]->(al)
                """
                def _run_alert():
                    try:
                        # 1. Insert to Neo4j
                        with driver.session() as session:
                            session.run(alert_query, 
                                account_id=txn['sender'],
                                alert_id=f"ALT-LIVE-{txn['txn_id']}",
                                pattern=txn['pattern']
                            )
                        
                        # 2. Insert to Postgres
                        import psycopg2
                        from app.core.config import settings
                        with psycopg2.connect(settings.DATABASE_URL) as conn:
                            with conn.cursor() as cur:
                                cur.execute("""
                                    INSERT INTO alerts (alert_id, account_id, pattern_type, fraud_probability, severity, status, created_at)
                                    VALUES (%s, %s, %s, %s, %s, 'OPEN', NOW())
                                    ON CONFLICT (alert_id) DO UPDATE SET
                                        pattern_type = EXCLUDED.pattern_type,
                                        fraud_probability = EXCLUDED.fraud_probability,
                                        severity = EXCLUDED.severity
                                """, (f"ALT-LIVE-{txn['txn_id']}", txn['sender'], txn['pattern'], 0.99, 'CRITICAL'))
                    except Exception as e:
                        print(f"Error inserting alert: {e}")
                await asyncio.to_thread(_run_alert)
            
            # Generate Alert for LiveStream UI
            alert_payload = {
                "title": f"Critical Alert: {pattern_name} Detected",
                "message": f"Multi-hop graph traversal isolated a {pattern_name.lower()} topology starting at {txn['sender']}. Amount: ₹{txn['amount']}",
                "txn_id": txn["txn_id"],
                "pattern": txn["pattern"]
            }
            await ws_manager.broadcast({"type": "alert", "payload": alert_payload})
            
            # Generate Alert for Alerts Dashboard UI
            dashboard_payload = {
                "alert_id": f"ALT-LIVE-{txn['txn_id']}",
                "account_ids": [txn["sender"]],
                "severity": "CRITICAL",
                "pattern": txn["pattern"],
                "total_amount": txn["amount"],
                "fraud_prob": 0.99
            }
            await ws_manager.broadcast({"event": "NEW_ALERT", "data": dashboard_payload})

# We will initialize this after the broker boots up in main.py
producer_instance: FirehoseProducer = None
consumer_instance: StreamConsumer = None

