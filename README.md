# Provider Data Validation & Predictive Management System
### EY Techathon 6.0 - Team Kasukabe Defence Group


A dynamic multi-agent AI system designed to automate healthcare provider data validation, detect fraud, and predict data degradation. This solution addresses the critical $17B+ problem of inaccurate provider directories.

## 🚀 Key Features

*   **Multi-Agent Orchestration**: Specialized agents for Validation, Prediction, and Document parsing working in parallel.
*   **Real-time Validation**: Cross-references 15+ mock data sources (NPI Registry, OIG, State Boards).
*   **Predictive Analytics**: Machine Learning heuristics to predict when provider data will become "stale" or inaccurate.
*   **Document Intelligence**: Extracts text from uploaded PDFs/Images using OCR.
*   **Premium Dashboard**: Glassmorphism-styled UI for real-time monitoring and "Wow" factor demos.

## 🛠️ Tech Stack

*   **Backend**: Python, FastAPI, Uvicorn
*   **AI/ML**: Scikit-learn, Sentence-Transformers (PyTorch), FAISS, OpenAI Whisper
*   **Frontend**: HTML5, Vanilla CSS (Glassmorphism), JavaScript, Chart.js
*   **Tools**: PDFPlumber, Pytesseract, FileType

## 📂 Project Structure

```
├── backend/
│   ├── agents/          # Validation, Predictive, and Document Agents
│   ├── main.py          # FastAPI Orchestrator Entrypoint
│   ├── tool.py          # File parsing utilities
│   └── utils.py         # Helper functions
├── frontend/
│   ├── index.html       # Main Dashboard UI
│   ├── style.css        # Premium CSS Styles
│   └── app.js           # Frontend Logic & Charts
├── requirements.txt     # Python Dependencies
└── verify.py            # API Verification Script
```

## ⚡ Getting Started

### Prerequisites

*   Python 3.8+
*   Tesseract OCR (optional, for image text extraction)

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/provider-data-validation.git
    cd provider-data-validation
    ```

2.  **Set up Virtual Environment**
    ```bash
    python -m venv venv
    .\venv\Scripts\activate  # Windows
    # source venv/bin/activate  # Mac/Linux
    ```

3.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

### Running the Application

1.  **Start the Backend Server**
    ```bash
    uvicorn backend.main:app --reload
    ```
    *Note: The first run may take a few minutes to download necessary AI models.*

2.  **Access the Dashboard**
    Open your browser and navigate to: `http://127.0.0.1:8000`

## 🧪 Demo Scenarios

*   **Valid Provider**: Enter NPI `1234567890`.
*   **Fraud Detection**: Enter NPI ending in `00` (Simulates registry mismatch).
*   **Address Check**: Enter address containing "Fake St".
*   **Degradation Risk**: Update the "Last Updated" date to be >90 days ago.

## 👥 Team
*   **Kasukabe Defence Group**
