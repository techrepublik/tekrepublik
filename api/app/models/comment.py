from __future__ import annotations
import uuid
from typing import Optional, List
from sqlalchemy import String, ForeignKey, Integer, UniqueConstraint, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class Comment(Base):
    __tablename__ = "comments"
    
    content_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("content_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    body: Mapped[str] = mapped_column(String(1000), nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    
    # Relationships
    author: Mapped["User"] = relationship("User")
    content_item: Mapped["ContentItem"] = relationship("ContentItem", back_populates="comments")
    
    # Self-referencing relationship for replies
    parent: Mapped[Optional[Comment]] = relationship(
        "Comment",
        back_populates="replies",
        remote_side="Comment.id"
    )
    replies: Mapped[List[Comment]] = relationship(
        "Comment",
        back_populates="parent",
        cascade="all, delete-orphan",
        order_by="Comment.created_at"
    )
    
    # Ratings relationship
    ratings: Mapped[List[CommentRating]] = relationship(
        "CommentRating",
        back_populates="comment",
        cascade="all, delete-orphan"
    )

class CommentRating(Base):
    __tablename__ = "comment_ratings"
    
    comment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Relationships
    comment: Mapped[Comment] = relationship("Comment", back_populates="ratings")
    
    __table_args__ = (
        UniqueConstraint("comment_id", "user_id", name="uq_comment_rating_user"),
    )
