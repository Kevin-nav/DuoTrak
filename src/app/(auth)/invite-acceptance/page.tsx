'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// A small self-contained loading component
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center text-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary-blue mb-4" />
    <p className="text-stone-gray">Verifying your invitation...</p>
  </div>
);

// A self-contained error component
const ErrorState = ({ message }: { message: string }) => (
  <div className="text-center">
    <h2 className="text-2xl font-bold text-red-600 mb-4">Invitation Invalid</h2>
    <p className="text-stone-gray mb-6">{message}</p>
    <Button onClick={() => (window.location.href = '/')}>Go to Homepage</Button>
  </div>
);

function InviteAcceptanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationDetails, setInvitationDetails] = useState<{
    senderName: string;
    receiverEmail: string;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      setError('No invitation token was found in the URL. Please check the link and try again.');
      setIsLoading(false);
      return;
    }

    const fetchInvitationDetails = async () => {
      try {
        const details = await apiClient.getPublicInvitationDetails(token);
        setInvitationDetails({
          senderName: details.sender_name,
          receiverEmail: details.receiver_email,
        });
      } catch (e: any) {
        setError(e.message || 'This invitation is no longer valid or has expired.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [token]);

  const handleAccept = async () => {
    if (!token || !invitationDetails) return;

    setIsProcessing(true);
    try {
      const status = await apiClient.getUserStatusByEmail(invitationDetails.receiverEmail);

      if (status.user_exists) {
        if (status.partnership_status === 'no_partner') {
          // User exists and is available, send to login
          router.push(`/login?token=${token}`);
        } else {
          // User exists but is already in a partnership
          toast.error('This email is already in an active partnership and cannot accept new invitations.');
          setError('This account is already part of a partnership.');
        }
      } else {
        // User does not exist, send to signup
        router.push(`/signup?token=${token}`);
      }
    } catch (e: any) {
      toast.error(e.message || 'An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !invitationDetails) {
    return <ErrorState message={error || 'Could not load invitation details.'} />;
  }

  return (
    <div className="text-center">
      <div className="w-24 h-24 bg-accent-light-blue rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">💌</div>
      <h1 className="text-3xl font-bold text-charcoal mb-2">
        <span className="text-primary-blue">{invitationDetails.senderName}</span> has invited you!
      </h1>
      <p className="text-base text-stone-gray mb-8">
        You've been invited to join a partnership on DuoTrak to achieve your goals together.
      </p>
      <Button onClick={handleAccept} className="w-full max-w-xs mx-auto" disabled={isProcessing}>
        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {isProcessing ? 'Checking...' : 'Accept Invitation'}
      </Button>
    </div>
  );
}

export default function InviteAcceptancePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto flex items-center justify-center min-h-screen"
    >
      <Card className="w-full max-w-lg">
        <CardHeader />
        <CardContent>
          <Suspense fallback={<LoadingState />}>
            <InviteAcceptanceContent />
          </Suspense>
        </CardContent>
      </Card>
    </motion.div>
  );
}
