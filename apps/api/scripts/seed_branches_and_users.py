import os
import sys
import psycopg2
import random
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings
from app.core.security import get_password_hash
from neo4j import AsyncGraphDatabase

BRANCHES = [
    {"code": "SBIN0000001", "name": "SBI - Mumbai Headquarters", "city": "Mumbai"},
    {"code": "SBIN0000002", "name": "SBI - Delhi Regional Office", "city": "Delhi"},
    {"code": "SBIN0000003", "name": "SBI - Bangalore Tech Park", "city": "Bangalore"},
    {"code": "SBIN0000004", "name": "SBI - Hyderabad Cyber Hub", "city": "Hyderabad"},
    {"code": "SBIN0000005", "name": "SBI - Chennai Main Branch", "city": "Chennai"}
]

USERS = [
    {"username": "admin", "full_name": "System Admin", "role": "Admin", "branch_code": None},
    {"username": "bm_mumbai", "full_name": "Ramesh Kumar", "role": "Branch Manager", "branch_code": "SBIN0000001"},
    {"username": "inv_mumbai", "full_name": "Anita Desai", "role": "Investigator", "branch_code": "SBIN0000001"},
    {"username": "bm_delhi", "full_name": "Suresh Singh", "role": "Branch Manager", "branch_code": "SBIN0000002"},
    {"username": "inv_delhi", "full_name": "Vikram Patel", "role": "Investigator", "branch_code": "SBIN0000002"},
    {"username": "bm_blr", "full_name": "Priya Sharma", "role": "Branch Manager", "branch_code": "SBIN0000003"},
    {"username": "inv_blr", "full_name": "Kiran Reddy", "role": "Investigator", "branch_code": "SBIN0000003"},
]

async def seed():
    print("Connecting to DB...")
    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = True
    
    with conn.cursor() as cur:
        # Seed Branches
        print("Seeding Branches...")
        for b in BRANCHES:
            cur.execute("""
                INSERT INTO branches (branch_code, name, city)
                VALUES (%s, %s, %s)
                ON CONFLICT (branch_code) DO UPDATE 
                SET name = EXCLUDED.name, city = EXCLUDED.city
            """, (b["code"], b["name"], b["city"]))
            
        # Seed Users
        print("Seeding Users...")
        default_pwd = get_password_hash("password")
        for u in USERS:
            branch_id = None
            if u["branch_code"]:
                cur.execute("SELECT id FROM branches WHERE branch_code = %s", (u["branch_code"],))
                row = cur.fetchone()
                if row:
                    branch_id = row[0]
                    
            cur.execute("""
                INSERT INTO users (username, hashed_password, full_name, role, branch_id)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (username) DO UPDATE
                SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, branch_id = EXCLUDED.branch_id
            """, (u["username"], default_pwd, u["full_name"], u["role"], branch_id))
            
        # Update Accounts
        print("Fetching Accounts...")
        cur.execute("SELECT account_id FROM accounts")
        account_ids = [row[0] for row in cur.fetchall()]
        
        print(f"Assigning {len(account_ids)} accounts to branches randomly...")
        updates = []
        for acc_id in account_ids:
            b = random.choice(BRANCHES)
            updates.append((b["code"], b["name"], acc_id))
            
        from psycopg2.extras import execute_batch
        execute_batch(cur, """
            UPDATE accounts SET branch_code = %s, branch_name = %s WHERE account_id = %s
        """, updates, page_size=1000)
        
    conn.close()
    
    # Update Neo4j
    print("Updating Neo4j...")
    driver = AsyncGraphDatabase.driver(
        settings.NEO4J_URI,
        auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
    )
    async with driver.session() as session:
        for branch_code, branch_name, acc_id in updates:
            await session.run("""
                MATCH (a:Account {account_id: $acc_id})
                SET a.branch_code = $branch_code, a.branch_name = $branch_name
            """, acc_id=acc_id, branch_code=branch_code, branch_name=branch_name)
        
    await driver.close()
    print("Seed Complete!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed())
