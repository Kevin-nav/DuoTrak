"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import FlowShell from '@/components/flow/FlowShell';
import FlowStatusCard from '@/components/flow/FlowStatusCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PublicInvitationDetails {
  sender_name: string;
  receiver_name: string;
  expires_at: string;
}

export default function AcceptInvitationPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const { userDetails, isLoading: isUserLoading } = useUser();
  const [isConsentDialogOpen, setIsConsentDialogOpen] = useState(false);

  const { data: invitationDetails, error: queryError, isLoading: isQueryLoading } = useQuery<PublicInvitationDetails>({
    queryKey: ['invitation', token],
    queryFn: () => apiClient.get(`/partner-invitations/invitations/details/${token}`),
    enabled: !!token,
    retry: false,
  });

  const { mutate: acceptInvitation, isPending: isAccepting } = useMutation({
    mutationFn: () => apiClient.post('/partner-invitations/accept', { invitation_token: token }),
    onSuccess: () => {
      toast.success("Partnership created!", {
        description: "You are now partners. Redirecting you to the dashboard.",
      });
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.detail || 'An unexpected error occurred.';
      toast.error('Failed to accept invitation', {
        description: errorMessage,
      });
    },
  });

  const handleAccept = () => {
    if (!userDetails) {
      router.push(`/signup?token=${token}`);
      return;
    }
    setIsConsentDialogOpen(true);
  };

  const isLoading = isQueryLoading || isUserLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-landing-cream">
        <Loader2 className="h-10 w-10 animate-spin text-landing-terracotta" />
      </div>
    );
  }

  if (queryError) {
    return (
      <FlowShell stepLabel="Invitation" title="Invitation invalid" subtitle="This invitation link is invalid or expired." progress={65}>
        <FlowStatusCard
          tone="warning"
          title="Unable to verify invitation"
          description="Please ask your partner to send a fresh invitation link."
          actions={<Button variant="outline" onClick={() => router.push('/')}>Go to Homepage</Button>}
        />
      </FlowShell>
    );
  }

  return (
    <>
      <FlowShell
        stepLabel="Step 3 of 4"
        title="You are invited"
        subtitle={`${invitationDetails?.sender_name} invited you to join DuoTrak as their partner.`}
        progress={75}
        statusChip="Awaiting acceptance"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl border border-landing-clay/70 bg-landing-cream/50 p-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-landing-terracotta text-white">
                {invitationDetails?.sender_name?.charAt(0).toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-landing-espresso">{invitationDetails?.sender_name}</p>
              <p className="text-sm text-landing-espresso-light">Ready to set shared goals with you</p>
            </div>
          </div>
          <p className="text-sm text-landing-espresso-light">
            By accepting, you will start sharing progress and accountability in DuoTrak.
          </p>
          <Button
            onClick={handleAccept}
            className="h-12 w-full bg-landing-espresso text-base font-bold text-landing-cream hover:bg-landing-terracotta"
            disabled={isAccepting}
          >
            {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Accept Invitation
          </Button>
        </div>
      </FlowShell>

      <AlertDialog open={isConsentDialogOpen} onOpenChange={setIsConsentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Partnership</AlertDialogTitle>
            <AlertDialogDescription>
              You are logged in as <span className="font-semibold text-landing-terracotta">{userDetails?.email}</span>.
              Do you want to form a partnership with <span className="font-semibold text-landing-terracotta">{invitationDetails?.sender_name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => acceptInvitation()} disabled={isAccepting}>
              {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, become partners
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
