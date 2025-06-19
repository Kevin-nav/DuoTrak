import uuid
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.partnership_repository import partnership_repo
from app.repositories.user_repository import user_repo
from app.db.models.partnership import Partnership
from app.api.v1.schemas.partnership import PartnershipInvite, PartnershipUpdate
from app.services.user_service import user_service

class PartnershipService:
    async def create_invitation(self, db: AsyncSession, *, inviter_user_id: uuid.UUID, invite_data: PartnershipInvite) -> Partnership:
        """
        Creates a partnership invitation from an inviter to an invitee.
        """
        # Ensure the invitee exists
        invitee = await user_repo.get_by_email(db, email=invite_data.invitee_email)
        if not invitee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitee with that email not found. The user must have a DuoTrak account first."
            )

        # Prevent users from inviting themselves
        if inviter_user_id == invitee.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot create a partnership with yourself.")

        # Check for existing or pending partnerships
        existing_partnership = await partnership_repo.get_by_users(db, user1_id=inviter_user_id, user2_id=invitee.id)
        if existing_partnership:
            if existing_partnership.status == 'accepted':
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already partnered with this user.")
            elif existing_partnership.status == 'pending':
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An invitation is already pending with this user.")

        # Create the new partnership invitation
        new_partnership = await partnership_repo.create(db, obj_in={
            "user1_id": inviter_user_id,
            "user2_id": invitee.id,
            "inviter_id": inviter_user_id,
            "status": "pending",
        })

        # TODO: Here you would trigger an email to the invitee
        # For example: await email_service.send_partnership_invitation(invitee.email)

        return new_partnership

    async def respond_to_invitation(self, db: AsyncSession, *, partnership_id: uuid.UUID, responding_user_id: uuid.UUID, response_data: PartnershipUpdate) -> Partnership:
        """
        Allows a user to accept or reject a pending partnership invitation.
        """
        partnership = await partnership_repo.get(db, id=partnership_id)

        if not partnership:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partnership invitation not found.")

        # Verify the user responding is the invitee
        if partnership.user2_id != responding_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized to respond to this invitation.")

        # Verify the invitation is still pending
        if partnership.status != 'pending':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"This invitation is no longer pending. It is currently {partnership.status}.")

        # Update the partnership status
        updated_partnership = await partnership_repo.update(db, db_obj=partnership, obj_in=response_data)

        # TODO: Here you would trigger a notification email to the inviter
        # For example: await email_service.send_partnership_response(inviter.email, status=response_data.status)

        return updated_partnership

partnership_service = PartnershipService()
