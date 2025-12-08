#!/bin/bash

# Function to kill processes on script exit
cleanup() {
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
}

trap cleanup EXIT

echo "----------------------------------------"
echo "   HealthGuard AI - Validation System   "
echo "----------------------------------------"

# 1. Start Backend in Background
echo "[1/2] Starting FastAPI Backend on port 8000..."
source .venv/bin/activate 2>/dev/null || true
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 &
PAGE_PID=$!

# 2. Start Frontend (User Provided)
echo "[2/2] Starting Frontend..."
cd frontend
# Uses Vite (Port 3000 likely)
npm run dev -- --host &

# Wait for processes
wait
