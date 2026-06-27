# TRACE-X: Polyglot Architecture Migration Guide

This document explains the recent architectural refactoring of the TRACE-X backend. This was done to solve critical performance and locking issues in Neo4j by splitting our data storage across **PostgreSQL** and **Neo4j**.

## 1. Why We Migrated to a Polyglot Architecture

Previously, TRACE-X stored everything inside **Neo4j**, including volatile tabular metrics (e.g., `volume_30d`, `current_balance`, `txn_count_7d`). 

**The Problem**: Every time a transaction occurred, we had to update properties on the `Account` node in Neo4j. Because Neo4j locks the entire node during property updates, high-throughput transaction streams caused severe deadlocks and slowed down graph traversals.

**The Solution**: We adopted a **Polyglot Architecture**:
*   **PostgreSQL**: Handles all rigid, tabular, and highly volatile data (KYC demographics, live statistical aggregates, and case management tickets).
*   **Neo4j**: Has been stripped down to a purely **sparse graph**. Nodes only hold identifiers (and static metadata), and relationships track fund transfers. This allows Neo4j to focus solely on what it does best: lightning-fast multi-hop traversals (Layering, Round-Tripping).

---

## 2. What Changed in the Codebase?

### A. Database Seeding (`seed_dbs.py`)
*   **New Tables**: Added initialization for `alerts` and `alert_evidence` tables in PostgreSQL to support the Case Management workflow.
*   **Sparse Neo4j Graph**: Stripped out all dynamic metric assignments from the `CREATE (a:Account ...)` Cypher queries. The graph is now initialized without heavy properties.

### B. API Routing (`apps/api/app/routers/`)
*   **`data.py`**:
    *   `GET /accounts/{account_id}`: Now performs a SQL `JOIN` across `accounts`, `account_stats`, and `entities` in PostgreSQL to serve the rich dashboard profile.
    *   `GET /transactions/{txn_id}`: Now queries PostgreSQL directly.
*   **`fraud.py`**:
    *   `GET /stats`: Refactored to aggregate data instantly from PostgreSQL (`SUM(volume_30d)`) rather than running full-graph scans in Neo4j.
    *   Added Case Management Endpoints: `GET /alerts/{alert_id}` and `PATCH /alerts/{alert_id}/status` to manage investigations in PostgreSQL.

### C. Core Machine Learning Engine (`fraud_detector.py`)
*   **Candidate Generation (`build_alert_candidates()`)**:
    *   *Old*: Scanned the entire Neo4j database for high-risk nodes.
    *   *New*: Queries `account_stats` in PostgreSQL using `psycopg2`. This instantly returns dormant or high-volume accounts without touching the graph.
*   **System Stats (`get_system_stats()`)**:
    *   Replaced the old `get_neo4j_stats()`. Now runs highly optimized scalar subqueries in Postgres.
*   **Live Simulation Ingest (`upsert_account_record()`, `upsert_transaction_record()`)**:
    *   When injecting live test data, we now perform a **Dual-Write**.
    *   1. The tabular properties are written via `INSERT ... ON CONFLICT` into PostgreSQL.
    *   2. A lightweight `MERGE` query is sent to Neo4j to update the topological edge.
*   **Metric Recomputation (`_recompute_account_metrics()`)**:
    *   *Old*: Ran complex `OPTIONAL MATCH` timeline queries in Neo4j.
    *   *New*: Executes a direct `UPDATE account_stats ... WHERE ...` query in PostgreSQL based on trailing time intervals.

---

## 3. How to Use the New Setup

Because the database schema has changed drastically (new Case Management tables and stripped Neo4j nodes), you **must** re-seed your local environment before running the API.

**Step 1: Re-seed the Databases**
```bash
python seed_dbs.py
```
*(This will drop and recreate the Postgres tables and sync the sparse graph in Neo4j).* 

**Step 2: Start the Server**
```bash
cd apps/api
python -m uvicorn app.main:app --reload --port 8000
```

**Step 3: Test Everything**
You can use the newly created `test_endpoints.html` (in the project root) to fire API requests against the new Polyglot backend seamlessly.
