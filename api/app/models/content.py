from __future__ import annotations
import uuid
from sqlalchemy import String, ForeignKey, Table, Column, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

# Association table for Content-Category many-to-many
content_categories = Table(
    "content_category_links",
    Base.metadata,
    Column("content_id", UUID(as_uuid=True), ForeignKey("content_items.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)

# Association table for Content-Tag many-to-many
content_tags = Table(
    "content_tag_links",
    Base.metadata,
    Column("content_id", UUID(as_uuid=True), ForeignKey("content_items.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

class Category(Base):
    __tablename__ = "categories"
    
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

class Tag(Base):
    __tablename__ = "tags"
    
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)

class ContentItem(Base):
    __tablename__ = "content_items"
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    content_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # tutorial, article, blog, project
    status: Mapped[str] = mapped_column(String(50), default="draft", index=True, nullable=False)  # draft, review, published, archived
    access_level: Mapped[str] = mapped_column(String(50), default="public", index=True, nullable=False)  # public, email_gated, member_only, premium, private
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    # Relationships
    author: Mapped["User"] = relationship("User")
    categories: Mapped[list["Category"]] = relationship("Category", secondary=content_categories)
    tags: Mapped[list["Tag"]] = relationship("Tag", secondary=content_tags)
    revisions: Mapped[list["ContentRevision"]] = relationship("ContentRevision", back_populates="content_item", cascade="all, delete-orphan")

class ContentRevision(Base):
    __tablename__ = "content_revisions"
    
    content_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("content_items.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str | None] = mapped_column(String(500), nullable=True)
    body: Mapped[str] = mapped_column(nullable=False)  # long body text / MDX content
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    changer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    # Relationships
    content_item: Mapped["ContentItem"] = relationship("ContentItem", back_populates="revisions")
    changer: Mapped["User"] = relationship("User")

# Self-referencing many-to-many relationship for related content items
class ContentRelation(Base):
    __tablename__ = "content_relations"
    
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("content_items.id", ondelete="CASCADE"), primary_key=True)
    target_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("content_items.id", ondelete="CASCADE"), primary_key=True)
    relation_type: Mapped[str] = mapped_column(String(50), default="related", nullable=False)
