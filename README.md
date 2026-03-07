# VERA — Validation & Enrichment for Reliable Access

**Data Validation & Management System for Healthcare Payers**

VERA is a cutting-edge multi-agent system designed to automate the validation of healthcare provider data. It leverages AI agents to perform complex checks, detect fraud patterns, and analyze business impact, ensuring data integrity and operational efficiency for healthcare payers.

---

## 🌟 Highlights

*   **Multi-Agent Orchestration**: Powered by LangGraph, coordinating specialized agents (Validation, Fraud, Business, Graphical).
*   **Real-Time Dashboard**: Interactive React-based UI for live monitoring of validation workflows.
*   **Geographic Risk Heatmap**: Visualizes provider risk distribution across states using interactive Treemaps.
*   **Fraud Detection**: automated analysis of provider records for suspicious patterns and billing anomalies.
*   **ROI Analysis**: Instant calculation of potential savings and business impact.
*   **Modular Architecture**: Clean separation of concerns with a robust FastAPI backend and modern React frontend.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS, Lucide Icons
*   **Visualization**: Recharts (Charts, Treemaps)

### Backend
*   **API Framework**: FastAPI
*   **Language**: Python 3.10+
*   **Orchestration**: LangGraph, LangChain
*   **Data Processing**: Pandas, Scikit-learn
*   **Server**: Uvicorn

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Data-validation-management-for-healthcare-payers
```

### 2. Backend Setup
Set up the Python environment and start the API server.

```bash
# Navigate to project root
cd .

# Create and activate virtual environment (optional but recommended)
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file and add required variables
touch backend/.env
# Add the following to backend/.env:
# GROQ_API_KEY="your_groq_key"
# SMTP_SERVER="smtp.gmail.com"
# SMTP_PORT="587"
# SMTP_USER="your_email@gmail.com"
# SMTP_PASSWORD="your_app_password"  # Note: Must use an App Password, not regular login

# Start the Backend Server (runs on http://127.0.0.1:8000)
python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
Set up the React application.

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Development Server (runs on http://localhost:5173)
npm run dev
```

---

## 🎮 Usage Guide

1.  **Launch**: Ensure both Backend and Frontend servers are running.
2.  **Access**: Open your browser and go to the frontend URL (usually `http://localhost:5173`).
3.  **Demo Mode**:
    *   Click the **"Load Demo Data"** button in the sidebar.
    *   Watch the AI Orchestrator simulate the validation of 100 provider records.
    *   Explore the **Dashboard**, **Risk Heatmap**, and **Drill-down Data**.
4.  **Real Ingestion (Experimental)**:
    *   Click "Start Orchestration" and upload a file (PDF/CSV).
    *   The system will attempt to parse and validate the file using the connected agents.

---

## 📂 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── agents/         # Modular AI Agents (Validation, Fraud, etc.)
│   │   ├── main.py         # FastAPI Entry Point
│   │   ├── models.py       # Pydantic Data Models
│   │   └── graph.py        # LangGraph Workflow Definition
│   └── requirements.txt    # Python Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # React UI Components
│   │   ├── services/       # API Integration
│   │   └── types.ts        # TypeScript Interfaces
│   ├── App.tsx             # Main App Component
│   └── index.html          # Entry Point
└── README.md               # Project Documentation
```

---

## ⚠️ Notes
*   **Demo Mode Endpoint**: The `/demo-data` endpoint creates synthetic data for demonstration, ensuring the UI can be fully tested without sensitive real-world data.
*   **Agent Logic**: The current iteration focuses on the orchestration flow and UI integration. Some downstream agents use logic stubs for stable demonstration performance.
Goodluck!