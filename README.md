# Confess Wall

A social web platform where students can post anonymous confessions, react, comment, and interact within their school community.

## Quick Start

### Prerequisites
- Python 3.8+
- MySQL Server
- Node.js 16+

### Setup

1. **Clone and setup environment:**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   ```

2. **Configure database:**
   - Create a `.env` file in the project root with:
     ```
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=your_mysql_password
     DB_NAME=confess_wall
     SECRET_KEY=your-secret-key-change-in-production
     ```

3. **Setup database:**
   ```bash
   python backend/setup_db.py
   ```

4. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Run

**Windows (PowerShell):**
```bash
.\run.ps1
```

**Manual:**
```bash
# Terminal 1 - Backend
.venv\Scripts\activate
python -m backend.main

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000
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
