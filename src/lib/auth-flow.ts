import { User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { persistentLog } from '@/lib/logger';
import { toast } from 'sonner';
import { UserDetails } from '@/contexts/UserContext';

/**
 * Handles the post-authentication flow by sending the Firebase ID token to the backend
 * to verify the user, create a session, and synchronize the user profile.
 * @param user The Firebase user object.
 * @param invitationToken Optional token if the user is accepting an invitation.
 * @param name Optional full name, typically provided during sign-up.
 * @returns The full user details from the backend.
 */
export const handleAuthSuccess = async (
  user: FirebaseUser,
  invitationToken: string | null = null,
  name?: string
): Promise<UserDetails> => {
  persistentLog('1. Starting Post-Auth Flow');
  try {
    persistentLog('2. Getting Firebase ID Token');
    const idToken = await user.getIdToken();
    persistentLog('2. Received Firebase ID Token');

    persistentLog('3. Sending Token to Backend for Verification/Sync');
    const response = await fetch(`/api/v1/auth/verify-and-sync-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ 
        full_name: name, // name is optional
        invitation_token: invitationToken 
      }),
    });
    persistentLog('4. Received Backend Verification/Sync Response', { status: response.status });

    if (!response.ok) {
      const errorData = await response.json();
      persistentLog('4. Backend Verification/Sync Failed', { error: errorData });
      // It's better to let the caller handle sign-out
      throw new Error(errorData.detail || 'Backend sync failed.');
    }
    
    const responseData = await response.json();
    persistentLog('4. Backend Verification/Sync and Session Cookie Creation Successful');

    if (invitationToken) {
      persistentLog('7. Invitation token was present. Assuming success.');
      toast.success("Invitation accepted! Welcome to the partnership.");
    }

    persistentLog('8. Auth flow complete. Returning user details.');
    return responseData.user;

  } catch (error: any) {
    persistentLog('!!! Post-Auth Flow FAILED !!!', { 
      errorMessage: error.message, 
      errorStack: error.stack 
    });
    // Re-throw the error so the calling function can handle it (e.g., sign out user)
    throw error;
  }
};
