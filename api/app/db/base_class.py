import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, mapped_column

class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy database models.
    Provides standard fields (UUID Primary Key, created_at, updated_at).
    """
    id = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("uuid_generate_v4()"),
    )
    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=text("timezone('utc'::text, now())"),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = mapped_column(
        DateTime(timezone=True),
        server_default=text("timezone('utc'::text, now())"),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
