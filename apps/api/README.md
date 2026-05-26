# G-TEN Platform API

This directory contains the backend for the G-TEN platform, built with FastAPI.

## Development Setup

### Prerequisites

- Python 3.9+
- An active Neo4j instance (AuraDB or local)

### Installation

1.  **Create a virtual environment:**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

2.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure environment variables:**

    Create a `.env` file in the `apps/api` directory and add the following, replacing the placeholder values with your Neo4j credentials:

    ```env
    NEO4J_URI="bolt://localhost:7687"
    NEO4J_USER="neo4j"
    NEO4J_PASSWORD="your_password"
    ```

### Running the Application

To start the FastAPI server, run the following command from the `apps/api` directory:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`, and the interactive documentation can be accessed at `http://127.0.0.1:8000/docs`.

## Project Structure

-   `app/`: Main application folder.
    -   `api/`: API endpoint definitions (routers).
    -   `core/`: Application configuration and settings.
    -   `db/`: Database connection and session management.
    -   `models/`: Pydantic models for data validation and schema definition.
    -   `services/`: Business logic and interaction with the database.
    -   `utils/`: Utility functions.
-   `main.py`: FastAPI application entry point.
-   `requirements.txt`: Python dependencies.
-   `scripts/`: Standalone scripts (e.g., for data generation).
