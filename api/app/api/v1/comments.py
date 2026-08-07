import os
import shutil
import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.deps import get_current_user, get_current_user_optional
from app.models.user import User
from app.models.comment import Comment, CommentRating
from app.models.content import ContentItem

router = APIRouter()

# --- Pydantic Schemas ---

class ProfileMini(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class RoleMini(BaseModel):
    name: str
    class Config:
        from_attributes = True

class UserMini(BaseModel):
    id: uuid.UUID
    email: str
    profile: Optional[ProfileMini] = None
    role: Optional[RoleMini] = None
    
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
    image_url: Optional[str] = None
    is_edited: bool = False
    average_rating: Optional[float] = None
    ratings_count: int = 0
    user_rating: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    author: UserMini
    replies: List['CommentResponse'] = []
    
    class Config:
        from_attributes = True

# Rebuild the model to support self-referential (recursive) replies
CommentResponse.model_rebuild()

class CommentEditRequest(BaseModel):
    body: str = Field(..., min_length=1, max_length=1000)

class CommentRateRequest(BaseModel):
    rating: int = Field(..., ge=0, le=5) # 1-5 to rate, 0 to clear/remove rating

def build_comment_response(comment: Comment, current_user_id: Optional[uuid.UUID] = None) -> CommentResponse:
    # 1. Calculate ratings aggregates
    ratings = comment.ratings
    ratings_count = len(ratings)
    average_rating = sum(r.rating for r in ratings) / ratings_count if ratings_count > 0 else None
    
    user_rating = None
    if current_user_id:
        user_rating = next((r.rating for r in ratings if r.user_id == current_user_id), None)
        
    # 2. Recursively convert replies
    replies_response = [build_comment_response(reply, current_user_id) for reply in comment.replies]
    
    # 3. Create the schema
    response = CommentResponse.model_validate(comment)
    response.average_rating = average_rating
    response.ratings_count = ratings_count
    response.user_rating = user_rating
    response.replies = replies_response
    
    return response


# --- Endpoints ---

@router.get("/content/{content_id}", response_model=None)
def get_comments_for_content(
    content_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
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

    user_id = current_user.id if current_user else None
    comments_data = [build_comment_response(c, user_id) for c in top_level_comments]

    return {
        "success": True,
        "data": comments_data,
        "meta": {"count": len(comments_data)},
        "error": None
    }

COMMENTS_UPLOAD_DIR = "/app/uploads/comments"

@router.post("", response_model=None, status_code=status.HTTP_201_CREATED)
async def create_comment(
    content_id: uuid.UUID = Form(...),
    parent_id: Optional[uuid.UUID] = Form(None),
    body: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new comment or reply with optional image attachment.
    """
    # 1. Verify content item exists
    content_item = db.query(ContentItem).filter(ContentItem.id == content_id).first()
    if not content_item:
        raise HTTPException(status_code=404, detail="Content item not found")

    # 2. If replying, verify parent comment exists
    if parent_id:
        parent_comment = db.query(Comment).filter(Comment.id == parent_id).first()
        if not parent_comment:
            raise HTTPException(status_code=404, detail="Parent comment not found")
        if parent_comment.content_id != content_id:
            raise HTTPException(status_code=400, detail="Parent comment belongs to a different content item")

    # 3. Handle optional image upload
    image_url = None
    if image and image.filename:
        # Ensure uploads directory exists
        os.makedirs(COMMENTS_UPLOAD_DIR, exist_ok=True)
        # Generate unique filename for the comment attachment
        file_ext = os.path.splitext(image.filename)[1] or ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        dest_path = os.path.join(COMMENTS_UPLOAD_DIR, unique_filename)

        try:
            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            image_url = f"/uploads/comments/{unique_filename}"
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to write image attachment to disk: {str(e)}"
            )

    # 4. Create the comment
    comment = Comment(
        content_id=content_id,
        author_id=current_user.id,
        parent_id=parent_id,
        body=body,
        image_url=image_url
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Return the newly created comment response
    data = build_comment_response(comment, current_user.id)

    return {
        "success": True,
        "data": data,
        "meta": {},
        "error": None
    }

@router.post("/{comment_id}/rate", response_model=None)
def rate_comment(
    comment_id: uuid.UUID,
    rate_in: CommentRateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rate or react with stars to any existing comment or reply.
    """
    # 1. Verify comment exists
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # 2. Check if user already rated this comment
    existing_rating = (
        db.query(CommentRating)
        .filter(CommentRating.comment_id == comment_id, CommentRating.user_id == current_user.id)
        .first()
    )

    if rate_in.rating == 0:
        # Clear/remove rating
        if existing_rating:
            db.delete(existing_rating)
            db.commit()
    else:
        # Create or update rating
        if existing_rating:
            existing_rating.rating = rate_in.rating
        else:
            new_rating = CommentRating(
                comment_id=comment_id,
                user_id=current_user.id,
                rating=rate_in.rating
            )
            db.add(new_rating)
        db.commit()

    # 3. Fetch fresh aggregates for the response
    ratings = db.query(CommentRating).filter(CommentRating.comment_id == comment_id).all()
    ratings_count = len(ratings)
    average_rating = sum(r.rating for r in ratings) / ratings_count if ratings_count > 0 else None

    return {
        "success": True,
        "data": {
            "comment_id": comment_id,
            "average_rating": average_rating,
            "ratings_count": ratings_count,
            "user_rating": rate_in.rating if rate_in.rating > 0 else None
        },
        "meta": {},
        "error": None
    }

@router.put("/{comment_id}", response_model=None)
def edit_comment(
    comment_id: uuid.UUID,
    edit_in: CommentEditRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Edit an existing comment or reply. Only the original author can edit it.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    if comment.body == "[Comment deleted]":
        raise HTTPException(status_code=400, detail="Cannot edit a deleted comment")
        
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")
        
    comment.body = edit_in.body
    comment.is_edited = True
    db.commit()
    db.refresh(comment)
    
    data = build_comment_response(comment, current_user.id)
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
