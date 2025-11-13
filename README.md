# Confess Wall

A social web platform where students can post anonymous confessions, react, comment, and interact within their school community.

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+ (includes `npm`)
- MySQL Server 8+ (running on port 3307)

### Setup

1. **Install backend dependencies:**
   ```powershell
   py -3 -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   ```

2. **Configure database:**
   Create a `.env` file in the project root:
   ```ini
   DB_ENGINE=mysql
   DB_HOST=localhost
   DB_PORT=3307
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=confess_wall
   SECRET_KEY=your-secret-key-change-in-production
   ```

3. **Setup database:**
   ```powershell
   .\.venv\Scripts\python.exe backend\setup_db.py
   ```

4. **Install frontend dependencies:**
   ```powershell
   cd frontend
   npm install
   cd ..
   ```

### Run

**One Command (Recommended):**
```powershell
.\start.ps1
```

Or use the batch file:
```cmd
start.bat
```

This will start both backend and frontend automatically!

**Access:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Default Admin
- Email: `admin@confesswall.com`
- Password: `admin123`

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy, MySQL, JWT
- **Frontend:** React, React Router, Zustand, Tailwind CSS, Vite

## Project Structure

```
├── backend/          # FastAPI backend
│   ├── main.py       # Application entry
│   ├── models.py     # Database models
│   ├── routers/      # API routes
│   └── setup_db.py   # Database setup script
├── frontend/         # React frontend
│   └── src/          # Source files
└── requirements.txt  # Python dependencies
```
