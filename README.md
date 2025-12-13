# HealthGuard AI Orchestrator

A multi-agent system for validating healthcare provider data, designed to automate compliance checks, detect fraud, and analyze business impact using AI agents.

## 🚀 Quick Start (Demo Mode)

The system is currently configured in **Demo Mode**, allowing you to explore the full dashboard capabilities with simulated data without needing external API keys.

### 1. Backend Setup
The backend handles orchestration and agent logic (FastAPI + LangGraph).

```bash
# Navigate to the project root
cd /path/to/project

# Install Python dependencies
pip install -r requirements.txt

# Start the Backend Server
python -m uvicorn backend.app.main:app --reload --port 8000
```
*The backend will be available at `http://localhost:8000`.*

### 2. Frontend Setup
The frontend provides the interactive dashboard (React + Vite).

```bash
# Navigate to the frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Frontend Server
npm run dev
```
*The frontend will be available at `http://localhost:3000`.*

---

## 🖥️ Using the Application

1.  Open your browser to `http://localhost:3000`.
2.  **Start Analysis**: Click the **"New Analysis"** button or upload any dummy file (e.g., a text file or PDF).
3.  **View Results**: The system will simulate a comprehensive analysis of 1,500+ provider records.
    *   **Dashboard**: View high-level ROI, Fraud Risk, and Compliance metrics.
    *   **Records Explorer**: Drill down into specific physician profiles to see "Agent Thoughts" and validation details.
    *   **Live Logs**: Watch the AI agents (Validation, Fraud, Business) communicate in real-time.

## 🏗️ Project Architecture

*   **Frontend**: React, TypeScript, Tailwind CSS, Vite.
*   **Backend**: FastAPI, Python 3.10+.
*   **AI Orchestration**: LangGraph (managing multi-agent workflows).
*   **Database/State**: In-memory state management (SQLite ready).

## ⚠️ Notes

*   **Demo Mode**: Currently, `frontend/services/apiService.ts` is configured to return mock data for demonstration purposes. To connect to the real live agents, you will need to revert the mock data changes in that file and ensure your backend agents have valid API keys (e.g., for NPI Registry or LLM providers).
