import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database configuration
# Supports hosted PostgreSQL via DATABASE_URL or persistent SQLite
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.strip():
    db_url = DATABASE_URL.strip()
    # Normalize legacy postgres:// scheme to postgresql:// for SQLAlchemy 1.4+ / 2.0+
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    if db_url.startswith("sqlite"):
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
    else:
        # Hosted PostgreSQL (Render, Supabase, Neon)
        engine = create_engine(db_url, pool_pre_ping=True)
else:
    # Default local SQLite file
    sqlite_file = os.getenv("SQLITE_PATH") or os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "coldtrace.db"
    )
    engine = create_engine(
        f"sqlite:///{sqlite_file}",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
