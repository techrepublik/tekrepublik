import uuid
from typing import Optional
from sqlalchemy import String, Boolean, ForeignKey, Table, Column, Float, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

# Association table for Content-Resources many-to-many
content_resources = Table(
    "content_resources",
    Base.metadata,
    Column("content_item_id", UUID(as_uuid=True), ForeignKey("content_items.id", ondelete="CASCADE"), primary_key=True),
    Column("resource_id", UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE"), primary_key=True),
)

class Resource(Base):
    __tablename__ = "resources"
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_free: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    price: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_gated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)  # requires email subscription or membership
    
    # Relationships
    files: Mapped[list["ResourceFile"]] = relationship("ResourceFile", back_populates="resource", cascade="all, delete-orphan")
    downloads: Mapped[list["ResourceDownload"]] = relationship("ResourceDownload", back_populates="resource", cascade="all, delete-orphan")

class ResourceFile(Base):
    __tablename__ = "resource_files"
    
    resource_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    media_file_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("media_files.id", ondelete="CASCADE"), nullable=False)
    
    # Relationships
    resource: Mapped["Resource"] = relationship("Resource", back_populates="files")
    media_file: Mapped["MediaFile"] = relationship("MediaFile")

class ResourceDownload(Base):
    __tablename__ = "resource_downloads"
    
    resource_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("resources.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    anonymous_session_id: Mapped[Optional[str]] = mapped_column(String(255), index=True, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    
    # Relationships
    resource: Mapped["Resource"] = relationship("Resource", back_populates="downloads")
    user: Mapped[Optional["User"]] = relationship("User")
