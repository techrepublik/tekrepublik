import os
from logging.config import fileConfig
from sqlalchemy import create_engine, pool
from alembic import context

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# This is the Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import models metadata
# We will create app.db.base to import all models, ensuring they are registered on Base.metadata
from app.db.base import Base
target_metadata = Base.metadata

def get_url() -> str:
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres_password_here")
    host = os.getenv("POSTGRES_HOST", "db")
    port = os.getenv("POSTGRES_PORT", "5432")
    db = os.getenv("POSTGRES_DB", "techrepublik_dev")
    return f"postgresql://{user}:{password}@{host}:{port}/{db}"

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = create_engine(
        get_url(),
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            # Automatically create the UUID extension if it doesn't exist
            from sqlalchemy import text
            connection.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
