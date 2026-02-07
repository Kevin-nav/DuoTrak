// src/app/(app)/pending-acceptance/page.tsx
"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Loader2, AlertCircle, PartyPopper } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userDetails, isLoading: isUserLoading } = useUser();
  const token = searchParams.get('token');

  // Use Convex query for invitation details
  const invitationResult = useQuery(
    api.invitations.getByToken,
    token ? { token } : 'skip'
  );

  // Use Convex mutation for accepting invitation
  const acceptInvitationMutation = useMutation(api.invitations.accept);

  const handleAccept = async () => {
    if (!token) return;

    if (!userDetails && !isUserLoading) {
      // Not logged in, redirect to login with token
      router.push(`/login?token=${token}`);
      return;
    }

    try {
      await acceptInvitationMutation({ token });
      toast.success("Invitation accepted! You are now partners.");

      // Clean up localStorage
      localStorage.removeItem('duotrak-partner-info');
      localStorage.removeItem('duotrak-goal-drafts');
      localStorage.removeItem('duotrak-invitation-token');

      router.push('/dashboard');
    } catch (err: any) {
      if (err.message?.includes('already have a partner')) {
        toast.info('You are already in a partnership. Redirecting to dashboard...');
        router.push('/dashboard');
        return;
      }
      toast.error(err.message || "Failed to accept invitation.");
    }
  };

  // Loading states
  if (isUserLoading || invitationResult === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
      </div>
    );
  }

  // Error: No token
  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <CardTitle>Invalid Link</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-stone-gray mb-4">
              Invitation token is missing. Please check the link and try again.
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error: Invalid/expired invitation
  if (invitationResult.error) {
    const errorMessages: Record<string, string> = {
      INVITATION_NOT_FOUND: 'This invitation link is invalid. Please ask your partner to send a new one.',
      INVITATION_EXPIRED: 'This invitation has expired. Please ask your partner to send a new one.',
      INVITATION_ALREADY_USED: 'This invitation has already been accepted.',
    };

    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <CardTitle>Invitation Problem</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-stone-gray mb-4">
              {errorMessages[invitationResult.error] || 'Unknown error occurred.'}
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const invitation = invitationResult.invitation;
  if (!invitation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardContent className="p-6">
            <p>Could not load invitation details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PartyPopper className="w-12 h-12 text-primary-blue" />
          </div>
          <CardTitle className="text-2xl">You're Invited!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Avatar className="w-12 h-12">
              <AvatarImage src={invitation.senderProfilePictureUrl} alt={invitation.senderName} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                {getInitials(invitation.senderName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{invitation.senderName}</p>
              <p className="text-sm text-stone-gray">wants to partner with you</p>
            </div>
          </div>

          {invitation.customMessage && (
            <blockquote className="p-4 bg-blue-50 border-l-4 border-blue-300 text-gray-700 italic rounded-r">
              "{invitation.customMessage}"
            </blockquote>
          )}

          <Button onClick={handleAccept} className="w-full" size="lg">
            Accept Invitation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
}