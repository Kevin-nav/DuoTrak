export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

export const assertNotSelfInvite = (senderEmail: string, receiverEmail: string): void => {
  if (normalizeEmail(senderEmail) === normalizeEmail(receiverEmail)) {
    throw new Error("You cannot invite yourself.");
  }
};

export const assertInvitationReceiverMatch = (
  loggedInUserEmail: string,
  invitationReceiverEmail: string
): void => {
  if (normalizeEmail(loggedInUserEmail) !== normalizeEmail(invitationReceiverEmail)) {
    throw new Error("This invitation is for a different email address.");
  }
};
