'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import FlowShell from '@/components/flow/FlowShell';
import FlowStatusCard from '@/components/flow/FlowStatusCard';

function InviteAcceptanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const invitationResult = useQuery(api.invitations.getByToken, token ? { token } : 'skip');
  const userStatusResult = useQuery(
    api.users.checkStatusByEmail,
    invitationResult?.invitation?.receiverEmail ? { email: invitationResult.invitation.receiverEmail } : 'skip'
  );
  const markAsViewedMutation = useMutation(api.invitations.markAsViewed);

  useEffect(() => {
    if (token && invitationResult?.invitation) {
      markAsViewedMutation({ token }).catch((e) => {
        console.error('Failed to mark invitation as viewed:', e);
      });
    }
  }, [token, invitationResult?.invitation, markAsViewedMutation]);

  if (!token) {
    return (
      <FlowShell stepLabel="Invitation" title="Missing invitation token" subtitle="Please check your invitation URL and try again." progress={65}>
        <FlowStatusCard tone="warning" title="Token missing" description="No invitation token was found in this link." />
      </FlowShell>
    );
  }

  if (invitationResult === undefined) {
    return (
      <FlowShell stepLabel="Invitation" title="Checking invitation" subtitle="Verifying your invitation details..." progress={65}>
        <FlowStatusCard tone="loading" title="Verifying invitation" description="Please wait a moment." />
      </FlowShell>
    );
  }

  if (invitationResult.error) {
    const errorMessages: Record<string, string> = {
      INVITATION_NOT_FOUND: 'This invitation link is invalid. Please ask your partner to send a new one.',
      INVITATION_EXPIRED: 'This invitation has expired. Please ask your partner to send a new one.',
      INVITATION_ALREADY_USED: 'This invitation has already been accepted.',
    };
    return (
      <FlowShell stepLabel="Invitation" title="Invitation problem" subtitle="We could not continue with this invitation." progress={65}>
        <FlowStatusCard
          tone="warning"
          title="Unable to continue"
          description={errorMessages[invitationResult.error] || 'Unknown error occurred.'}
          actions={
            <Button onClick={() => (window.location.href = '/')} variant="outline" className="border-landing-clay">
              Go to Homepage
            </Button>
          }
        />
      </FlowShell>
    );
  }

  const invitation = invitationResult.invitation;
  if (!invitation) {
    return (
      <FlowShell stepLabel="Invitation" title="Invitation unavailable" subtitle="Could not load invitation details." progress={65}>
        <FlowStatusCard tone="warning" title="No details available" description="Please retry from the original invitation link." />
      </FlowShell>
    );
  }

  const handleAccept = () => {
    if (userStatusResult?.user_exists) {
      if (userStatusResult.partnership_status === 'no_partner') {
        router.push(`/login?token=${token}`);
      } else {
        toast.error('This email is already in an active partnership and cannot accept new invitations.');
      }
    } else {
      router.push(`/signup?token=${token}`);
    }
  };

  return (
    <FlowShell
      stepLabel="Step 3 of 4"
      title={`${invitation.senderName} invited you`}
      subtitle="Accept to start your shared onboarding flow and goals."
      progress={75}
      statusChip="Ready to join"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-xl border border-landing-clay/70 bg-landing-cream/50 p-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={invitation.senderProfilePictureUrl} alt={invitation.senderName} />
            <AvatarFallback className="bg-landing-terracotta text-white text-base font-bold">
              {getInitials(invitation.senderName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-landing-espresso">{invitation.senderName}</p>
            <p className="text-sm text-landing-espresso-light">wants to partner with you on DuoTrak</p>
          </div>
        </div>

        {invitation.customMessage ? (
          <blockquote className="rounded-xl border border-landing-clay/70 bg-white p-4 text-sm italic text-landing-espresso-light">
            "{invitation.customMessage}"
          </blockquote>
        ) : null}

        <Button
          onClick={handleAccept}
          className="h-12 w-full bg-landing-espresso text-base font-bold text-landing-cream hover:bg-landing-terracotta"
          disabled={userStatusResult === undefined}
        >
          {userStatusResult === undefined ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            'Accept Invitation'
          )}
        </Button>
      </div>
    </FlowShell>
  );
}

export default function InviteAcceptancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-landing-cream">
          <Loader2 className="h-8 w-8 animate-spin text-landing-terracotta" />
        </div>
      }
    >
      <InviteAcceptanceContent />
    </Suspense>
  );
}
