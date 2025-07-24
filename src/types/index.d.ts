export interface PartnerInvitation {
  id: string; // UUID
  receiver_email: string;
  status: 'pending' | 'accepted' | 'rejected' | 'revoked' | 'expired';
  created_at: string; // ISO 8601 date string
  expires_at: string; // ISO 8601 date string
  sender?: { // Sender is optional as it's only present on received invitations
    id: string;
    email: string;
  };
}

export interface User {
  id: string; // UUID
  email: string;
  is_active: boolean;
  partnership_status: 'not_partnered' | 'partnered';
  sent_invitation: PartnerInvitation | null;
  received_invitation: PartnerInvitation | null;
}

export interface AuthData {
    isAuthenticated: boolean;
    user: User | null;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}
