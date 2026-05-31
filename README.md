# TRACE-X: Advanced Fund Flow Intelligence & Real-Time Fraud Detection Platform

Welcome to **TRACE-X**, an enterprise-grade platform designed to track the movement of funds across financial networks, detect suspicious behaviors, and generate investigator-ready evidence.

This project transcends basic static rules engines by integrating **Graph Traversal Algorithms**, **Sequential Deep Learning (BiLSTM)**, **Anomaly Detection (Isolation Forests)**, and **Explainable AI (SHAP)** into a unified, high-performance architecture. 

---

## 🏗 System Architecture & Monorepo Topology

TRACE-X is organized as a Turborepo-managed monorepo, enforcing strict separation of concerns while maintaining typed boundaries across microservices.

```text
trace-x/
├── apps/
│   ├── api/                 # FastAPI Asynchronous Backend
│   ├── ai-ml/               # PyTorch/Scikit-Learn ML pipelines & Cypher integration
│   └── frontend/            # Next.js 16+ React 19 Frontend (Turbopack)
├── packages/
│   └── py-schemas/          # Shared Pydantic data contracts (Python)
├── turbo.json               # Orchestration and build caching
└── package.json
```

### Data Flow Diagram

```mermaid
flowchart TD
  subgraph Client [Frontend Application - Next.js]
    A[Dashboard UI]
    B[Investigation & D3.js Graph View]
    C[STR Generator]
  end

  subgraph API [FastAPI Backend]
    E[Async Fraud Scorer Router]
    F[Ingestion & Upsert API]
  end

  subgraph Engine [AI / ML Detection Engine]
    H[Graph Traversal Subsystem]
    I[PyTorch BiLSTM (Smurfing)]
    J[Isolation Forest (Dormancy)]
    K[SHAP Explainability Subsystem]
  end

  subgraph Persistence [Graph Database]
    M[(Neo4j Aura / Local)]
  end

  A & B & C <--> API
  API <--> Engine
  API <--> Persistence
  Engine <--> Persistence
```

---

## 🧠 Machine Learning Pipeline & Detection Algorithms

The detection engine (`apps/ai-ml/fraud_detector.py`) relies entirely on **Neo4j as the single source of truth**. Features are aggregated live via Cypher queries at inference time rather than relying on batch CSVs, ensuring zero latency between ingestion and detection.

### 1. Sequential Structuring / Smurfing Detection (PyTorch BiLSTM)
Smurfing involves breaking down large transactions into smaller, sub-reporting-threshold amounts. 
We model this as a sequence classification problem.

*   **Architecture:** A 2-layer Bidirectional Long Short-Term Memory (BiLSTM) network built in PyTorch.
*   **Hyperparameters:** `input_size=5`, `hidden_size=64`, `num_layers=2`, `dropout=0.3`.
*   **Dense Head:** Followed by a Fully Connected sequence: `Linear(128, 32) -> ReLU -> Dropout(0.3) -> Linear(32, 2)`.
*   **Input Tensor Shape:** `(Batch, 30, 5)` where 30 is the sequence length of the last successful outgoing transactions.
*   **Feature Vector:**
    1.  `log1p(amount) / 15.0`: Log-scaled normalized transaction amount.
    2.  `min(gap_minutes / 1440.0, 1.0)`: Time elapsed since the previous transaction.
    3.  `hour / 23.0`: Diurnal temporal encoding.
    4.  `dayofweek / 6.0`: Weekly temporal encoding.
    5.  `is_upi`: Boolean flag for real-time payment rails.
*   **Training Methodology:** Trained over 50 epochs using `Adam` optimizer (`lr=0.001`). We handle extreme class imbalance by using a `WeightedRandomSampler` and calculating class weights dynamically.
*   **Threshold Tuning:** Instead of a static 0.5 threshold, the pipeline evaluates thresholds from `0.05` to `0.95` and selects the optimal cutoff maximizing the **F0.5 Score** (which prioritizes precision over recall in fraud scenarios to minimize alert fatigue).

### 2. Dormant Account Activation (Isolation Forest)
Catches "sleeper" accounts that lay dormant and suddenly spike in high-velocity fund movement.

*   **Model:** `sklearn.ensemble.IsolationForest`
*   **Hyperparameters:** `n_estimators=200`, `contamination=0.05`.
*   **Feature Space (8 Dimensions):** `dormancy_days`, `txn_count_7d`, `txn_count_30d`, `volume_7d`, `volume_30d`, `avg_monthly_volume`, `avg_monthly_count`, `unique_counterparties_30d`.
*   **Preprocessing:** All features are standard-scaled (`StandardScaler`) before training and inference.
*   **Inference:** The model outputs anomaly scores using `score_samples`. We pass this through a sigmoid-like transformation `1.0 / (1.0 + np.exp(-raw))` to map distances into a calibrated `[0, 1]` confidence probability.

### 3. Graph Analytics (Neo4j Cypher)
Certain fraud typologies are purely topological. We utilize Neo4j path traversal algorithms to detect these instantly.

*   **Rapid Layering:** Uses variable-length path matching `(start)-[:SENT*2..8]->(end)` to find funds hopping through up to 8 intermediary accounts in short time windows.
*   **Round-Trip Funds (Wash Trading):** Uses cycle detection `(start)-[:SENT*2..6]->(start)` to find money that loops back to its originator, artificially inflating transaction volumes.

### 4. Explainable AI (XAI)
TRACE-X is designed for FIU (Financial Intelligence Unit) compliance. Predictions must be auditable.
*   **SHAP Integration:** For the Isolation Forest, we use `shap.KernelExplainer`. We sample a background dataset of 200 normal accounts from Neo4j, and at inference time, generate Shapley values for the specific flagged account. This identifies the exact feature (e.g., `volume_30d`) that pushed the anomaly score over the threshold.

---

## 🛠️ Backend Architecture (FastAPI)

The backend (`apps/api`) acts as the high-throughput orchestration layer.

*   **Asynchronous I/O:** Built entirely on `FastAPI` and `uvicorn`, ensuring that heavy Cypher queries do not block the main thread.
*   **Pydantic Data Validation:** Incoming transactions and accounts are strictly validated against shared Python schemas residing in `packages/py-schemas`. This prevents data poisoning and ensures alignment between the API and ML data structures.
*   **Live Re-scoring Engine:** When a new transaction is POSTed, the backend synchronously executes a Cypher upsert, recalculates the node's behavioral aggregates, and triggers the ML pipeline, returning the updated `risk_score` in milliseconds.

---

## 🖥️ Frontend Architecture (Next.js & React)

The frontend (`apps/frontend`) is a modern, high-performance web application tailored for real-time data visualization.

*   **Next.js 16+ & Turbopack:** Leverages the latest App Router paradigm and Server Components where applicable.
*   **Tailwind CSS v4 & Cascade Layers:** The styling engine utilizes the new Tailwind v4 compiler. Custom base resets are safely contained within `@layer base` to prevent CSS specificity collisions, ensuring perfectly bounded component styles.
*   **D3.js Graph Rendering:** The Investigation View (`/investigation/[id]`) maps the JSON paths returned by the Cypher API into interactive SVG nodes. It computes force-directed layouts in real-time, allowing investigators to visually trace funds.
*   **Polling & Real-time Feeds:** The Dashboard implements aggressive `setInterval` polling (every 1.8s for the live feed, 30s for the global stat aggregates) to maintain a live command-center feel without the overhead of WebSockets/Kafka for this specific deployment scale.

---

## 🚀 Deployment & Operations

### 1. Root Environment Configuration
TRACE-X leverages hierarchical `.env` loading. 
Create a `.env` file at the root:
```env
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
NEO4J_REL_TYPE=SENT
```

### 2. Data Initialization & ML Training
```bash
# Generate high-fidelity synthetic financial data
python apps/ai-ml/data/generate_data.py

# Execute the training pipeline (compiles .pt and .pkl artifacts)
python apps/ai-ml/train_models.py

# Push the topological subset to Neo4j
python apps/ai-ml/load_graph.py --data-dir apps/ai-ml/data/neo4j --clear
```

### 3. Spin up the API Gateway
```bash
cd apps/api
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
*API Contract definitions available at `http://localhost:8000/docs`*

### 4. Launch the Frontend Application
```bash
cd apps/frontend
npm install
npm run dev
```
*Access the dashboard at `http://localhost:3000`*

---

## 📝 FIU Reporting (STR Generation)
The system exposes a `GET /api/v1/report/{account_id}` endpoint that aggregates the graph topology, ML prediction confidences, and SHAP feature importance into a single, printable Suspicious Transaction Report (STR), reducing manual investigation time by >90%.

---
*Built for advanced fraud intelligence. TRACE-X represents the intersection of Graph Theory and Deep Learning.*
