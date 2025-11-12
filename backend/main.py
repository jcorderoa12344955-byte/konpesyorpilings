from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import engine, Base
from backend.routers import confessions, reactions, comments, reports, admin, campuses, tags, auth, search
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create database tables (only if they don't exist)
# In production, use Alembic migrations instead
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables verified/created successfully")
except Exception as e:
    print(f"Warning: Could not create tables: {e}")
    print("Make sure MySQL database exists and credentials are correct")

app = FastAPI(title="Confess Wall API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(confessions.router, prefix="/api/confessions", tags=["confessions"])
app.include_router(reactions.router, prefix="/api/reactions", tags=["reactions"])
app.include_router(comments.router, prefix="/api/comments", tags=["comments"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(campuses.router, prefix="/api/campuses", tags=["campuses"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])
app.include_router(search.router, prefix="/api/search", tags=["search"])

@app.get("/")
def read_root():
    return {"message": "Confess Wall API"}

@app.get("/api/")
@app.get("/api")
def read_api_root():
    return {"message": "Confess Wall API", "status": "online"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

