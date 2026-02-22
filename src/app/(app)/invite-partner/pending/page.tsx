'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { differenceInHours } from 'date-fns';
import { Bell, Copy, Loader2, MailCheck, Target, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import FlowShell from '@/components/flow/FlowShell';
import FlowStatusCard from '@/components/flow/FlowStatusCard';
import { buildInviteUrl } from '@/lib/invites/url';

export default function InvitationPendingPage() {
  const { userDetails: user, isLoading: isAuthLoading, withdrawInvitation, nudgePartner, retryInviteEmail } = useUser();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isNudging, setIsNudging] = useState(false);
  const [isRetryingEmail, setIsRetryingEmail] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const handleWithdraw = async () => {
    if (!user?.sent_invitation) {
      toast.error('No pending invitation found to withdraw.');
      return;
    }
    setIsWithdrawing(true);
    try {
      await withdrawInvitation(user.sent_invitation._id);
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
      await nudgePartner(user.sent_invitation._id);
    } finally {
      setIsNudging(false);
    }
  };

  const canNudge = useMemo(() => {
    if (!user?.sent_invitation?.last_nudged_at) return true;
    const hoursSinceLastNudge = differenceInHours(new Date(), new Date(user.sent_invitation.last_nudged_at));
    return hoursSinceLastNudge >= 24;
  }, [user?.sent_invitation?.last_nudged_at]);

  const inviteRetryCooldownSeconds = useMemo(() => {
    const lastAttempt = user?.sent_invitation?.email_last_attempt_at;
    if (!lastAttempt) return 0;
    const remainingMs = lastAttempt + 60_000 - nowMs;
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }, [nowMs, user?.sent_invitation?.email_last_attempt_at, user?.sent_invitation?.email_send_status]);

  const canRetryInviteEmail =
    user?.sent_invitation?.email_send_status === 'failed' && inviteRetryCooldownSeconds === 0;

  const invitationLink = useMemo(() => {
    if (!user?.sent_invitation?.invitation_token) return '';
    return buildInviteUrl(user.sent_invitation.invitation_token);
  }, [user?.sent_invitation?.invitation_token]);

  const copyInvitationLink = async () => {
    if (!invitationLink) return;
    try {
      await navigator.clipboard.writeText(invitationLink);
      setLinkCopied(true);
      toast.success('Invitation link copied.');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Could not copy invitation link.');
    }
  };

  const handleRetryInviteEmail = async () => {
    if (!user?.sent_invitation?._id) return;
    setIsRetryingEmail(true);
    try {
      await retryInviteEmail(user.sent_invitation._id);
    } finally {
      setIsRetryingEmail(false);
    }
  };

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
      title="Invitation created"
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
        <FlowStatusCard
          tone={user.sent_invitation.email_send_status === 'failed' ? 'warning' : user.sent_invitation.email_send_status === 'sent' ? 'success' : 'loading'}
          title={
            user.sent_invitation.email_send_status === 'failed'
              ? 'Invite email did not send'
              : user.sent_invitation.email_send_status === 'sent'
                ? 'Invite email handed off'
                : 'Sending invite email'
          }
          description={
            user.sent_invitation.email_send_status === 'failed'
              ? `Your invitation is still active. Use the link below while we retry delivery.${user.sent_invitation.email_last_error ? ` Last error: ${user.sent_invitation.email_last_error}` : ''}`
              : user.sent_invitation.email_send_status === 'sent'
                ? 'Our email provider accepted the message. If your partner does not see it, check spam or share the link directly.'
                : 'We are still delivering your invitation email.'
          }
          actions={
            user.sent_invitation.email_send_status === 'failed' ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={copyInvitationLink} className="border-landing-clay">
                  <Copy className="mr-2 h-4 w-4" />
                  {linkCopied ? 'Copied' : 'Copy invite link'}
                </Button>
                <Button
                  onClick={handleRetryInviteEmail}
                  disabled={isRetryingEmail || !canRetryInviteEmail}
                  className="bg-landing-espresso text-landing-cream hover:bg-landing-terracotta"
                >
                  {isRetryingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {canRetryInviteEmail ? 'Retry email' : `Retry in ${inviteRetryCooldownSeconds}s`}
                </Button>
              </div>
            ) : undefined
          }
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
        {user.sent_invitation.nudge_email_send_status === 'failed' ? (
          <FlowStatusCard
            tone="warning"
            title="Reminder email failed"
            description={`The nudge was recorded, but we could not deliver the reminder email. Copy the invite link and send it directly.${user.sent_invitation.nudge_email_last_error ? ` Last error: ${user.sent_invitation.nudge_email_last_error}` : ''}`}
            actions={
              <Button variant="outline" onClick={copyInvitationLink} className="border-landing-clay">
                <Copy className="mr-2 h-4 w-4" />
                {linkCopied ? 'Copied' : 'Copy invite link'}
              </Button>
            }
          />
        ) : null}
      </div>
    </FlowShell>
  );
}
