# Simple script to run the website

Write-Host "Starting Confess Wall..." -ForegroundColor Green
Write-Host ""

# Check virtual environment
if (-not (Test-Path ".venv\Scripts\Activate.ps1")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    .\.venv\Scripts\Activate.ps1
    pip install -r requirements.txt
}

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "Please create a .env file with your MySQL credentials (see README.md)" -ForegroundColor Yellow
    exit 1
}

# Check frontend dependencies
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    cd frontend
    npm install
    cd ..
}

Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

# Start backend
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    .\.venv\Scripts\python.exe -m backend.main
}

Start-Sleep -Seconds 2

# Start frontend
cd frontend
npm run dev

# Cleanup
Stop-Job $backendJob -ErrorAction SilentlyContinue
Remove-Job $backendJob -ErrorAction SilentlyContinue

