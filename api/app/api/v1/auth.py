from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, Profile, Role, RefreshToken
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.deps import get_token

router = APIRouter()

# --- Pydantic Schemas ---
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role_name: str
    
    class Config:
        from_attributes = True

# --- Helper to set token cookies ---
def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=15 * 60,  # 15 minutes
        expires=15 * 60,
        samesite="lax",
        secure=False,  # Set to True in production (requires HTTPS)
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=8 * 24 * 3600,  # 8 days
        expires=8 * 24 * 3600,
        samesite="lax",
        secure=False,  # Set to True in production (requires HTTPS)
    )

def clear_auth_cookies(response: Response):
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")

# --- Routes ---

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user account. Assigns the default 'Subscriber' role.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
        
    # Get Subscriber role
    subscriber_role = db.query(Role).filter(Role.name == "Subscriber").first()
    if not subscriber_role:
        # Fallback to create Subscriber role if database was not seeded
        subscriber_role = Role(name="Subscriber", description="Default user role")
        db.add(subscriber_role)
        db.flush()
        
    # Create User
    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
        is_verified=False,
        role_id=subscriber_role.id
    )
    db.add(new_user)
    db.flush()  # Generate user ID
    
    # Create Profile
    profile = Profile(
        user_id=new_user.id,
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        bio=None,
        avatar_url=None
    )
    db.add(profile)
    db.commit()
    
    return {
        "success": True,
        "data": {
            "id": new_user.id,
            "email": new_user.email,
            "role_name": subscriber_role.name
        },
        "meta": {},
        "error": None
    }

@router.post("/login", response_model=None)
def login(
    user_in: UserLogin,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Authenticate credentials, issue access & refresh tokens, set cookies.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password",
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )
        
    # Generate tokens
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    
    # Save refresh token in database
    expires_at = datetime.now(timezone.utc) + timedelta(days=8)
    db_refresh = RefreshToken(
        token=refresh_token,
        user_id=user.id,
        expires_at=expires_at,
        revoked=False
    )
    db.add(db_refresh)
    db.commit()
    
    # Set cookies
    set_auth_cookies(response, access_token, refresh_token)
    
    return {
        "success": True,
        "data": {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "role_name": user.role.name
            }
        },
        "meta": {},
        "error": None
    }

@router.post("/refresh")
def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    body_refresh_token: Optional[str] = None
):
    """
    Rotate refresh tokens. Invalidates old refresh tokens.
    """
    # Extract token: Check body first, then check cookie
    token = body_refresh_token or request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Refresh token missing"
        )
        
    # Decode and validate refresh token
    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
        
    # Query token database record
    db_refresh = db.query(RefreshToken).filter(RefreshToken.token == token).first()
    if not db_refresh or db_refresh.revoked or db_refresh.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked or expired"
        )
        
    # Revoke old token (one-use rotation)
    db_refresh.revoked = True
    db.flush()
    
    # Generate new tokens
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found or inactive"
        )
        
    new_access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)
    
    # Save new refresh token
    new_expires_at = datetime.now(timezone.utc) + timedelta(days=8)
    new_db_refresh = RefreshToken(
        token=new_refresh_token,
        user_id=user.id,
        expires_at=new_expires_at,
        revoked=False
    )
    db.add(new_db_refresh)
    db.commit()
    
    # Set cookies
    set_auth_cookies(response, new_access_token, new_refresh_token)
    
    return {
        "success": True,
        "data": {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        },
        "meta": {},
        "error": None
    }

@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    body_refresh_token: Optional[str] = None
):
    """
    Log out user, invalidate active refresh token, and clear cookies.
    """
    token = body_refresh_token or request.cookies.get("refresh_token")
    if token:
        db_refresh = db.query(RefreshToken).filter(RefreshToken.token == token).first()
        if db_refresh:
            db_refresh.revoked = True
            db.commit()
            
    clear_auth_cookies(response)
    
    return {
        "success": True,
        "data": {"message": "Logged out successfully"},
        "meta": {},
        "error": None
    }
