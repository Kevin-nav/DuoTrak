"""Service for handling partner invitation operations."""

import uuid

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple
import logging

from fastapi import HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas
from app.db import models
from app.db.models.partner_invitation import PartnerInvitation as PartnerInvitationModel
from app.core.config import settings
from app.db.models.user import User
from .email_service import EmailService

# Configure logging
logger = logging.getLogger(__name__)


class PartnerInvitationService:
    """Service class for partner invitation operations."""

    def __init__(self, db: AsyncSession):
        """Initialize with database session."""
        self.db = db

    async def _get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email."""
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def _get_invitation_by_token(
        self, 
        token: str,
        include_expired: bool = False
    ) -> Optional[PartnerInvitationModel]:
        """Get an invitation by its token."""
        try:
            invitation_uuid = uuid.UUID(token)
        except ValueError:
            return None
            
        stmt = select(PartnerInvitationModel).where(PartnerInvitationModel.invitation_token == invitation_uuid)
        result = await self.db.execute(stmt)
        invitation = result.scalars().first()

        if not invitation or (not include_expired and invitation.is_expired):
            return None
            
        return invitation

    async def create_invitation(
        self, 
        sender: User, 
        invitation_in: schemas.PartnerInvitationCreate
    ) -> PartnerInvitationModel:
        """Create a new partner invitation.
        
        Args:
            sender: The user sending the invitation
            invitation_in: The invitation data
            
        Returns:
            The created invitation
            
        Raises:
            HTTPException: If the invitation cannot be created
        """
        # Rule 1: Cannot invite yourself
        logger.info(f"Rule 1: Checking if sender '{sender.email}' is inviting themselves.")
        if sender.email.lower() == invitation_in.receiver_email.lower():
            logger.warning(f"User '{sender.email}' attempted to invite themselves.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot send an invitation to yourself."
            )

        # Rule 2: Cannot invite if you already have a partner
        logger.info(f"Rule 2: Checking if sender '{sender.email}' already has a partner.")
        if sender.current_partner_id:
            logger.warning(f"User '{sender.email}' attempted to invite while already having a partner.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a partner and cannot send new invitations."
            )

        # Rule 3: Cannot send a new invitation if an active one already exists
        stmt = (
            select(PartnerInvitationModel)
            .where(
                PartnerInvitationModel.sender_id == sender.id,
                PartnerInvitationModel.receiver_email.ilike(invitation_in.receiver_email),
                PartnerInvitationModel.status == 'pending'
            )
        )
        result = await self.db.execute(stmt)
        existing_invitation = result.scalars().first()

        logger.info(f"Rule 3: Checking for existing pending invitations from '{sender.email}' to '{invitation_in.receiver_email}'.")
        if existing_invitation and not existing_invitation.is_expired:
            logger.warning(
                f"User '{sender.email}' attempted to send a duplicate invitation to '{invitation_in.receiver_email}'."
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A pending invitation to this user already exists. Please revoke the previous invitation to send a new one."
            )

        # Create the new invitation object
        invitation = PartnerInvitationModel(
            sender_id=sender.id,
            receiver_name=invitation_in.receiver_name,
            receiver_email=invitation_in.receiver_email,
            expires_at=datetime.now(timezone.utc) + timedelta(days=invitation_in.expires_in_days),
        )
        logger.info(f"All validation passed. Creating invitation object for '{invitation.receiver_email}'.")

        # --- Database Transaction ---
        try:
            logger.info("Adding invitation to the database session.")
            self.db.add(invitation)
            await self.db.commit()
            await self.db.refresh(invitation)
            logger.info(f"Successfully committed invitation {invitation.id} to the database.")
        except Exception as e:
            # THIS IS THE MOST IMPORTANT LOG. IT WILL SHOW THE ROOT CAUSE.
            logger.critical(
                f"CRITICAL: Database transaction failed while creating invitation for '{invitation.receiver_email}'. ROLLING BACK.",
                exc_info=True  # This prints the full stack trace
            )
            await self.db.rollback()
            # Re-raise a generic error to the user
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="A critical error occurred while saving the invitation."
            ) from e

        try:
            email_service = EmailService()
            email_service.send_partner_invitation(
                sender=sender,
                receiver_email=invitation_in.receiver_email,
                receiver_name=invitation_in.receiver_name,
                invitation_token=str(invitation.invitation_token),
                expires_in_days=7
            )
            logger.info(f"Invitation email sent to {invitation.receiver_email}")
        except Exception as e:
            # Log email failure but do not fail the request, as the invitation is already in the DB
            logger.error(
                f"Invitation {invitation.id} created, but failed to send email notification: {str(e)}",
                exc_info=True
            )

        return invitation

    async def get_invitation_by_token(
        self, 
        token: str,
        include_expired: bool = False
    ) -> Optional[PartnerInvitationModel]:
        """Get an invitation by its token.
        
        Args:
            token: The invitation token
            include_expired: Whether to include expired invitations
            
        Returns:
            The invitation if found, None otherwise
        """
        return await self._get_invitation_by_token(token, include_expired)

    async def get_user_invitations(
        self,
        user: User,
        status_filter: Optional[schemas.InvitationStatus] = None,
        limit: int = 100,
        skip: int = 0
    ) -> Tuple[List[PartnerInvitationModel], int]:
        """Get all invitations for a user.
        
        Args:
            user: The user to get invitations for
            status_filter: Optional status filter
            limit: Maximum number of invitations to return
            skip: Number of invitations to skip
            
        Returns:
            A tuple of (invitations, total_count)
        """
        # Base query for filtering invitations
        base_query = select(PartnerInvitationModel).where(
            (PartnerInvitationModel.sender_id == user.id) | 
            (PartnerInvitationModel.receiver_email.ilike(user.email))
        )
        
        if status_filter:
            base_query = base_query.where(PartnerInvitationModel.status == status_filter)

        # Query for the total count
        count_stmt = select(func.count()).select_from(base_query.subquery())
        total_result = await self.db.execute(count_stmt)
        total_count = total_result.scalar_one()

        # Query for the paginated invitations
        invitations_stmt = base_query.order_by(PartnerInvitationModel.created_at.desc()).offset(skip).limit(limit)
        invitations_result = await self.db.execute(invitations_stmt)
        invitations = invitations_result.scalars().all()
        
        return invitations, total_count

    async def respond_to_invitation(
        self,
        invitation_id: uuid.UUID,
        user: User,
        accept: bool
    ) -> PartnerInvitationModel:
        """Respond to a partner invitation.
        
        Args:
            invitation_id: The ID of the invitation to respond to
            user: The user responding to the invitation
            accept: Whether to accept or reject the invitation
            
        Returns:
            The updated invitation
            
        Raises:
            HTTPException: If the invitation is not found or cannot be responded to
        """
        # Get the invitation
        stmt = (
            select(PartnerInvitationModel)
            .where(
                PartnerInvitationModel.id == invitation_id,
                PartnerInvitationModel.receiver_email.ilike(user.email),
                PartnerInvitationModel.status == schemas.InvitationStatus.PENDING
            )
        )
        result = await self.db.execute(stmt)
        invitation = result.scalars().first()
        
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found or already responded to"
            )
        
        # Check if the invitation has expired
        if invitation.is_expired:
            invitation.status = schemas.InvitationStatus.EXPIRED
            await self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation has expired"
            )
        
        sender = await self.db.get(User, invitation.sender_id)
        if not sender:
            # This should be rare, but could happen if the sender deletes their account.
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The user who sent this invitation no longer exists."
            )

        if accept:
            # --- Final validation before creating partnership ---
            if user.current_partner_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You are already in a partnership."
                )
            
            if sender.current_partner_id:
                # Mark the invitation as void since it can't be accepted.
                invitation.status = schemas.InvitationStatus.EXPIRED
                await self.db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The sender is already in a partnership with someone else."
                )

        try:
            if accept:
                # Accept the invitation
                invitation.accept()

                # Enforce user1_id < user2_id constraint
                u1_id, u2_id = sorted([sender.id, user.id])

                # Create the Partnership record
                new_partnership = models.Partnership(
                    user1_id=u1_id,
                    user2_id=u2_id,
                    status=schemas.PartnershipStatus.ACTIVE,
                    start_date=datetime.now(timezone.utc)
                )
                self.db.add(new_partnership)
                await self.db.flush() # Flush to get the new_partnership.id

                # Update the sender's partner link by assigning the other user's ID
                sender.current_partner_id = user.id
                sender.partnership_status = schemas.PartnershipStatus.ACTIVE

                # Update the user who accepted the invitation
                user.current_partner_id = sender.id
                user.partnership_status = schemas.PartnershipStatus.ACTIVE
                user.onboarding_complete = True
                sender.onboarding_complete = True
                
                # Update the invitation
                invitation.accepted_at = datetime.now(timezone.utc)
                invitation.status = schemas.InvitationStatus.ACCEPTED
                self.db.add(invitation)
            else:
                # Reject the invitation
                invitation.reject()
            
            await self.db.commit()

        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error during partnership finalization: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="An unexpected error occurred while finalizing the partnership.")

        # Refresh all related objects outside the transaction block
        # to ensure we get the latest state from the database.
        await self.db.refresh(invitation)
        if accept:
            await self.db.refresh(sender)
            await self.db.refresh(user)
            
            # --- Send notification email ---
            try:
                email_service = EmailService()
                email_service.send_invitation_accepted(sender=sender, receiver=user)
                logger.info(f"Sent invitation acceptance notification to {sender.email}")
            except Exception as e:
                logger.error(
                    f"Failed to send invitation acceptance email to {sender.email} for invitation {invitation.id}",
                    exc_info=True
                )
        else:
            # --- Send notification email for rejection ---
            try:
                email_service = EmailService()
                email_service.send_invitation_rejected(sender=sender, rejected_by=user)
                logger.info(f"Sent invitation rejection notification to {sender.email}")
            except Exception as e:
                logger.error(
                    f"Failed to send invitation rejection email to {sender.email} for invitation {invitation.id}",
                    exc_info=True
                )

        return invitation

    async def revoke_invitation(
        self,
        invitation_id: uuid.UUID,
        user: User
    ) -> PartnerInvitationModel:
        """Revoke a sent invitation with detailed validation.
        
        Args:
            invitation_id: The ID of the invitation to revoke
            user: The user revoking the invitation
            
        Returns:
            The updated invitation
            
        Raises:
            HTTPException: If the invitation is not found or cannot be revoked
        """
        # Step 1: Find the invitation by ID
        invitation = await self.db.get(PartnerInvitationModel, invitation_id)
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found."
            )

        # Step 2: Check if the current user is the sender
        if invitation.sender_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to revoke this invitation."
            )

        # Step 3: Check if the invitation is still pending
        if invitation.status != schemas.InvitationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This invitation cannot be revoked because its status is '{invitation.status.value}'."
            )
        
        # All checks passed, proceed with revocation
        invitation.revoke()
        
        await self.db.commit()
        await self.db.refresh(invitation)
        
        return invitation

async def accept_invitation(db: AsyncSession, invitation_id_str: str, user: User) -> User:
    """
    Accepts a partner invitation using the invitation token string.

    This is a convenience function that wraps the PartnerInvitationService
    to find an invitation by its token and then accept it.

    Args:
        db: The database session.
        invitation_id_str: The string representation of the invitation token (UUID).
        user: The user accepting the invitation.

    Returns:
        The updated user object after accepting the invitation.

    Raises:
        HTTPException: If the invitation is not found, invalid, or expired.
    """
    service = PartnerInvitationService(db)
    
    # Step 1: Find the invitation by its token string.
    # The service method handles the string-to-UUID conversion and checks for expiration.
    invitation = await service.get_invitation_by_token(token=invitation_id_str)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found, is invalid, or has expired."
        )

    # Step 2: Call the respond_to_invitation method to perform the acceptance logic.
    # This method will handle creating the partnership and updating user statuses.
    await service.respond_to_invitation(
        invitation_id=invitation.id,
        user=user,
        accept=True
    )
    
    # The user object is modified within the session by respond_to_invitation.
    # We refresh it here to ensure the caller gets the most up-to-date state.
    # Refresh the user object and eagerly load related badges and all columns
    await db.refresh(user, attribute_names=[
        "user_badges",
        "id", "firebase_uid", "email", "full_name", "onboarding_complete",
        "partnership_status", "bio", "profile_picture_url", "timezone",
        "notifications_enabled", "current_streak", "longest_streak",
        "total_tasks_completed", "goals_conquered", "current_partner_id",
        "created_at", "updated_at"
    ])
    
    return user
