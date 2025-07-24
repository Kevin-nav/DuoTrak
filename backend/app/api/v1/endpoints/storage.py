
from fastapi import APIRouter, Depends, UploadFile, File, Request
from sqlalchemy.orm import Session
from app import schemas
from app.api.v1 import deps
from app.services.user_service import user_service
from app.services.storage_service import storage_service
from app.schemas.user import UserUpdate
from app.core.limiter import limiter

router = APIRouter()

@router.post("/upload-profile-picture", response_model=schemas.UserRead)
@limiter.limit("5/minute")
async def upload_profile_picture(
    *, 
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: schemas.UserRead = Depends(deps.get_current_user),
    file: UploadFile = File(...)
):
    public_url = await storage_service.upload_file(
        bucket_name="avatars",
        file=file,
        user_id=str(current_user.id)
    )
    
    updated_user = await user_service.update_user(
        db=db,
        user_id=current_user.id,
        user_in=schemas.UserUpdate(profile_picture_url=public_url)
    )
    
    return updated_user
