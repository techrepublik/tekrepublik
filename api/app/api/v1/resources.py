import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.resources import Resource, ResourceFile, ResourceDownload
from app.models.products import AccessEntitlement
from app.core.deps import get_current_user_optional, PermissionChecker

router = APIRouter()

# --- Pydantic Schemas ---

class ResourceResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str]
    is_free: bool
    price: float
    is_gated: bool
    has_access: bool

    class Config:
        from_attributes = True

class ResourceCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    is_free: bool = True
    price: float = 0.0
    is_gated: bool = False
    media_file_ids: List[uuid.UUID] = []

# --- Endpoints ---

@router.get("", response_model=None)
def list_resources(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    List all downloadable assets. Evaluates if the requester is entitled to download.
    """
    resources = db.query(Resource).order_by(Resource.name.asc()).all()
    
    result = []
    for r in resources:
        has_access = True
        
        # 1. Gated check: requires login
        if r.is_gated and not current_user:
            has_access = False
            
        # 2. Premium check: requires active purchase entitlement
        if not r.is_free:
            if not current_user:
                has_access = False
            else:
                ent = db.query(AccessEntitlement).filter(
                    AccessEntitlement.user_id == current_user.id,
                    AccessEntitlement.resource_id == r.id
                ).first()
                if not ent:
                    has_access = False
                    
        result.append(
            ResourceResponse(
                id=r.id,
                name=r.name,
                slug=r.slug,
                description=r.description,
                is_free=r.is_free,
                price=r.price,
                is_gated=r.is_gated,
                has_access=has_access
            )
        )
        
    return {
        "success": True,
        "data": result,
        "meta": {"count": len(result)},
        "error": None
    }

@router.get("/{resource_id}/download", response_model=None)
def download_resource(
    resource_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Query files linked to the resource, execute gating/entitlement security checks,
    log the session, and return the download URL.
    """
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    # 1. Gated Check
    if resource.is_gated and not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required for gated resources"
        )
        
    # 2. Premium Check
    if not resource.is_free:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required for premium resources"
            )
        ent = db.query(AccessEntitlement).filter(
            AccessEntitlement.user_id == current_user.id,
            AccessEntitlement.resource_id == resource.id
        ).first()
        if not ent:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You do not possess access entitlements for this resource"
            )
            
    # 3. Locate linked media file
    res_file = db.query(ResourceFile).filter(ResourceFile.resource_id == resource.id).first()
    if not res_file or not res_file.media_file:
        raise HTTPException(
            status_code=404,
            detail="No files are linked to this resource record"
        )
        
    # 4. Log Download
    download_log = ResourceDownload(
        resource_id=resource.id,
        user_id=current_user.id if current_user else None,
        anonymous_session_id=request.cookies.get("access_token")[:250] if request.cookies.get("access_token") else None,
        ip_address=request.client.host if request.client else None
    )
    db.add(download_log)
    db.commit()
    
    # 5. Return target static URL
    return {
        "success": True,
        "data": {
            "name": resource.name,
            "url": f"/uploads/{res_file.media_file.filepath}"
        },
        "meta": {},
        "error": None
    }

@router.post("", response_model=None, status_code=status.HTTP_201_CREATED)
def create_resource(
    res_in: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.generate"))
):
    """
    (Admin/Editor only) Register a new downloadable resource.
    """
    # Slug collision check
    exists = db.query(Resource).filter(Resource.slug == res_in.slug).first()
    if exists:
        raise HTTPException(status_code=400, detail="Slug already in use")
        
    db_res = Resource(
        name=res_in.name,
        slug=res_in.slug,
        description=res_in.description,
        is_free=res_in.is_free,
        price=res_in.price,
        is_gated=res_in.is_gated
    )
    db.add(db_res)
    db.flush()
    
    # Link media files
    for media_id in res_in.media_file_ids:
        link = ResourceFile(
            resource_id=db_res.id,
            media_file_id=media_id
        )
        db.add(link)
        
    db.commit()
    db.refresh(db_res)
    
    return {
        "success": True,
        "data": {
            "id": db_res.id,
            "name": db_res.name,
            "slug": db_res.slug
        },
        "meta": {},
        "error": None
    }
