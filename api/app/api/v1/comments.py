import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.comment import Comment
from app.models.content import ContentItem

router = APIRouter()

# --- Pydantic Schemas ---

class ProfileMini(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class UserMini(BaseModel):
    id: uuid.UUID
    email: str
    profile: Optional[ProfileMini] = None
    role: Optional[dict] = None
    
    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content_id: uuid.UUID
    parent_id: Optional[uuid.UUID] = None
    body: str = Field(min_length=1, max_length=1000)

class CommentResponse(BaseModel):
    id: uuid.UUID
    content_id: uuid.UUID
    parent_id: Optional[uuid.UUID] = None
    body: str
    created_at: datetime
    updated_at: datetime
    author: UserMini
    replies: List['CommentResponse'] = []
    
    class Config:
        from_attributes = True

# Rebuild the model to support self-referential (recursive) replies
CommentResponse.model_rebuild()


# --- Endpoints ---

@router.get("/content/{content_id}", response_model=None)
def get_comments_for_content(content_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get all top-level comments and their nested replies for a given content item.
    """
    content_exists = db.query(ContentItem).filter(ContentItem.id == content_id).first()
    if not content_exists:
        raise HTTPException(status_code=404, detail="Content item not found")

    # Fetch top-level comments (parent_id is null) ordered by creation date ascending
    top_level_comments = (
        db.query(Comment)
        .filter(Comment.content_id == content_id, Comment.parent_id == None)
        .order_by(Comment.created_at.asc())
        .all()
    )

    # Convert to response schemas (SQLAlchemy relationship loads replies recursively)
    comments_data = [CommentResponse.model_validate(c) for c in top_level_comments]

    return {
        "success": True,
        "data": comments_data,
        "meta": {"count": len(comments_data)},
        "error": None
    }

@router.post("", response_model=None, status_code=status.HTTP_201_CREATED)
def create_comment(
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new comment or reply for a content item.
    """
    # 1. Verify content item exists
    content_item = db.query(ContentItem).filter(ContentItem.id == comment_in.content_id).first()
    if not content_item:
        raise HTTPException(status_code=404, detail="Content item not found")

    # 2. If replying, verify parent comment exists
    if comment_in.parent_id:
        parent_comment = db.query(Comment).filter(Comment.id == comment_in.parent_id).first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")
        if parent_comment.content_id != comment_in.content_id:
            raise HTTPException(status_code=400, detail="Parent comment belongs to a different content item")

    # 3. Create the comment
    comment = Comment(
        content_id=comment_in.content_id,
        author_id=current_user.id,
        parent_id=comment_in.parent_id,
        body=comment_in.body
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Return the newly created comment response
    data = CommentResponse.model_validate(comment)

    return {
        "success": True,
        "data": data,
        "meta": {},
        "error": None
    }

@router.delete("/{comment_id}", response_model=None)
def delete_comment(
    comment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a comment. If the comment has replies, clear its content to preserve thread hierarchy.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Access control: Author of the comment, Administrator, or Editor only
    is_admin_or_editor = current_user.role.name in ["Administrator", "Editor"]
    if comment.author_id != current_user.id and not is_admin_or_editor:
        raise HTTPException(
            status_code=403,
            detail="Permission denied: Not authorized to delete this comment"
        )

    # Check if this comment has replies
    has_replies = db.query(Comment).filter(Comment.parent_id == comment.id).count() > 0

    if has_replies:
        # Soft delete: wipe body text to keep layout intact for downstream replies
        comment.body = "[Comment deleted]"
        db.commit()
        db.refresh(comment)
        return {
            "success": True,
            "data": CommentResponse.model_validate(comment),
            "meta": {"cleared_body": True},
            "error": None
        }
    else:
        # Hard delete
        db.delete(comment)
        db.commit()
        return {
            "success": True,
            "data": None,
            "meta": {"deleted": True},
            "error": None
        }
