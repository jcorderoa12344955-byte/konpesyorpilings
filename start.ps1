# Unified startup script - Runs both backend and frontend
# Usage: .\start.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Confess Wall Application" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
$venvPython = ".\.venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    py -3 -m venv .venv
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    & $venvPython "-m" "pip" "install" "-r" "requirements.txt"
}

# Check if frontend dependencies are installed
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

# Check if database exists (optional check)
if (-not (Test-Path ".env")) {
    Write-Host "[WARNING] .env file not found. Using default SQLite database." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start backend in background job
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    & ".\.venv\Scripts\python.exe" "-m" "uvicorn" "backend.main:app" "--reload" "--host" "127.0.0.1" "--port" "8000"
}

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend (this will block)
Push-Location frontend
try {
    npm run dev
} finally {
    # Cleanup: Stop backend job when frontend stops
    Pop-Location
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "Servers stopped." -ForegroundColor Yellow
}

