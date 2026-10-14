#!/usr/bin/env bash
set -e

# ColdTrace — All-in-One Startup Script
# Notice: Hackathon prototype — simulated data — not for clinical use.

echo "================================================================="
echo "  Starting ColdTrace — Intelligent Vaccine Cold-Chain System"
echo "================================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to kill child processes on exit
cleanup() {
  echo ""
  echo "Shutting down ColdTrace servers..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start Python FastAPI Backend
echo "-> Starting Backend API on http://localhost:8000..."
cd "$ROOT_DIR/backend"
if [ ! -d "venv" ]; then
  echo "Error: Python virtual environment not found in backend/venv."
  echo "Run: python3 -m venv backend/venv && backend/venv/bin/pip install -r backend/requirements.txt"
  exit 1
fi

./venv/bin/python run.py &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for Backend to initialize SQLite database and ML model..."
sleep 2

# 2. Start React + Vite Frontend
echo "-> Starting Frontend on http://localhost:3000..."
cd "$ROOT_DIR/frontend"
if [ ! -d "node_modules" ]; then
  echo "Error: node_modules not found in frontend/."
  echo "Run: cd frontend && npm install"
  exit 1
fi

npm run dev -- --host &
FRONTEND_PID=$!

echo ""
echo "================================================================="
echo "  ColdTrace is LIVE and Operational!"
echo "  - Frontend UI:       http://localhost:3000"
echo "  - Backend API:       http://localhost:8000"
echo "  - Interactive Docs:  http://localhost:8000/docs"
echo "  Press Ctrl+C to stop both servers."
echo "================================================================="

wait
