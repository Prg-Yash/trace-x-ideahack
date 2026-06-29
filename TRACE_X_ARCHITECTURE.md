# Trace-X: Advanced Anti-Money Laundering (AML) & Fraud Detection Engine

Trace-X is a production-ready, highly optimized AI/ML backend designed to detect complex financial crimes in real-time. Moving beyond traditional rule-based systems, Trace-X utilizes a dual-database architecture (Polyglot Persistence) and a multi-model ensemble to identify sophisticated laundering typologies like Smurfing, Layering, Round-Tripping, and KYC Mismatches.

---

## 1. System Architecture & Polyglot Persistence

To handle the immense scale and complexity of modern financial transactions, Trace-X splits its data across two specialized databases, ensuring optimal performance for both tabular machine learning and deep graph traversals.

*   **PostgreSQL (NeonDB)**: Acts as the primary relational store. It holds the `accounts`, `entities`, `account_stats`, and `account_ml_features` tables. This ensures lightning-fast mega-joins for fetching numerical and categorical features needed by the XGBoost and Isolation Forest models.
*   **Neo4j (Graph Database)**: Dedicated exclusively to modeling money movement. It stores `Account` nodes and `[:SENT]` relationships representing transactions. This allows us to execute complex Cypher queries to detect multi-hop layering chains and cyclic round-trip topologies that traditional relational databases cannot compute efficiently.

### The Data Pipeline (`seed_dbs.py`)
Our backend includes a massive data-seeding pipeline that:
1. Ingests raw CSV data (accounts, entities, transactions).
2. Automatically engineers dozens of complex ML features (e.g., `smurf_volume_ratio`, `income_utilization_ratio_30d`, `dormancy_days`).
3. Safely partitions the data.
4. Performs a bulk push of over 100,000 transactions into Neo4j and PostgreSQL simultaneously, establishing a synchronized single source of truth for the live APIs.

---

## 2. The Machine Learning Ensemble

Trace-X does not rely on a single monolithic model. Instead, it deploys a suite of specialized, state-of-the-art machine learning models, each tuned to detect a specific financial crime typology. All models strictly adhere to an **80/20 train/test split** to completely eliminate data leakage and ensure reliable real-world accuracy.

### 1. Structuring & Smurfing (XGBoost)
*   **The Threat:** Criminals breaking down large illicit transfers into multiple smaller transactions to evade regulatory reporting thresholds.
*   **The Model:** A highly tuned XGBoost Classifier trained on velocity and ratio metrics. 
*   **Key Features:** `rapid_small_txns`, `smurf_volume_ratio`, `avg_txn_size_30d`. 
*   **Execution:** Runs entirely on tabular data from Postgres. It uses a calibrated operational threshold (0.50) to instantly flag structuring behaviors with extreme precision.

### 2. KYC Mismatch (XGBoost)
*   **The Threat:** Accounts moving volumes of money that drastically exceed their declared demographic or income profiles (e.g., a student moving millions).
*   **The Model:** XGBoost Classifier.
*   **Key Features:** `declared_annual_income`, `volume_30d`, `age`, `geography_tier`, and derived One-Hot Encoded variables (e.g., `account_type_INDIVIDUAL`).
*   **Execution:** Calculates the `mismatch_ratio` (actual vs. expected monthly volume) and returns a dynamic severity level (NORMAL, MEDIUM, HIGH, CRITICAL) based on the model's confidence scores.

### 3. Dormant Activation (Isolation Forest)
*   **The Threat:** "Sleeper" accounts that remain inactive for months or years to build tenure, which suddenly awaken to move massive volumes of illicit funds.
*   **The Model:** Isolation Forest (Unsupervised Anomaly Detection).
*   **Key Features:** `dormancy_days`, `volume_30d`, `last_active_ts`.
*   **Execution:** The Isolation Forest isolates outliers in the multi-dimensional space. If an account with `dormancy_days > 180` suddenly spikes in `volume_30d`, the model immediately assigns an anomaly score (-1) and flags it.

### 4. Layering (Neo4j Graph Traversal)
*   **The Threat:** Moving funds through a long, complex chain of intermediary accounts to obfuscate the original source of the money.
*   **The Model:** Live Neo4j Cypher Algorithms.
*   **Execution:** Detects paths of length 3 to 6 where the majority of funds received are immediately forwarded (high pass-through ratio). 

### 5. Round-Trip / Cyclic Fraud (Neo4j Graph Cycles)
*   **The Threat:** Money leaving an origin account, passing through multiple shells, and returning to the exact same origin account (A -> B -> C -> A) to simulate legitimate business revenue.
*   **The Model:** Live Neo4j Cycle Detection.
*   **Execution:** Instantly traverses the graph to find closed loops and validates the timestamps to ensure chronological flow.

---

## 3. The Production FastAPI Backend

The bridge between the ML engine and the frontend is a blazing-fast, asynchronous Python FastAPI server (`apps/api`). It exposes a suite of optimized endpoints designed to feed the Next.js frontend dashboards.

### Core Endpoints Built:
*   **`GET /api/v1/score/{account_id}`**: The powerhouse endpoint. It executes a live mega-join in PostgreSQL to fetch the account's ML features, instantly runs the data through the XGBoost and Isolation Forest models in memory, and returns a detailed JSON response containing the confidence scores and risk levels for all 5 fraud typologies.
*   **`GET /api/v1/trace/{account_id}`**: Interacts directly with Neo4j. It returns the exact node-and-edge chain for Layering or Round-Trip fraud, pre-formatted for consumption by React graph visualization libraries (like `react-force-graph` or `vis.js`).
*   **`GET /api/v1/alerts/quick`**: Instantly fetches pre-calculated alert nodes from Neo4j to instantly populate the main investigator dashboard tables without the latency of running live inference on every row.
*   **`GET /api/v1/stats`**: Aggregates total transaction volumes, active alerts, and critical counts from PostgreSQL to feed the frontend KPI metric cards.
*   **`GET /api/v1/feed`**: Returns a real-time stream of the most recent transactions.

### Key Backend Optimizations implemented:
1.  **Lazy Driver Initialization:** The Neo4j `AsyncGraphDatabase.driver` is lazily initialized on-demand to guarantee bulletproof stability against event-loop collisions, ensuring it survives heavy parallel API testing and production traffic loads.
2.  **In-Memory Model Caching:** The serialized XGBoost (`.json`), Isolation Forest (`.pkl`), and StandardScaler objects are loaded into RAM exactly once at startup, ensuring scoring inferences take less than 10 milliseconds.
3.  **SQL Mega-Joins:** Instead of running 4 separate queries, the API utilizes a highly optimized `LEFT JOIN` across `accounts`, `account_stats`, `entities`, and `account_ml_features` to fetch the complete feature vector in a single database round-trip.

---

## Conclusion
Trace-X is no longer a prototype—it is a fully engineered, production-ready anti-fraud backend. The ML models are rigorously trained and tested, the data is properly seeded in a polyglot architecture, and the asynchronous API is completely verified and ready to power the investigator UI.
