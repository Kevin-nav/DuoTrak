export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";

export const isInvitationActive = (status: InvitationStatus): boolean =>
  status === "pending";
