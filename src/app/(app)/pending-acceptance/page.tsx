"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import FlowShell from '@/components/flow/FlowShell';
import FlowStatusCard from '@/components/flow/FlowStatusCard';

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userDetails, isLoading: isUserLoading } = useUser();
  const token = searchParams.get('token');

  const invitationResult = useQuery(api.invitations.getByToken, token ? { token } : 'skip');
  const acceptInvitationMutation = useMutation(api.invitations.accept);

  const handleAccept = async () => {
    if (!token) return;
    if (!userDetails && !isUserLoading) {
      router.push(`/login?token=${token}`);
      return;
    }

    try {
      await acceptInvitationMutation({ token });
      toast.success('Invitation accepted! You are now partners.');
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
      toast.error(err.message || 'Failed to accept invitation.');
    }
  };

  if (isUserLoading || invitationResult === undefined) {
    return (
      <FlowShell stepLabel="Invitation" title="Checking invitation" subtitle="Please wait while we verify this invitation." progress={65}>
        <FlowStatusCard title="Verifying token" description="This takes a moment." tone="loading" />
      </FlowShell>
    );
  }

  if (!token) {
    return (
      <FlowShell stepLabel="Invitation" title="Invalid invitation link" subtitle="This link is missing required invitation details." progress={65}>
        <FlowStatusCard
          tone="warning"
          title="Missing token"
          description="Invitation token is missing. Please check the link and try again."
          actions={
            <Button onClick={() => router.push('/')} variant="outline" className="border-landing-clay">
              Go to Homepage
            </Button>
          }
        />
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
      <FlowShell stepLabel="Invitation" title="Invitation problem" subtitle="We could not validate this invitation." progress={65}>
        <FlowStatusCard
          tone="warning"
          title="Unable to continue"
          description={errorMessages[invitationResult.error] || 'Unknown error occurred.'}
          actions={
            <Button onClick={() => router.push('/')} variant="outline" className="border-landing-clay">
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
      <FlowShell stepLabel="Invitation" title="Invitation unavailable" subtitle="We could not load invitation details right now." progress={65}>
        <FlowStatusCard tone="warning" title="Could not load details" description="Try again in a moment." />
      </FlowShell>
    );
  }

  return (
    <FlowShell
      stepLabel="Step 3 of 4"
      title="You are invited"
      subtitle={`${invitation.senderName} wants to partner with you on DuoTrak.`}
      progress={75}
      statusChip="Awaiting acceptance"
    >
      <div className="space-y-4">
        <Card className="border-landing-clay/70 bg-landing-cream/40">
          <CardContent className="flex items-center gap-4 p-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={invitation.senderProfilePictureUrl} alt={invitation.senderName} />
              <AvatarFallback className="bg-landing-terracotta text-white">{getInitials(invitation.senderName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-landing-espresso">{invitation.senderName}</p>
              <p className="text-sm text-landing-espresso-light">is ready to start shared goals with you</p>
            </div>
          </CardContent>
        </Card>

        {invitation.customMessage ? (
          <blockquote className="rounded-xl border border-landing-clay/70 bg-white p-4 text-sm italic text-landing-espresso-light">
            "{invitation.customMessage}"
          </blockquote>
        ) : null}

        <Button onClick={handleAccept} className="h-12 w-full bg-landing-espresso text-base font-bold text-landing-cream hover:bg-landing-terracotta">
          Accept Invitation
        </Button>
      </div>
    </FlowShell>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-landing-cream">
          <Loader2 className="h-8 w-8 animate-spin text-landing-terracotta" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
