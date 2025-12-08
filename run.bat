@echo off
setlocal
echo ----------------------------------------
echo    HealthGuard AI - Validation System   
echo ----------------------------------------

:: 1. Backend Setup
echo [1/4] Setting up Backend...
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing Python dependencies...
pip install -r requirements.txt > nul 2>&1

:: 2. Frontend Setup
echo [2/4] Setting up Frontend...
cd frontend
if not exist node_modules (
    echo Installing Node dependencies...
    call npm install
)
cd ..

:: 3. Start Backend
echo [3/4] Starting Backend (Port 8000)...
start "Backend Server" cmd /k "venv\Scripts\activate.bat && uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload"

:: 4. Start Frontend
echo [4/4] Starting Frontend (Port 5173/3000)...
cd frontend
start "Frontend Dashboard" cmd /k "npm run dev"
cd ..

echo.
echo System is running!
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:5173 (check terminal for exact port)
echo.
pause
