#!/bin/bash

# Kill existing processes
pkill -f "uvicorn app.main:app"
pkill -f "vite"

echo "Starting Backend..."
cd backend
nohup uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "Starting Frontend..."
cd frontend
nohup npm run dev -- --host > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"

echo "Waiting for services to start..."
sleep 5

if ps -p $BACKEND_PID > /dev/null
then
   echo "Backend is running."
else
   echo "Backend failed to start. Check backend.log"
fi

if ps -p $FRONTEND_PID > /dev/null
then
   echo "Frontend is running."
else
   echo "Frontend failed to start. Check frontend.log"
fi
