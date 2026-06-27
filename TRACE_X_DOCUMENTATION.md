# TRACE-X: Advanced AML & Fraud Detection System

## 1. Architectural Overview
TRACE-X implements a **Polyglot Persistence** architecture to handle the distinct requirements of Anti-Money Laundering (AML) and financial fraud detection:

*   **PostgreSQL (System of Record)**: Stores immutable transaction ledgers, rich customer KYC demographics (`entities`, `accounts`), dynamic statistical aggregations (`account_stats`), and the complete Case Management system (`alerts`, `alert_evidence`).
*   **Neo4j (Topology Engine)**: A lightweight, highly sparse graph database optimized purely for multi-hop pattern matching. Volatile metrics (like balances and transaction counts) are intentionally kept off the graph to maximize traversal speed and minimize write-locks.

## 2. Machine Learning Engine (`fraud_detector.py`)
The AI/ML engine uses a multi-layered approach to evaluate risk:

*   **Layer 1: Fast Tabular Inference (XGBoost)**
    *   **Smurfing & Structuring Detection**: Evaluates 18 pre-computed features from PostgreSQL. Uses XGBoost to output a probability score of structuring behavior, backed by TreeSHAP for explainability.
    *   **Dormant Activation (Isolation Forest)**: Identifies accounts that have suddenly spiked in activity after long periods of dormancy.

*   **Layer 2: Complex Graph Traversals (Neo4j Cypher)**
    *   **Layering (Path Detection)**: Traces funds moving across 3 to 6 hops within short time windows (e.g., `< 7 days`) using rapid edge-filtering (`amount`, `txn_ts`).
    *   **Round-Tripping**: Detects cyclic money flows where funds leave an account, pass through multiple intermediate accounts, and return to the origin.
    *   **Coordinated Smurf Networks**: Identifies topologies where multiple independent "smurf" accounts funnel funds into a single destination account.

## 3. Implemented API Endpoints
All APIs have been refactored to query PostgreSQL for rich data and Neo4j for structural data.

### Data Endpoints (`/api/v1/data`)
*   `GET /accounts` & `GET /accounts/{account_id}`: Retrieves comprehensive account profiles, joining KYC entities and live transactional statistics.
*   `GET /transactions` & `GET /transactions/{txn_id}`: Fetches the immutable ledger of fund flows.

### Fraud Detection & Analytics Endpoints (`/api/v1/fraud`)
*   `GET /stats`: Powers the dashboard header cards, running fast aggregations across PostgreSQL (total volume) and Neo4j (total alerts).
*   `GET /score/{account_id}`: Executes the live ML pipelines (XGBoost & Isolation Forest) and merges the results with Neo4j graph trace findings to generate a unified risk score.
*   `GET /trace/{account_id}`: Extracts the specific graph subgraph surrounding an account for visual rendering.
*   `GET /report/{account_id}`: Bundles the score, SHAP explanations, and topological traces into a single comprehensive evidence package.

### Case Management & Compliance Endpoints (`/api/v1/fraud`)
*   `GET /alerts`: Dynamically queries the top 500 highest-risk candidates based on live database statistics (e.g., volume > 100k, dormancy > 90 days).
*   `GET /alerts/{alert_id}`: Retrieves a specific investigation case along with frozen evidence snapshots to prevent data-drift issues.
*   `PATCH /alerts/{alert_id}/status`: Allows investigators to update a case workflow (e.g., `OPEN` → `INVESTIGATING` → `CLOSED`).

### Simulation/Lab Endpoints
*   `POST /accounts` & `POST /transactions`: Allows live injection of new data into the system. These endpoints dual-write the rigid metadata securely to PostgreSQL while issuing sparse `MERGE` commands to Neo4j to update the graph topology instantly.

## 4. Testing & Seeding
*   **Database Seeder (`seed_dbs.py`)**: Automates the teardown and reconstruction of the Polyglot environment. It loads CSVs into PostgreSQL, computes baseline ML features, builds the case management schemas, and initializes the sparse Neo4j graph.
*   **API Tester UI (`test_endpoints.html`)**: A lightweight, standalone HTML application placed in the project root that provides a point-and-click interface to test all API routes against `localhost:8000` via the Fetch API.
