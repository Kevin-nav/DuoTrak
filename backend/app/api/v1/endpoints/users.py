from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app import schemas
from app.db.session import get_db
from app.core.security import get_current_active_user
from app.db import models
from app.services.storage_service import storage_service
from app.core.limiter import limiter

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/me", response_model=schemas.UserRead)
@limiter.limit("20/minute")
async def read_users_me(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get current user's full profile including partnership and invitation status.
    """
    logger.info(f"--- Fetching /me for user_id: {current_user.id} ---")
    logger.info(f"User partnership_status from DB: {current_user.partnership_status}")
    logger.info(f"User current_partner_id from DB: {current_user.current_partner_id}")
    # Initialize partner details as None
    partner_id = None
    partner_full_name = None
    partnership_id = None

    # If the user is in an active partnership, fetch the partner's details
    if current_user.partnership_status == schemas.PartnershipStatus.ACTIVE and current_user.current_partner_id:
        partner_stmt = select(models.User).where(models.User.id == current_user.current_partner_id)
        partner_result = await db.execute(partner_stmt)
        partner = partner_result.scalars().first()
        if partner:
            partner_id = partner.id
            partner_full_name = partner.full_name

        # Also fetch the partnership ID
        partnership_stmt = select(models.Partnership).where(
            ((models.Partnership.user1_id == current_user.id) & (models.Partnership.user2_id == partner_id)) |
            ((models.Partnership.user2_id == current_user.id) & (models.Partnership.user1_id == partner_id))
        )
        partnership_result = await db.execute(partnership_stmt)
        partnership = partnership_result.scalars().first()
        if partnership:
            partnership_id = partnership.id

    # Query for sent invitation
    sent_stmt = select(models.PartnerInvitation).where(
        models.PartnerInvitation.sender_id == current_user.id,
        models.PartnerInvitation.status == 'pending'
    ).options(selectinload(models.PartnerInvitation.receiver))
    sent_result = await db.execute(sent_stmt)
    sent_invitation = sent_result.scalars().first()

    # Query for received invitation
    received_stmt = select(models.PartnerInvitation).where(
        models.PartnerInvitation.receiver_email.ilike(current_user.email),
        models.PartnerInvitation.status == 'pending'
    ).options(selectinload(models.PartnerInvitation.sender))
    received_result = await db.execute(received_stmt)
    received_invitation = received_result.scalars().first()

    # Query for user with badges
    user_query = select(models.User).options(
        selectinload(models.User.user_badges).selectinload(models.UserBadge.badge)
    ).where(models.User.id == current_user.id)
    user_with_badges = (await db.execute(user_query)).scalars().first()

    if not user_with_badges:
        raise HTTPException(status_code=404, detail="User not found")

    # Construct the final response model
    return schemas.UserRead(
        id=user_with_badges.id,
        email=user_with_badges.email,
        full_name=user_with_badges.full_name,
        onboarding_complete=user_with_badges.onboarding_complete,
        partnership_status=user_with_badges.partnership_status,
        partner_id=partner_id,
        partner_full_name=partner_full_name,
        partnership_id=partnership_id,
        sent_invitation=sent_invitation,
        received_invitation=received_invitation,
        bio=user_with_badges.bio,
        profile_picture_url=user_with_badges.profile_picture_url,
        timezone=user_with_badges.timezone,
        notifications_enabled=user_with_badges.notifications_enabled,
        current_streak=user_with_badges.current_streak,
        longest_streak=user_with_badges.longest_streak,
        total_tasks_completed=user_with_badges.total_tasks_completed,
        goals_conquered=user_with_badges.goals_conquered,
        badges=user_with_badges.user_badges
    )

@router.put("/me", response_model=schemas.UserRead)
@limiter.limit("10/minute")
async def update_users_me(
    request: Request,
    user_update: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Update current user's profile information.
    """
    logger.info(f"--- Updating /me for user_id: {current_user.id} ---")

    # Update user fields from the UserUpdate schema
    for field, value in user_update.dict(exclude_unset=True).items():
        setattr(current_user, field, value)

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    # Re-fetch with relationships for the response
    user_query = select(models.User).options(
        selectinload(models.User.user_badges).selectinload(models.UserBadge.badge)
    ).where(models.User.id == current_user.id)
    user_with_badges = (await db.execute(user_query)).scalars().first()

    if not user_with_badges:
        raise HTTPException(status_code=404, detail="User not found after update")

    # Initialize partner details as None (similar to read_users_me)
    partner_id = None
    partner_full_name = None
    partnership_id = None

    if user_with_badges.partnership_status == schemas.PartnershipStatus.ACTIVE and user_with_badges.current_partner_id:
        partner_stmt = select(models.User).where(models.User.id == user_with_badges.current_partner_id)
        partner_result = await db.execute(partner_stmt)
        partner = partner_result.scalars().first()
        if partner:
            partner_id = partner.id
            partner_full_name = partner.full_name

        partnership_stmt = select(models.Partnership).where(
            ((models.Partnership.user1_id == user_with_badges.id) & (models.Partnership.user2_id == partner_id)) |
            ((models.Partnership.user2_id == user_with_badges.id) & (models.Partnership.user1_id == partner_id))
        )
        partnership_result = await db.execute(partnership_stmt)
        partnership = partnership_result.scalars().first()
        if partnership:
            partnership_id = partnership.id

    # Query for sent invitation
    sent_stmt = select(models.PartnerInvitation).where(
        models.PartnerInvitation.sender_id == user_with_badges.id,
        models.PartnerInvitation.status == 'pending'
    ).options(selectinload(models.PartnerInvitation.receiver))
    sent_result = await db.execute(sent_stmt)
    sent_invitation = sent_result.scalars().first()

    # Query for received invitation
    received_stmt = select(models.PartnerInvitation).where(
        models.PartnerInvitation.receiver_email.ilike(user_with_badges.email),
        models.PartnerInvitation.status == 'pending'
    ).options(selectinload(models.PartnerInvitation.sender))
    received_result = await db.execute(received_stmt)
    received_invitation = received_result.scalars().first()

    return schemas.UserRead(
        id=user_with_badges.id,
        email=user_with_badges.email,
        full_name=user_with_badges.full_name,
        onboarding_complete=user_with_badges.onboarding_complete,
        partnership_status=user_with_badges.partnership_status,
        partner_id=partner_id,
        partner_full_name=partner_full_name,
        partnership_id=partnership_id,
        sent_invitation=sent_invitation,
        received_invitation=received_invitation,
        bio=user_with_badges.bio,
        profile_picture_url=user_with_badges.profile_picture_url,
        timezone=user_with_badges.timezone,
        notifications_enabled=user_with_badges.notifications_enabled,
        current_streak=user_with_badges.current_streak,
        longest_streak=user_with_badges.longest_streak,
        total_tasks_completed=user_with_badges.total_tasks_completed,
        goals_conquered=user_with_badges.goals_conquered,
        badges=user_with_badges.user_badges
    )


@router.post("/me/profile-picture", response_model=schemas.UserRead)
@limiter.limit("5/minute")
async def upload_profile_picture(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Upload a new profile picture for the current user.
    """
    logger.info(f"--- Uploading profile picture for user_id: {current_user.id} ---")
    
    # Read the file contents
    contents = await file.read()
    
    try:
        # Upload to Supabase Storage
        public_url = await storage_service.upload_avatar(
            file_contents=contents,
            file_name=file.filename,
            user_id=current_user.id
        )
        
        # Update the user's profile_picture_url in the database
        current_user.profile_picture_url = public_url
        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)
        
        logger.info(f"Successfully updated profile picture URL for user {current_user.id} to {public_url}")
        
        # Return the full, updated user profile by calling the existing 'read_users_me' logic
        return await read_users_me(db=db, current_user=current_user)

    except Exception as e:
        logger.error(f"Failed to upload profile picture for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while uploading the profile picture."
        )


@router.delete("/me/profile-picture", response_model=schemas.UserRead)
@limiter.limit("5/minute")
async def remove_profile_picture(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    """
    Remove the current user's profile picture.
    """
    logger.info(f"--- Removing profile picture for user_id: {current_user.id} ---")
    
    try:
        # Remove the avatar from Supabase Storage
        await storage_service.remove_avatar(user_id=current_user.id)
        
        # Set the user's profile_picture_url to null in the database
        current_user.profile_picture_url = None
        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)
        
        logger.info(f"Successfully removed profile picture for user {current_user.id}")
        
        # Return the full, updated user profile
        return await read_users_me(db=db, current_user=current_user)

    except Exception as e:
        logger.error(f"Failed to remove profile picture for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while removing the profile picture."
        )

