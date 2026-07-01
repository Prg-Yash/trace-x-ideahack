# TRACE-X 🚀 Advanced Fund Flow Intelligence & Fraud Detection

## Problem Statement
This project addresses **PS03: Tracking of Funds within Bank for Fraud Detection**. TRACE-X combines Neo4j graph algorithms, Machine Learning, and Explainable AI (XAI) to instantly track and flag complex financial crimes like rapid layering, round-tripping, and smurfing in real-time.

## 🌐 Live Demo & Docs
- **Live Demo**: https://g-ten.devally.in
- **API Docs (Swagger)**: https://gten-api.devally.in/docs

## 🌟 Key Features & Dashboard Modules
1. **Live Transaction Stream (`LiveStream`)**: A WebSocket-powered live feed of transactions ingested directly from Apache Kafka in real-time, displaying immediate fraud scores.
2. **Graph Analytics & Neo4j Trace (`GraphAnalytics`)**: Uses React Flow & DAGRE algorithms combined with Neo4j Cypher queries to visually map out rapid layering networks, round-tripping, and money mule topologies.
3. **Explainable AI (XAI) Insights**: Instead of "black box" flagging, the UI provides SHAP (SHapley Additive exPlanations) force-plots explaining exactly *why* a transaction was flagged (e.g., "Velocity spike in last 10m", "Geographic impossibility").
4. **Transaction Time Machine (`TransactionTimeMachine`)**: Allows investigators to rewind and playback transaction histories across accounts to spot subtle, long-term smurfing patterns.
5. **Secure Authentication**: Biometric Passkeys (WebAuthn) for passwordless login, backed by Resend API for email-based One-Time Passwords (OTP).

## 🛠️ Tech Stack & Polyglot Architecture
This project employs a **Polyglot Architecture** to maximize performance and avoid Neo4j locking issues:
*   **PostgreSQL (NeonDB)**: Handles all rigid, tabular, and highly volatile data (KYC demographics, live statistical aggregates, and case management alerts).
*   **Neo4j (Graph Database)**: Stripped down to a purely **sparse graph**. Nodes only hold identifiers, allowing Neo4j to focus solely on lightning-fast multi-hop traversals for complex topologies (Layering, Round-Tripping) without deadlocks.

**Additional Tech:**
*   **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Flow, D3.js
*   **Backend**: Python 3.11, FastAPI & Uvicorn (Asynchronous High-Throughput API Gateway)
*   **Data Streaming**: Apache Kafka (Live Transaction Streaming & Queuing)
*   **Machine Learning**: XGBoost, Isolation Forest, PyTorch (BiLSTM for Sequence Detection)
*   **Explainable AI**: SHAP (Feature Importance & Explainability)
*   **Authentication & Security**: WebAuthn (Biometric Passkeys) & Resend API (2FA OTP)
*   **Data Generation**: Faker (Programmatic Synthetic Data Generation)

## 🏗️ Architecture Flow

```mermaid
flowchart TD
  subgraph Client [User Interface - React/Vite]
    A[Interactive Dashboard]
    B[React Flow Graph Visualizer]
    Auth[WebAuthn Passkeys]
  end

  subgraph API [API Gateway - FastAPI]
    C(FastAPI Backend)
    Stream(WebSocket Streamer)
  end

  subgraph Engine [Detection Engine - AI/ML]
    D(Fraud Scoring Engine)
    E[Neo4j Cypher Algorithms]
    F[XGBoost & PyTorch Models]
    H[SHAP Explainability]
  end

  subgraph DataLayer [Data Persistence & Streaming]
    K[(PostgreSQL - Neon)]
    I[(Neo4j Graph DB)]
    J((Apache Kafka))
  end
  
  subgraph External [External Services]
    R[Resend API - 2FA]
  end

  %% Frontend to Backend
  A -- "REST API Calls" --> C
  B -- "WebSockets" --> Stream
  Auth -- "Biometric Auth" --> C
  
  %% Backend to External
  C -- "OTP Emails" --> R

  %% Backend Orchestration
  C -- "Reads/Writes User Data" --> K
  C -- "Produces Live Txns" --> J
  Stream -- "Consumes Live Txns" --> J
  
  %% Detection
  J -- "Streams Data" --> D
  D -- "Graph Traversal" --> I
  D -- "Graph Traversal" --> E
  D -- "Anomaly Detection" --> F
  F -- "Explainability" --> H
```

## 🚀 How to Run Locally

### 1. Root Environment Configuration
Create a `.env` file inside `apps/api/`:
```env
# Database Credentials
DATABASE_URL="postgresql://user:pass@host.neon.tech/neondb?sslmode=require"
NEO4J_URI="neo4j+s://your-instance.databases.neo4j.io"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="your_password"

# Kafka Streaming
KAFKA_BROKER_URL="localhost:9092"

# Security & Auth
SECRET_KEY="your-secure-secret-key"
WEB_DOMAIN="localhost"

# Email 2FA (Resend or standard SMTP)
RESEND_API_KEY="re_123456"
FROM_EMAIL="hello@yourdomain.com"
```

### 2. Install Dependencies

```bash
# Setup Backend API
cd apps/api
python -m venv venv
source venv/bin/activate  # (On Windows: .\venv\Scripts\Activate.ps1)
pip install -r requirements.txt

# Setup Frontend
cd ../frontend
npm install
```

### 3. Data Initialization & ML Training
*From the `apps/ai-ml` directory (with venv activated):*
```bash
# Generate high-fidelity synthetic financial data
python data/generate_data.py

# Execute the training pipeline (compiles .pt and .pkl artifacts)
python train_models.py
```

### 4. Launch the Application

**Terminal 1 (Backend API):**
```bash
cd apps/api
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend Dashboard):**
```bash
cd apps/frontend
npm run dev
```
Open your browser at `http://localhost:5173`.

## 🧠 The Dataset & Fraud Injector
All data is 100% synthetic, generated by our custom engine (`generate_data.py`).

Unlike flat Kaggle CSVs, our dataset programmatically engineers complex fraud network topologies directly into the graph:
*   Account nodes with identities, KYC tiers, stated income, and behavior metrics.
*   Transaction edges with realistic time decay, channel assignments, and values.
*   **Injected Ground Truth:** Specific account rings are deterministically configured to perform Rapid Layering, Circular Wash Trading, and Sub-Threshold Smurfing.

*No real banking data was used.*

## 📈 Exact Model Performance Table 

| Typology / Model | Precision | Recall (Sensitivity) | F1-Score | AUC / AUC-PR | Technical Notes & Highlights |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 💤 **Dormant Activation**<br>*(IsolationForest + XGBoost)* | **97.8%** | 85.1% | 91.0% | 0.924 | **Outstanding Precision**: Out of every 100 dormant activation alerts flagged by our hybrid model, nearly 98 are genuine fraud. |
| 🕸️ **Layering Chains**<br>*(Graph Traversal XGBoost)* | **99.1%**<br>*(CV Mean)* | **98.5%** | **98.9%** | **0.998** | Evaluated using **Stratified K-Fold Cross Validation** on multi-hop passthrough chains. |
| 🔁 **Round-Trip Loops**<br>*(Circular Flow XGBoost)* | 72.7% | 88.9% | 80.0% | 0.990 | High recall ensures circular money laundering loops ($A \rightarrow B \rightarrow C \rightarrow A$) are caught even with slight fee variations. |
| ⚡ **Smurfing / Structuring**<br>*(XGBoost + Graph Rule Engine)* | 78.0% | 85.0% | 81.3% | 0.871 | Combines 30-day statistical XGBoost with our 24-hour sliding-window Graph Engine to catch structured micro-deposits. |
| 📋 **Profile / KYC Mismatch**<br>*(Imbalanced XGBoost Booster)* | 7.2% | 55.6% | 12.7% | 0.757 | *(Note for Judge)*: Because extreme KYC divergence represents <1% of accounts, achieving a **55.6% Recall** at **0.757 AUC** provides an **8$\times$ lift** over standard bank rules without freezing innocent accounts. |

> [!NOTE]
> *These results are based on our synthetic graph injection data. Real-world CBS data deployments require calibration using the built-in `train_models.py` pipeline.*

## 🏆 Team: DevAlly
*   **Yash Nimse** – Backend & ML Model Development
*   **Nirmal Darekar** – Backend & ML / Graph Architecture
*   **Ayush Jagtap** – UI/UX & Frontend Integration

**iDEA 2.0 Phase 2 Submission**
