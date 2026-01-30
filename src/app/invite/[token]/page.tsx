// src/app/invite/[token]/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PublicInvitationDetails {
  sender_name: string;
  receiver_name: string;
  expires_at: string;
}

// This page is for the person who has been invited.
export default function AcceptInvitationPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const { userDetails, isLoading: isUserLoading } = useUser();
  const [isConsentDialogOpen, setIsConsentDialogOpen] = useState(false);

  // 1. Fetch public details of the invitation to show who invited the user.
  const { data: invitationDetails, error: queryError, isLoading: isQueryLoading } = useQuery<PublicInvitationDetails>({
    queryKey: ['invitation', token],
    queryFn: () => apiClient.get(`/partner-invitations/invitations/details/${token}`),
    enabled: !!token,
    retry: false,
  });

  // 2. Mutation to accept the invitation.
  const { mutate: acceptInvitation, isPending: isAccepting } = useMutation({
    mutationFn: () => apiClient.post('/partner-invitations/accept', { invitation_token: token }),
    onSuccess: () => {
      toast.success("Partnership created!", {
        description: "You are now partners. Redirecting you to the dashboard.",
      });
      // Redirect to dashboard, middleware will handle the rest.
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
    // If user is not logged in, redirect them to signup, but keep the token.
    if (!userDetails) {
      router.push(`/signup?invite_token=${token}`);
      return;
    }
    // If user is logged in, open the consent dialog.
    setIsConsentDialogOpen(true);
  };

  const handleConfirmAccept = () => {
    acceptInvitation();
  };

  const isLoading = isQueryLoading || isUserLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying invitation...</p>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Card className="w-full max-w-md text-center bg-destructive/10 border-destructive">
          <CardHeader>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive text-destructive-foreground">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <CardTitle className="mt-4">Invitation Invalid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">
              This invitation link is either invalid or has expired. Please ask for a new invitation.
            </p>
            <Button variant="secondary" className="mt-6" onClick={() => router.push('/')}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader>
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/20">
              {/* In a real app, you might fetch the sender's avatar URL */}
              <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                {invitationDetails?.sender_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">You're Invited!</CardTitle>
            <CardDescription>
              <span className="font-bold text-primary">{invitationDetails?.sender_name}</span> has invited you to become their partner on DuoTrak.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">
              By accepting, you will start sharing goals and tracking progress together.
            </p>
            <Button onClick={handleAccept} className="w-full" disabled={isAccepting}>
              {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Accept Invitation'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isConsentDialogOpen} onOpenChange={setIsConsentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Partnership</AlertDialogTitle>
            <AlertDialogDescription>
              You are already logged in as <span className="font-semibold text-primary">{userDetails?.email}</span>.
              Do you want to form a partnership with <span className="font-semibold text-primary">{invitationDetails?.sender_name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAccept} disabled={isAccepting}>
              {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Yes, become partners'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
