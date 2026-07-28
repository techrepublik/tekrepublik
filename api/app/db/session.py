import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

def get_url() -> str:
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres_password_here")
    host = os.getenv("POSTGRES_HOST", "db")
    port = os.getenv("POSTGRES_PORT", "5432")
    db = os.getenv("POSTGRES_DB", "techrepublik_dev")
    return f"postgresql://{user}:{password}@{host}:{port}/{db}"

engine = create_engine(
    get_url(),
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Dependency generator for DB sessions.
    Ensures the session is closed after requests are handled.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
