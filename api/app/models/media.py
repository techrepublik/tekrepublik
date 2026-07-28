import uuid
from typing import Optional
from sqlalchemy import String, Integer, ForeignKey, Table, Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

# Association table for Content-Media many-to-many relationship
content_media = Table(
    "content_media",
    Base.metadata,
    Column("content_item_id", UUID(as_uuid=True), ForeignKey("content_items.id", ondelete="CASCADE"), primary_key=True),
    Column("media_file_id", UUID(as_uuid=True), ForeignKey("media_files.id", ondelete="CASCADE"), primary_key=True),
)

class MediaFile(Base):
    __tablename__ = "media_files"
    
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    filepath: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    mimetype: Mapped[str] = mapped_column(String(100), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    access_level: Mapped[str] = mapped_column(String(50), default="public", nullable=False)  # public, private, premium
    uploaded_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    uploaded_by: Mapped[Optional["User"]] = relationship("User")
