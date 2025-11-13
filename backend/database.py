import os
from pathlib import Path
from typing import Any, Dict
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine.url import URL, make_url
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables from .env file
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_SQLITE_FILENAME = os.getenv("SQLITE_DB_PATH", "confess_wall.db")


def _build_sqlite_url() -> str:
    """Return a sqlite connection string and ensure the parent directory exists."""
    raw_path = Path(DEFAULT_SQLITE_FILENAME)
    sqlite_path = raw_path if raw_path.is_absolute() else BASE_DIR / raw_path
    if sqlite_path != Path(":memory:"):
        sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{sqlite_path.as_posix()}"


def _build_mysql_url() -> str:
    """Construct the MySQL connection string from environment variables."""
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "3307")
    db_user = os.getenv("DB_USER", "root")
    db_password = os.getenv("DB_PASSWORD", "")
    db_name = os.getenv("DB_NAME", "confess_wall")

    if db_password:
        encoded_password = quote_plus(db_password)
        return f"mysql+pymysql://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}?charset=utf8mb4"
    return f"mysql+pymysql://{db_user}@{db_host}:{db_port}/{db_name}?charset=utf8mb4"


def _determine_database_url() -> str:
    """Decide which database URL to use based on environment configuration."""
    explicit_url = os.getenv("DATABASE_URL")
    if explicit_url:
        return explicit_url

    db_engine = os.getenv("DB_ENGINE", "").strip().lower()

    mysql_env_overrides = any(
        key in os.environ
        for key in ("DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME")
    )

    if db_engine == "mysql" or (db_engine == "" and mysql_env_overrides):
        return _build_mysql_url()

    # Default to a local sqlite database for development convenience
    return _build_sqlite_url()


SQLALCHEMY_DATABASE_URL = _determine_database_url()
SQLALCHEMY_URL_OBJECT = make_url(SQLALCHEMY_DATABASE_URL)
DB_BACKEND = SQLALCHEMY_URL_OBJECT.get_backend_name()

engine_kwargs: Dict[str, Any] = {
    "pool_pre_ping": True,  # Verify connections before using them
    "pool_recycle": 3600,   # Recycle connections after 1 hour
    "echo": os.getenv("SQLALCHEMY_ECHO", "0").lower() in {"1", "true", "yes"},
}

if SQLALCHEMY_URL_OBJECT.drivername.startswith("sqlite"):
    # Ensure sqlite database path exists and adjust engine kwargs
    database_path = SQLALCHEMY_URL_OBJECT.database
    if database_path and database_path != ":memory:":
        sqlite_path = Path(database_path)
        if not sqlite_path.is_absolute():
            sqlite_path = (BASE_DIR / sqlite_path).resolve()
            SQLALCHEMY_DATABASE_URL = URL.create(
                drivername=SQLALCHEMY_URL_OBJECT.drivername,
                database=sqlite_path.as_posix(),
            ).render_as_string(hide_password=False)
            SQLALCHEMY_URL_OBJECT = make_url(SQLALCHEMY_DATABASE_URL)
        sqlite_path.parent.mkdir(parents=True, exist_ok=True)

    engine_kwargs["connect_args"] = {"check_same_thread": False}
    # SQLite does not benefit from pool recycle; remove to avoid warnings
    engine_kwargs.pop("pool_recycle", None)

# Create the SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


