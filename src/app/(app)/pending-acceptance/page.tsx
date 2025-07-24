'use client';

'use client';

import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { acceptInvitation, declineInvitation } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Mail, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PendingAcceptancePage() {
  const { userDetails: user, refetchUserDetails, isLoading: isAuthLoading } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleResponse = async (accept: boolean) => {
    if (!user?.received_invitation) {
      toast.error('No invitation found to respond to.');
      return;
    }

    setIsProcessing(true);
    try {
      if (accept) {
        await acceptInvitation(user.received_invitation.id);
        toast.success('Invitation accepted! Welcome to your partnership.');
        await refetchUserDetails(); // Refresh user state to get new partner info
        router.push('/app'); // Redirect to the main dashboard
      } else {
        await declineInvitation(user.received_invitation.id);
        toast.info('Invitation declined.');
      }
      await refetchUserDetails(); // This will trigger middleware to redirect if they decline
    } catch (error) {
      // API lib handles error toast
    } finally {
      setIsProcessing(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !user.received_invitation) {
    // This case should be handled by middleware, but as a fallback:
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle>No Pending Invitation</CardTitle>
            <CardDescription>You do not have any pending invitations to accept.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const senderEmail = user.received_invitation.sender?.email || 'your potential partner';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md text-center shadow-lg animate-fadeInUp">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full">
            <Mail className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl">You've Been Invited!</CardTitle>
          <CardDescription>
            <span className="font-semibold text-primary">{senderEmail}</span> has invited you to be their accountability partner on DuoTrak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ready to team up and start tracking your goals together?
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => handleResponse(true)} disabled={isProcessing} className="flex-1 bg-green-500 hover:bg-green-600">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Accept
            </Button>
            <Button onClick={() => handleResponse(false)} disabled={isProcessing} variant="destructive" className="flex-1">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

