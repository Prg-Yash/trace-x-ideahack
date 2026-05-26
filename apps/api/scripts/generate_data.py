import random
from datetime import datetime, timedelta
from faker import Faker
import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import get_db

fake = Faker()

# --- Configuration ---
NUM_ACCOUNTS = 100
NUM_TRANSACTIONS = 500
ALERT_RATIO = 0.05  # 5% of accounts will have an alert

def create_account(session):
    """Creates a single account with default metrics."""
    account_id = f"ACC_{fake.uuid4().hex[:12]}"
    entity_id = f"ENT_{fake.uuid4().hex[:8]}"
    
    query = """
    CREATE (a:Account {
        account_id: $account_id,
        entity_id: $entity_id,
        account_type: $account_type,
        kyc_tier: $kyc_tier,
        status: 'ACTIVE',
        opened_on: $opened_on,
        risk_category: $risk_category,
        txn_count_7d: 0,
        txn_count_30d: 0,
        volume_7d: 0.0,
        volume_30d: 0.0,
        avg_monthly_volume: 0.0,
        avg_monthly_count: 0.0,
        unique_counterparties_30d: 0,
        last_active_ts: null
    })
    RETURN a.account_id
    """
    result = session.run(query, {
        "account_id": account_id,
        "entity_id": entity_id,
        "account_type": random.choice(["SAVINGS", "CURRENT", "WALLET"]),
        "kyc_tier": random.randint(0, 2),
        "opened_on": fake.date_between(start_date="-5y", end_date="today"),
        "risk_category": random.choice(["LOW", "MEDIUM", "HIGH"])
    })
    return result.single()

def create_transaction(session, sender_id, receiver_id):
    """Creates a transaction and updates account metrics."""
    txn_ts = datetime.now() - timedelta(days=random.randint(0, 365))
    amount = round(random.uniform(100.0, 100000.0), 2)
    
    # Determine if the transaction is within the last 7 or 30 days
    is_in_7d = (datetime.now() - txn_ts).days <= 7
    is_in_30d = (datetime.now() - txn_ts).days <= 30

    query = """
    // Find sender and receiver
    MATCH (sender:Account {account_id: $sender_id})
    MATCH (receiver:Account {account_id: $receiver_id})

    // Create the transaction relationship
    CREATE (sender)-[r:TRANSFERRED_TO {
        txn_id: $txn_id,
        amount: $amount,
        channel: $channel,
        txn_ts: $txn_ts
    }]->(receiver)

    // Create the transaction node
    CREATE (t:Transaction {
        txn_id: $txn_id,
        sender_id: $sender_id,
        receiver_id: $receiver_id,
        amount: $amount,
        channel: $channel,
        txn_ts: $txn_ts,
        status: 'SUCCESS',
        narration: $narration
    })

    // Update sender and receiver metrics
    SET sender.last_active_ts = $txn_ts,
        receiver.last_active_ts = $txn_ts,
        sender.txn_count_30d = sender.txn_count_30d + (CASE WHEN $is_in_30d THEN 1 ELSE 0 END),
        sender.volume_30d = sender.volume_30d + (CASE WHEN $is_in_30d THEN $amount ELSE 0.0 END),
        sender.txn_count_7d = sender.txn_count_7d + (CASE WHEN $is_in_7d THEN 1 ELSE 0 END),
        sender.volume_7d = sender.volume_7d + (CASE WHEN $is_in_7d THEN $amount ELSE 0.0 END),
        receiver.txn_count_30d = receiver.txn_count_30d + (CASE WHEN $is_in_30d THEN 1 ELSE 0 END),
        receiver.volume_30d = receiver.volume_30d + (CASE WHEN $is_in_30d THEN $amount ELSE 0.0 END),
        receiver.txn_count_7d = receiver.txn_count_7d + (CASE WHEN $is_in_7d THEN 1 ELSE 0 END),
        receiver.volume_7d = receiver.volume_7d + (CASE WHEN $is_in_7d THEN $amount ELSE 0.0 END)
    """
    session.run(query, {
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "txn_id": f"TXN_{fake.uuid4().hex[:12]}",
        "amount": amount,
        "channel": random.choice(["UPI", "NEFT", "RTGS", "IMPS", "CASH"]),
        "txn_ts": txn_ts,
        "narration": fake.sentence(),
        "is_in_7d": is_in_7d,
        "is_in_30d": is_in_30d
    })

def create_alert(session, account_id):
    """Creates an alert and flags an account."""
    query = """
    MATCH (a:Account {account_id: $account_id})
    CREATE (al:Alert {
        alert_id: $alert_id,
        alert_ts: $alert_ts,
        model: $model,
        pattern: $pattern,
        fraud_prob: $fraud_prob,
        tier: $tier,
        total_amount: $total_amount,
        hop_depth: $hop_depth,
        time_window_hrs: $time_window_hrs,
        status: 'NEW'
    })
    CREATE (a)-[r:FLAGGED_IN {role: $role}]->(al)
    """
    session.run(query, {
        "account_id": account_id,
        "alert_id": f"ALT_{fake.uuid4().hex[:12]}",
        "alert_ts": datetime.now() - timedelta(hours=random.randint(1, 72)),
        "model": random.choice(["GNN", "LSTM", "ISOLATION_FOREST"]),
        "pattern": random.choice(["LAYERING", "SMURFING", "DORMANCY"]),
        "fraud_prob": round(random.uniform(0.6, 1.0), 2),
        "tier": random.choice(["WATCH", "ESCALATE", "CRITICAL"]),
        "total_amount": round(random.uniform(50000, 1000000), 2),
        "hop_depth": random.randint(2, 10),
        "time_window_hrs": random.randint(1, 24),
        "role": random.choice(["SOURCE", "INTERMEDIARY", "DESTINATION"])
    })

def main():
    driver = get_db()
    with driver.session() as session:
        # Clear existing data
        print("Clearing existing data...")
        session.run("MATCH (n) DETACH DELETE n")
        print("Cleared existing data.")

        # Create accounts
        print("Creating accounts...")
        account_ids = []
        for _ in range(NUM_ACCOUNTS):
            record = create_account(session)
            if record:
                account_ids.append(record[0])
        print(f"Created {len(account_ids)} accounts.")

        # Create transactions
        print("Creating transactions and updating account metrics...")
        for i in range(NUM_TRANSACTIONS):
            sender_id, receiver_id = random.sample(account_ids, 2)
            create_transaction(session, sender_id, receiver_id)
            if (i + 1) % 100 == 0:
                print(f"  ...created {i + 1}/{NUM_TRANSACTIONS} transactions.")
        print("Finished creating transactions.")

        # Create alerts
        print("Creating alerts...")
        num_alerts = int(NUM_ACCOUNTS * ALERT_RATIO)
        accounts_to_alert = random.sample(account_ids, num_alerts)
        for account_id in accounts_to_alert:
            create_alert(session, account_id)
        print(f"Created {num_alerts} alerts.")
        
        print("\nSynthetic data generation complete.")

    driver.close()

if __name__ == "__main__":
    main()

