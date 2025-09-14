"""Service for sending emails using Resend."""
from typing import Optional
import logging

import resend
from fastapi import HTTPException, status

from app.core.config import settings
from app.db.models.user import User
from .email_templates import (
    get_partner_invitation_email,
    get_invitation_accepted_email,
    get_invitation_rejected_email,
    get_nudge_email,
)

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Resend client
resend.api_key = settings.RESEND_API_KEY

class EmailService:
    """Service for sending emails using Resend."""

    @classmethod
    def _send_email(
        cls,
        to: str | list[str],
        subject: str,
        html: str,
        from_email: Optional[str] = None,
    ) -> dict:
        """
        Send an email using Resend.
        
        Args:
            to: Email recipient(s)
            subject: Email subject
            html: Email content in HTML format
            from_email: Sender email address (default: settings.DEFAULT_FROM_EMAIL)
            
        Returns:
            Response from Resend API
            
        Raises:
            HTTPException: If there's an error sending the email
        """
        if from_email is None:
            from_email = f"DuoTrak <{settings.DEFAULT_FROM_EMAIL}>"
        
        try:
            response = resend.Emails.send({
                "from": from_email,
                "to": to,
                "subject": subject,
                "html": html,
            })
            logger.info(f"Email sent successfully to {to}")
            return response
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send email: {str(e)}"
            )

    @classmethod
    def send_partner_invitation(
        cls,
        sender: User,
        receiver_email: str,
        invitation_token: str,
        receiver_name: Optional[str] = None,
        expires_in_days: int = 7,
    ) -> dict:
        """
        Send a partner invitation email.
        
        Args:
            sender: The user sending the invitation
            receiver_email: Email address of the recipient
            invitation_token: The invitation token
            receiver_name: Optional name of the recipient
            expires_in_days: Number of days until the invitation expires
            
        Returns:
            Response from Resend API
        """
        if receiver_name is None:
            receiver_name = receiver_email.split('@')[0]
        
        # Generate the acceptance URL
        accept_url = f"{settings.CLIENT_ORIGIN_URL}/invite-acceptance?token={invitation_token}"
        
        # Get the email content from templates
        subject, html_content = get_partner_invitation_email(
            sender_name=sender.full_name or sender.email.split('@')[0],
            receiver_name=receiver_name,
            accept_url=accept_url,
        )
        
        # Send the email
        return cls._send_email(
            to=receiver_email,
            subject=subject,
            html=html_content,
        )

    @classmethod
    def send_invitation_accepted(
        cls,
        sender: User,
        receiver: User,
    ) -> dict:
        """
        Send a notification email when an invitation is accepted.
        
        Args:
            sender: The user who sent the invitation
            receiver: The user who accepted the invitation
            
        Returns:
            Response from Resend API
        """
        # Generate the dashboard URL
        dashboard_url = f"{settings.CLIENT_ORIGIN_URL}/dashboard"
        
        # Get the email content from templates
        subject, html_content = get_invitation_accepted_email(
            receiver_name=sender.full_name or sender.email.split('@')[0],
            partner_name=receiver.full_name or receiver.email.split('@')[0],
            dashboard_url=dashboard_url,
        )
        
        # Send the email
        return cls._send_email(
            to=sender.email,
            subject=subject,
            html=html_content,
        )

    @classmethod
    def send_invitation_rejected(
        cls,
        sender: User,
        rejected_by: User,
    ) -> dict:
        """
        Send a notification email when an invitation is rejected.
        
        Args:
            sender: The user who sent the invitation
            rejected_by: The user who rejected the invitation
            
        Returns:
            Response from Resend API
        """
        # Get the email content from templates
        subject, html_content = get_invitation_rejected_email(
            sender_name=sender.full_name or sender.email.split('@')[0],
            rejected_by_name=rejected_by.full_name or rejected_by.email.split('@')[0],
        )
        
        # Send the email
        return cls._send_email(
            to=sender.email,
            subject=subject,
            html=html_content,
        )

    @classmethod
    def send_nudge_email(
        cls,
        sender: User,
        receiver_email: str,
        invitation_token: str,
        receiver_name: Optional[str] = None,
    ) -> dict:
        """
        Send a nudge (reminder) email for a pending invitation.
        
        Args:
            sender: The user who sent the invitation
            receiver_email: Email address of the recipient
            invitation_token: The invitation token
            receiver_name: Optional name of the recipient
            
        Returns:
            Response from Resend API
        """
        if receiver_name is None:
            receiver_name = receiver_email.split('@')[0]
        
        accept_url = f"{settings.CLIENT_ORIGIN_URL}/invite/{invitation_token}"
        
        subject, html_content = get_nudge_email(
            sender_name=sender.full_name or sender.email.split('@')[0],
            receiver_name=receiver_name,
            accept_url=accept_url,
        )
        
        return cls._send_email(
            to=receiver_email,
            subject=subject,
            html=html_content,
        )
