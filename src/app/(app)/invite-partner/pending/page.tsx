'use client';

import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { differenceInHours } from 'date-fns';
import { Bell, Loader2, MailCheck, Target, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import FlowShell from '@/components/flow/FlowShell';
import FlowStatusCard from '@/components/flow/FlowStatusCard';

export default function InvitationPendingPage() {
  const { userDetails: user, isLoading: isAuthLoading, withdrawInvitation, nudgePartner } = useUser();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const router = useRouter();

  const handleWithdraw = async () => {
    if (!user?.sent_invitation) {
      toast.error('No pending invitation found to withdraw.');
      return;
    }
    setIsWithdrawing(true);
    try {
      await withdrawInvitation(user.sent_invitation.id);
      router.push('/invite-partner');
    } catch (error) {
      console.error('An unexpected error occurred:', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleNudge = async () => {
    if (!user?.sent_invitation) {
      toast.error('No pending invitation found to nudge.');
      return;
    }
    setIsNudging(true);
    try {
      await nudgePartner(user.sent_invitation.id);
    } finally {
      setIsNudging(false);
    }
  };

  const canNudge = useMemo(() => {
    if (!user?.sent_invitation?.last_nudged_at) return true;
    const hoursSinceLastNudge = differenceInHours(new Date(), new Date(user.sent_invitation.last_nudged_at));
    return hoursSinceLastNudge >= 24;
  }, [user?.sent_invitation?.last_nudged_at]);

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-landing-cream">
        <Loader2 className="h-10 w-10 animate-spin text-landing-terracotta" />
      </div>
    );
  }

  if (!user || !user.sent_invitation) {
    return (
      <FlowShell
        stepLabel="Step 2 of 4"
        title="No pending invitation"
        subtitle="Send a fresh invite to continue onboarding your duo."
        progress={50}
        backHref="/invite-partner"
      >
        <FlowStatusCard
          tone="warning"
          title="No invitation found"
          description="You currently do not have a pending invitation."
          actions={<Button onClick={() => router.push('/invite-partner')}>Invite a Partner</Button>}
        />
      </FlowShell>
    );
  }

  return (
    <FlowShell
      stepLabel="Step 2 of 4"
      title="Invitation sent"
      subtitle={`Your invitation is on its way to ${user.sent_invitation.receiver_email}.`}
      progress={50}
      backHref="/invite-partner"
      statusChip="Waiting for partner"
    >
      <div className="space-y-4">
        <FlowStatusCard
          title="Waiting for acceptance"
          description="While you wait, you can prepare your profile and first goal so you are ready to start immediately."
          tone="loading"
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-landing-clay/70 bg-landing-cream/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-landing-espresso">
                <User className="h-5 w-5 text-landing-sage" />
                Complete your profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-landing-espresso-light">A complete profile helps your partner connect with you faster.</p>
              <Button variant="outline" className="w-full border-landing-clay" asChild>
                <Link href="/profile/edit">Edit Profile</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-landing-clay/70 bg-landing-cream/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-landing-espresso">
                <Target className="h-5 w-5 text-landing-gold" />
                Draft a personal goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-landing-espresso-light">Get momentum now and turn it into a shared goal once your partner joins.</p>
              <Button variant="outline" className="w-full border-landing-clay" asChild>
                <Link href="/goals/new">Create Goal</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-landing-clay/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-landing-espresso">
              <MailCheck className="h-5 w-5 text-landing-terracotta" />
              Manage invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleNudge}
              disabled={isNudging || !canNudge}
              className="flex-1 bg-landing-espresso text-landing-cream hover:bg-landing-terracotta"
            >
              {isNudging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
              {canNudge ? 'Send Reminder' : 'Reminder Sent'}
            </Button>
            <Button onClick={handleWithdraw} disabled={isWithdrawing} variant="outline" className="flex-1 border-landing-clay">
              {isWithdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Withdraw Invitation
            </Button>
          </CardContent>
        </Card>
      </div>
    </FlowShell>
  );
}
