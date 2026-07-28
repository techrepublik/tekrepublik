from datetime import datetime, timezone
from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.content import ContentItem, ContentRevision, Category, Tag
from app.core.deps import get_current_user, PermissionChecker, get_current_user_optional

router = APIRouter()

# --- Pydantic Schemas ---

class ContentCreate(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=255)
    content_type: str = Field(pattern="^(tutorial|article|blog|project)$")
    status: str = Field(default="draft", pattern="^(draft|review|published|archived)$")
    access_level: str = Field(default="public", pattern="^(public|email_gated|member_only|premium|private)$")
    summary: Optional[str] = Field(None, max_length=500)
    body: str = Field(min_length=5)
    category_ids: Optional[List[uuid.UUID]] = []
    tag_ids: Optional[List[uuid.UUID]] = []

class CategoryMini(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    class Config:
        from_attributes = True

class TagMini(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    class Config:
        from_attributes = True

class RevisionResponse(BaseModel):
    id: uuid.UUID
    version: int
    title: str
    summary: Optional[str]
    body: str
    created_at: datetime
    changer_id: uuid.UUID
    class Config:
        from_attributes = True

class ContentListItemResponse(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    content_type: str
    status: str
    access_level: str
    created_at: datetime
    updated_at: datetime
    author_id: uuid.UUID
    categories: List[CategoryMini]
    tags: List[TagMini]
    version: int
    summary: Optional[str] = None

class ContentDetailResponse(ContentListItemResponse):
    body: str
    revisions: List[RevisionResponse] = []


# --- Helpers ---

def get_latest_revision(db: Session, content_id: uuid.UUID) -> Optional[ContentRevision]:
    return db.query(ContentRevision).filter(ContentRevision.content_id == content_id).order_by(ContentRevision.version.desc()).first()


# --- Endpoints ---

@router.get("", response_model=None)
def get_contents(
    content_type: Optional[str] = None,
    category_slug: Optional[str] = None,
    tag_slug: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(ContentItem)
    
    # 1. Access Filters
    # If not logged in as Admin/Editor/Author, only see Published content
    is_cms_privileged = False
    if current_user:
        permission_names = [p.name for p in current_user.role.permissions]
        if current_user.role.name == "Administrator" or "ai.cms.generate" in permission_names or "ai.cms.review" in permission_names:
            is_cms_privileged = True
            
    if not is_cms_privileged:
        query = query.filter(ContentItem.status == "published")
        
    # 2. Category/Tag/Type Filters
    if content_type:
        query = query.filter(ContentItem.content_type == content_type)
        
    if category_slug:
        query = query.join(ContentItem.categories).filter(Category.slug == category_slug)
        
    if tag_slug:
        query = query.join(ContentItem.tags).filter(Tag.slug == tag_slug)
        
    items = query.order_by(ContentItem.created_at.desc()).all()
    
    # Build list payload
    result = []
    for item in items:
        latest = get_latest_revision(db, item.id)
        version = latest.version if latest else 1
        summary = latest.summary if latest else None
        
        result.append(
            ContentListItemResponse(
                id=item.id,
                title=item.title,
                slug=item.slug,
                content_type=item.content_type,
                status=item.status,
                access_level=item.access_level,
                created_at=item.created_at,
                updated_at=item.updated_at,
                author_id=item.author_id,
                categories=[CategoryMini.model_validate(c) for c in item.categories],
                tags=[TagMini.model_validate(t) for t in item.tags],
                version=version,
                summary=summary
            )
        )
        
    return {
        "success": True,
        "data": result,
        "meta": {"count": len(result)},
        "error": None
    }

@router.get("/{content_id}", response_model=None)
def get_content_detail(content_id: uuid.UUID, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    item = db.query(ContentItem).filter(ContentItem.id == content_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")
        
    # Access checks
    is_cms_privileged = False
    if current_user:
        permission_names = [p.name for p in current_user.role.permissions]
        if current_user.role.name == "Administrator" or "ai.cms.generate" in permission_names or "ai.cms.review" in permission_names:
            is_cms_privileged = True
            
    if item.status != "published" and not is_cms_privileged:
        raise HTTPException(status_code=403, detail="Forbidden: Content draft restricted")
        
    latest = get_latest_revision(db, item.id)
    if not latest:
        raise HTTPException(status_code=500, detail="Data inconsistency: Content has no revisions")
        
    # Revisions list
    revisions = db.query(ContentRevision).filter(ContentRevision.content_id == item.id).order_by(ContentRevision.version.desc()).all()
    
    data = ContentDetailResponse(
        id=item.id,
        title=item.title,
        slug=item.slug,
        content_type=item.content_type,
        status=item.status,
        access_level=item.access_level,
        created_at=item.created_at,
        updated_at=item.updated_at,
        author_id=item.author_id,
        categories=[CategoryMini.model_validate(c) for c in item.categories],
        tags=[TagMini.model_validate(t) for t in item.tags],
        version=latest.version,
        summary=latest.summary,
        body=latest.body,
        revisions=[RevisionResponse.model_validate(r) for r in revisions]
    )
    
    return {
        "success": True,
        "data": data,
        "meta": {},
        "error": None
    }

@router.get("/slug/{slug}", response_model=None)
def get_content_by_slug(
    slug: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    item = db.query(ContentItem).filter(ContentItem.slug == slug).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")
        
    # Access checks
    is_cms_privileged = False
    if current_user:
        permission_names = [p.name for p in current_user.role.permissions]
        if current_user.role.name == "Administrator" or "ai.cms.generate" in permission_names or "ai.cms.review" in permission_names:
            is_cms_privileged = True
            
    if item.status != "published" and not is_cms_privileged:
        raise HTTPException(status_code=403, detail="Forbidden: Content draft restricted")
        
    latest = get_latest_revision(db, item.id)
    if not latest:
        raise HTTPException(status_code=500, detail="Data inconsistency: Content has no revisions")
        
    # Revisions list
    revisions = db.query(ContentRevision).filter(ContentRevision.content_id == item.id).order_by(ContentRevision.version.desc()).all()
    
    data = ContentDetailResponse(
        id=item.id,
        title=item.title,
        slug=item.slug,
        content_type=item.content_type,
        status=item.status,
        access_level=item.access_level,
        created_at=item.created_at,
        updated_at=item.updated_at,
        author_id=item.author_id,
        categories=[CategoryMini.model_validate(c) for c in item.categories],
        tags=[TagMini.model_validate(t) for t in item.tags],
        version=latest.version,
        summary=latest.summary,
        body=latest.body,
        revisions=[RevisionResponse.model_validate(r) for r in revisions]
    )
    
    return {
        "success": True,
        "data": data,
        "meta": {},
        "error": None
    }

@router.post("", response_model=None, status_code=status.HTTP_201_CREATED)
def create_content(
    content_in: ContentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.generate"))
):
    # Check if slug exists
    exists = db.query(ContentItem).filter(ContentItem.slug == content_in.slug).first()
    if exists:
        raise HTTPException(status_code=400, detail="Slug already in use")
        
    # Fetch Category and Tag relations
    categories = db.query(Category).filter(Category.id.in_(content_in.category_ids)).all()
    tags = db.query(Tag).filter(Tag.id.in_(content_in.tag_ids)).all()
    
    # Create main ContentItem
    item = ContentItem(
        title=content_in.title,
        slug=content_in.slug,
        content_type=content_in.content_type,
        status=content_in.status,
        access_level=content_in.access_level,
        author_id=current_user.id,
        categories=categories,
        tags=tags
    )
    db.add(item)
    db.flush()  # Generate item.id
    
    # Create first Revision
    revision = ContentRevision(
        content_id=item.id,
        title=content_in.title,
        summary=content_in.summary,
        body=content_in.body,
        version=1,
        changer_id=current_user.id
    )
    db.add(revision)
    db.commit()
    
    return {
        "success": True,
        "data": {
            "id": item.id,
            "title": item.title,
            "slug": item.slug,
            "content_type": item.content_type,
            "status": item.status,
            "version": 1
        },
        "meta": {},
        "error": None
    }

@router.put("/{content_id}", response_model=None)
def update_content(
    content_id: uuid.UUID,
    content_in: ContentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.generate"))
):
    item = db.query(ContentItem).filter(ContentItem.id == content_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")
        
    # Check slug collision
    exists = db.query(ContentItem).filter(ContentItem.slug == content_in.slug, ContentItem.id != content_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Slug already in use")
        
    # Fetch Category and Tag objects
    categories = db.query(Category).filter(Category.id.in_(content_in.category_ids)).all()
    tags = db.query(Tag).filter(Tag.id.in_(content_in.tag_ids)).all()
    
    # Update main ContentItem details
    item.title = content_in.title
    item.slug = content_in.slug
    item.content_type = content_in.content_type
    item.status = content_in.status
    item.access_level = content_in.access_level
    item.categories = categories
    item.tags = tags
    item.updated_at = datetime.now(timezone.utc)
    
    # Get latest version number to increment
    latest = get_latest_revision(db, item.id)
    next_version = (latest.version + 1) if latest else 1
    
    # Create new Revision record (automatic history tracking)
    revision = ContentRevision(
        content_id=item.id,
        title=content_in.title,
        summary=content_in.summary,
        body=content_in.body,
        version=next_version,
        changer_id=current_user.id
    )
    db.add(revision)
    db.commit()
    
    return {
        "success": True,
        "data": {
            "id": item.id,
            "title": item.title,
            "slug": item.slug,
            "status": item.status,
            "version": next_version
        },
        "meta": {},
        "error": None
    }

@router.delete("/{content_id}", response_model=None)
def delete_content(
    content_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.generate"))
):
    item = db.query(ContentItem).filter(ContentItem.id == content_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")
        
    db.delete(item)
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Content deleted successfully"},
        "meta": {},
        "error": None
    }
