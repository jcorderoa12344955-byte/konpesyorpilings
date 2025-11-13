@echo off
echo ========================================
echo   Starting Confess Wall Application
echo ========================================
echo.

REM Check if virtual environment exists
if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment...
    py -3 -m venv .venv
    echo Installing backend dependencies...
    .venv\Scripts\python.exe -m pip install -r requirements.txt
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo Starting servers...
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start backend in background
start "Backend Server" cmd /k ".venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000"

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Start frontend (blocking)
cd frontend
call npm run dev

