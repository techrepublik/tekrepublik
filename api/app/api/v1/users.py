from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """
    Fetch the profile, role, and permission mappings for the currently logged-in user.
    """
    # Build profile dict if profile exists
    profile_data = None
    if current_user.profile:
        profile_data = {
            "first_name": current_user.profile.first_name,
            "last_name": current_user.profile.last_name,
            "bio": current_user.profile.bio,
            "avatar_url": current_user.profile.avatar_url,
        }
        
    role_data = {
        "name": current_user.role.name,
        "permissions": [p.name for p in current_user.role.permissions]
    }
    
    return {
        "success": True,
        "data": {
            "id": current_user.id,
            "email": current_user.email,
            "is_active": current_user.is_active,
            "is_verified": current_user.is_verified,
            "profile": profile_data,
            "role": role_data,
        },
        "meta": {},
        "error": None
    }
