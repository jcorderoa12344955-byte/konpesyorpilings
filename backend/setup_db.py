"""
Setup database: Create database and initialize with sample data.
Run this script once to set up your database.
"""

import sys
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.engine.url import make_url

# Load environment variables early so backend.database sees them
load_dotenv()

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.auth import get_password_hash
from backend.database import (
    DB_BACKEND,
    Base,
    SQLALCHEMY_DATABASE_URL,
    SessionLocal,
    engine,
)
from backend.models import Campus, Tag, User, UserRole


def create_mysql_database(url) -> None:
    """Ensure the target MySQL database exists before creating tables."""
    try:
        import pymysql
    except ImportError as exc:  # pragma: no cover - defensive
        print("[ERROR] PyMySQL is required to set up a MySQL database.", file=sys.stderr)
        print("Please install dependencies with `pip install -r requirements.txt`.", file=sys.stderr)
        raise SystemExit(1) from exc

    print(f"Step 1: Creating database '{url.database}' on {url.host or 'localhost'}...")
    connect_kwargs = {
        "host": url.host or "localhost",
        "port": url.port or 3307,
        "user": url.username or "root",
        "charset": "utf8mb4",
    }
    if url.password:
        connect_kwargs["password"] = url.password

    try:
        connection = pymysql.connect(**connect_kwargs)
        with connection.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS `{url.database}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        connection.close()
        print(f"[OK] Database '{url.database}' is ready.")
    except pymysql.Error as exc:
        error_code, error_msg = exc.args
        print(f"[ERROR] ({error_code}) {error_msg}", file=sys.stderr)
        print("Please verify your MySQL credentials or server status.", file=sys.stderr)
        raise SystemExit(1) from exc


def bootstrap_data() -> None:
    """Create tables and seed initial application data."""
    print("\nStep 2: Creating tables and inserting seed data...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Tables created successfully!")

    db = SessionLocal()

    try:
        admin_email = "admin@confesswall.com"
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            admin_user = User(
                email=admin_email,
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
            )
            db.add(admin_user)
            print(f"[OK] Created admin user: {admin_email} / admin123")

        campuses_data = [
            {"name": "UP Diliman", "domain": "up.edu.ph", "description": "University of the Philippines Diliman"},
            {"name": "UST", "domain": "ust.edu.ph", "description": "University of Santo Tomas"},
            {"name": "DLSU", "domain": "dlsu.edu.ph", "description": "De La Salle University"},
            {"name": "Ateneo", "domain": "ateneo.edu", "description": "Ateneo de Manila University"},
        ]

        for campus_data in campuses_data:
            campus = db.query(Campus).filter(Campus.name == campus_data["name"]).first()
            if not campus:
                db.add(Campus(**campus_data))
                print(f"[OK] Created campus: {campus_data['name']}")

        tags_data = ["love", "rant", "crush", "confession", "advice", "support", "funny", "serious"]
        for tag_name in tags_data:
            tag = db.query(Tag).filter(Tag.name == tag_name).first()
            if not tag:
                db.add(Tag(name=tag_name, is_allowed=True))
                print(f"[OK] Created tag: #{tag_name}")

        db.commit()
    finally:
        db.close()

    print("\n" + "=" * 60)
    print("[OK] Database setup complete!")
    print("=" * 60)
    print("\nAdmin credentials:")
    print("Email: admin@confesswall.com")
    print("Password: admin123")
    print()


def main() -> None:
    print("=" * 60)
    print("Database Setup")
    print("=" * 60)
    print()

    url = make_url(SQLALCHEMY_DATABASE_URL)

    if DB_BACKEND == "sqlite":
        database_path = url.database or ":memory:"
        display_path = database_path
        if database_path not in (None, ":memory:"):
            sqlite_path = Path(database_path)
            if not sqlite_path.is_absolute():
                sqlite_path = (Path.cwd() / sqlite_path).resolve()
            display_path = sqlite_path
        print(f"Using SQLite database at: {display_path}")
    elif DB_BACKEND == "mysql":
        create_mysql_database(url)
    else:
        print(f"[WARNING] Database backend '{DB_BACKEND}' is not explicitly supported by this setup script.")
        print("Continuing with table creation only.")

    bootstrap_data()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nSetup cancelled by user.")
