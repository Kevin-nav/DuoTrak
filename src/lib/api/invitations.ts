import { apiFetch } from './core';

interface SendInvitationPayload {
  receiver_name: string;
  receiver_email: string;
  expires_in_days?: number; // Optional, defaults to 7 on backend
}

export const sendInvitation = (payload: SendInvitationPayload) => {
  return apiFetch('/api/v1/partner-invitations/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const withdrawInvitation = (invitationId: string) => {
  return apiFetch(`/api/v1/partner-invitations/invitations/${invitationId}`, {
    method: 'DELETE',
  });
};

export const acceptInvitation = (invitationId: string) => {
  return apiFetch(`/api/v1/partner-invitations/accept`, {
    method: 'POST',
    body: JSON.stringify({ invitation_id: invitationId }),
  });
};

export const declineInvitation = (invitationId: string) => {
  return apiFetch(`/api/v1/partner-invitations/reject`, {
    method: 'POST',
    body: JSON.stringify({ invitation_id: invitationId }),
  });
};
