import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.media import MediaFile
from app.core.deps import get_current_user, PermissionChecker

router = APIRouter()

# --- Config ---
UPLOAD_DIR = "/app/uploads"

# --- Pydantic Schemas ---
class MediaFileResponse(BaseModel):
    id: uuid.UUID
    filename: str
    filepath: str
    mimetype: str
    size_bytes: int
    access_level: str
    url: str

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.post("/upload", response_model=None, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.generate"))
):
    """
    Upload a media asset, save to local disk, and register in database.
    """
    # 1. Ensure directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 2. Generate unique clean filename to prevent naming collisions
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)

    # 3. Read and write file
    try:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to disk: {str(e)}"
        )
    finally:
        await file.close()

    # 4. Get metadata
    size_bytes = os.path.getsize(dest_path)
    mimetype = file.content_type or "application/octet-stream"

    # 5. Save in database
    db_media = MediaFile(
        filename=file.filename or unique_filename,
        filepath=unique_filename,  # Store the relative path/name inside uploads directory
        mimetype=mimetype,
        size_bytes=size_bytes,
        access_level="public",
        uploaded_by_id=current_user.id
    )
    db.add(db_media)
    db.commit()
    db.refresh(db_media)

    # 6. Build response
    return {
        "success": True,
        "data": MediaFileResponse(
            id=db_media.id,
            filename=db_media.filename,
            filepath=db_media.filepath,
            mimetype=db_media.mimetype,
            size_bytes=db_media.size_bytes,
            access_level=db_media.access_level,
            url=f"/uploads/{unique_filename}"
        ),
        "meta": {},
        "error": None
    }

@router.get("", response_model=None)
def list_media_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(PermissionChecker("ai.cms.generate"))
):
    """
    List metadata of all uploaded assets.
    """
    media_files = db.query(MediaFile).order_by(MediaFile.created_at.desc()).all()
    
    result = []
    for m in media_files:
        result.append(
            MediaFileResponse(
                id=m.id,
                filename=m.filename,
                filepath=m.filepath,
                mimetype=m.mimetype,
                size_bytes=m.size_bytes,
                access_level=m.access_level,
                url=f"/uploads/{m.filepath}"
            )
        )

    return {
        "success": True,
        "data": result,
        "meta": {"count": len(result)},
        "error": None
    }
