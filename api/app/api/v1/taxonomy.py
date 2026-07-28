from typing import List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.content import Category, Tag
from app.core.deps import get_current_user, PermissionChecker

router = APIRouter()

# --- Pydantic Schemas ---
class CategoryBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: str = Field(min_length=2, max_length=100)

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: uuid.UUID
    
    class Config:
        from_attributes = True

class TagBase(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    slug: str = Field(min_length=1, max_length=50)

class TagCreate(TagBase):
    pass

class TagResponse(TagBase):
    id: uuid.UUID
    
    class Config:
        from_attributes = True


# --- Categories Endpoints ---

@router.get("/categories", response_model=None)
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).order_by(Category.name).all()
    return {
        "success": True,
        "data": [CategoryResponse.model_validate(c) for c in categories],
        "meta": {},
        "error": None
    }

@router.post("/categories", response_model=None, status_code=status.HTTP_201_CREATED)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.generate"))
):
    # Check if slug exists
    exists = db.query(Category).filter(Category.slug == category_in.slug).first()
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category slug already exists",
        )
    
    new_cat = Category(name=category_in.name, slug=category_in.slug)
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    
    return {
        "success": True,
        "data": CategoryResponse.model_validate(new_cat),
        "meta": {},
        "error": None
    }

@router.put("/categories/{category_id}", response_model=None)
def update_category(
    category_id: uuid.UUID,
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.generate"))
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    # Check if slug is taken by another category
    exists = db.query(Category).filter(Category.slug == category_in.slug, Category.id != category_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Category slug already exists")
        
    category.name = category_in.name
    category.slug = category_in.slug
    db.commit()
    db.refresh(category)
    
    return {
        "success": True,
        "data": CategoryResponse.model_validate(category),
        "meta": {},
        "error": None
    }

@router.delete("/categories/{category_id}", response_model=None)
def delete_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.generate"))
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    db.delete(category)
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Category deleted successfully"},
        "meta": {},
        "error": None
    }


# --- Tags Endpoints ---

@router.get("/tags", response_model=None)
def get_tags(db: Session = Depends(get_db)):
    tags = db.query(Tag).order_by(Tag.name).all()
    return {
        "success": True,
        "data": [TagResponse.model_validate(t) for t in tags],
        "meta": {},
        "error": None
    }

@router.post("/tags", response_model=None, status_code=status.HTTP_201_CREATED)
def create_tag(
    tag_in: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.generate"))
):
    # Check if slug exists
    exists = db.query(Tag).filter(Tag.slug == tag_in.slug).first()
    if exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag slug already exists",
        )
    
    new_tag = Tag(name=tag_in.name, slug=tag_in.slug)
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    
    return {
        "success": True,
        "data": TagResponse.model_validate(new_tag),
        "meta": {},
        "error": None
    }

@router.put("/tags/{tag_id}", response_model=None)
def update_tag(
    tag_id: uuid.UUID,
    tag_in: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.generate"))
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
        
    # Check if slug is taken
    exists = db.query(Tag).filter(Tag.slug == tag_in.slug, Tag.id != tag_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Tag slug already exists")
        
    tag.name = tag_in.name
    tag.slug = tag_in.slug
    db.commit()
    db.refresh(tag)
    
    return {
        "success": True,
        "data": TagResponse.model_validate(tag),
        "meta": {},
        "error": None
    }

@router.delete("/tags/{tag_id}", response_model=None)
def delete_tag(
    tag_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.generate"))
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
        
    db.delete(tag)
    db.commit()
    
    return {
        "success": True,
        "data": {"message": "Tag deleted successfully"},
        "meta": {},
        "error": None
    }
