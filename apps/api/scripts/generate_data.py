import random
from datetime import datetime, timedelta
from faker import Faker
import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.session import get_db

fake = Faker()

# Configuration
NUM_ACCOUNTS = 100
NUM_TRANSACTIONS = 500

def create_account(session):
    account_id = f"ACC_{fake.uuid4()[:8]}"
    entity_id = f"ENT_{fake.uuid4()[:8]}"
    account_type = random.choice(["SAVINGS", "CURRENT", "WALLET"])
    kyc_tier = random.randint(0, 2)
    status = "ACTIVE"
    opened_on = fake.date_between(start_date="-5y", end_date="today")
    risk_category = random.choice(["LOW", "MEDIUM", "HIGH"])

    query = """
    CREATE (a:Account {
        account_id: $account_id,
        entity_id: $entity_id,
        account_type: $account_type,
        kyc_tier: $kyc_tier,
        status: $status,
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
        "account_id": account_id, "entity_id": entity_id, "account_type": account_type,
        "kyc_tier": kyc_tier, "status": status, "opened_on": opened_on,
        "risk_category": risk_category
    })
    return result.single()

def create_transaction(session, sender_id, receiver_id):
    txn_id = f"TXN_{fake.uuid4()[:8]}"
    amount = round(random.uniform(100.0, 100000.0), 2)
    channel = random.choice(["UPI", "NEFT", "RTGS", "IMPS", "CASH"])
    txn_ts = datetime.now() - timedelta(days=random.randint(0, 365))
    status = "SUCCESS"
    narration = fake.sentence()

    query = """
    MATCH (sender:Account {account_id: $sender_id})
    MATCH (receiver:Account {account_id: $receiver_id})
    CREATE (sender)-[r:TRANSFERRED_TO {
        txn_id: $txn_id,
        amount: $amount,
        channel: $channel,
        txn_ts: $txn_ts
    }]->(receiver)
    CREATE (t:Transaction {
        txn_id: $txn_id,
        sender_id: $sender_id,
        receiver_id: $receiver_id,
        amount: $amount,
        channel: $channel,
        txn_ts: $txn_ts,
        status: $status,
        narration: $narration
    })
    """
    session.run(query, {
        "sender_id": sender_id, "receiver_id": receiver_id, "txn_id": txn_id,
        "amount": amount, "channel": channel, "txn_ts": txn_ts, "status": status,
        "narration": narration
    })

def main():
    driver = get_db()
    with driver.session() as session:
        # Clear existing data
        session.run("MATCH (n) DETACH DELETE n")
        print("Cleared existing data.")

        # Create accounts
        account_ids = []
        for _ in range(NUM_ACCOUNTS):
            record = create_account(session)
            if record:
                account_ids.append(record[0])
        print(f"Created {len(account_ids)} accounts.")

        # Create transactions
        for i in range(NUM_TRANSACTIONS):
            sender_id, receiver_id = random.sample(account_ids, 2)
            create_transaction(session, sender_id, receiver_id)
            if (i + 1) % 100 == 0:
                print(f"Created {i + 1}/{NUM_TRANSACTIONS} transactions.")
        
        print("Synthetic data generation complete.")

    driver.close()

if __name__ == "__main__":
    main()

