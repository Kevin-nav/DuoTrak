'use client';

'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { withdrawInvitation, ApiError } from '@/lib/api';
import { toast } from 'sonner';

export default function InvitationPendingPage() {
  const { userDetails: user, refetchUserDetails, isLoading: isAuthLoading } = useUser();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const router = useRouter();

  const handleWithdraw = async () => {
    if (!user?.sent_invitation) {
      toast.error('No pending invitation found to withdraw.');
      return;
    }

    setIsWithdrawing(true);
    try {
      await withdrawInvitation(user.sent_invitation.id);
      toast.success('Invitation successfully withdrawn.');
      await refetchUserDetails();
      router.push('/invite-partner');
    } catch (error) {
      if (error instanceof ApiError) {
        // Display the specific error message from the backend
        toast.error(error.detail);
      } else {
        // Generic error is handled by apiFetch, but we can log it here if needed
        console.error('An unexpected error occurred:', error);
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isAuthLoading) {
      return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!user || !user.sent_invitation) {
    // This case should be handled by middleware, but as a fallback:
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle>No Pending Invitation</CardTitle>
            <CardDescription>You do not have any pending invitations.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full">
            <MailCheck className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl">Invitation Sent!</CardTitle>
          <CardDescription>
            Your invitation has been sent to <span className="font-semibold text-primary">{user.sent_invitation.receiver_email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-6">
            You will be notified once your partner accepts. Until then, you cannot use the dashboard.
          </p>
          <Button onClick={handleWithdraw} disabled={isWithdrawing} className="w-full">
            {isWithdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Withdraw Invitation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

