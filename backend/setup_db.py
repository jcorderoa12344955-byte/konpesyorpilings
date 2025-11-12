"""
Setup database: Create database and initialize with sample data
Run this script once to set up your database
"""
import pymysql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "confess_wall")

# Check if .env file exists
if not os.path.exists(".env"):
    print("❌ Error: .env file not found!")
    print("\nPlease create a .env file (copy from .env.example)")
    exit(1)

print("=" * 60)
print("Database Setup")
print("=" * 60)
print()

# Step 1: Create database
print(f"Step 1: Creating database '{DB_NAME}'...")
try:
    connect_kwargs = {
        'host': DB_HOST,
        'port': DB_PORT,
        'user': DB_USER,
        'charset': 'utf8mb4'
    }
    
    if DB_PASSWORD:
        connect_kwargs['password'] = DB_PASSWORD
    
    connection = pymysql.connect(**connect_kwargs)
    with connection.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
    connection.close()
    print(f"✅ Database '{DB_NAME}' created or already exists.")
except pymysql.Error as e:
    error_code, error_msg = e.args
    print(f"❌ Error: ({error_code}) {error_msg}")
    print("\nPlease check your MySQL credentials in .env file")
    exit(1)

# Step 2: Create tables and initialize data
print("\nStep 2: Creating tables and initializing data...")
try:
    from backend.database import SessionLocal, engine, Base
    from backend.models import User, Campus, Tag, UserRole
    from backend.auth import get_password_hash

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")

    db = SessionLocal()

    # Create admin user
    admin_email = "admin@confesswall.com"
    admin_user = db.query(User).filter(User.email == admin_email).first()
    if not admin_user:
        admin_user = User(
            email=admin_email,
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN
        )
        db.add(admin_user)
        print(f"✅ Created admin user: {admin_email} / admin123")

    # Create sample campuses
    campuses_data = [
        {"name": "UP Diliman", "domain": "up.edu.ph", "description": "University of the Philippines Diliman"},
        {"name": "UST", "domain": "ust.edu.ph", "description": "University of Santo Tomas"},
        {"name": "DLSU", "domain": "dlsu.edu.ph", "description": "De La Salle University"},
        {"name": "Ateneo", "domain": "ateneo.edu", "description": "Ateneo de Manila University"},
    ]

    for campus_data in campuses_data:
        campus = db.query(Campus).filter(Campus.name == campus_data["name"]).first()
        if not campus:
            campus = Campus(**campus_data)
            db.add(campus)
            print(f"✅ Created campus: {campus_data['name']}")

    # Create sample tags
    tags_data = ["love", "rant", "crush", "confession", "advice", "support", "funny", "serious"]

    for tag_name in tags_data:
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if not tag:
            tag = Tag(name=tag_name, is_allowed=True)
            db.add(tag)
            print(f"✅ Created tag: #{tag_name}")

    db.commit()
    db.close()
    
    print("\n" + "=" * 60)
    print("✅ Database setup complete!")
    print("=" * 60)
    print("\nAdmin credentials:")
    print("Email: admin@confesswall.com")
    print("Password: admin123")
    print()

except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

