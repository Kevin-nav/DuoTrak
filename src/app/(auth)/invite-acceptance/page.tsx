'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

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
    sender_profile_picture_url?: string;
    receiverEmail: string;
    custom_message?: string;
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
          sender_profile_picture_url: details.sender_profile_picture_url,
          receiverEmail: details.receiver_email,
          custom_message: details.custom_message,
        });
      } catch (e: any) {
        setError(e.message || 'This invitation is no longer valid or has expired.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [token]);

  // Mark invitation as viewed when the component loads
  useEffect(() => {
    if (token) {
      apiClient.markInvitationAsViewed(token).catch(e => {
        console.error("Failed to mark invitation as viewed:", e);
        // Do not block the user flow if marking as viewed fails
      });
    }
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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <div className="text-center">
      <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.2, duration: 0.5 }}>
        <Avatar className="w-24 h-24 mx-auto mb-6 ring-4 ring-blue-100">
          <AvatarImage src={invitationDetails.sender_profile_picture_url} alt={invitationDetails.senderName} />
          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-3xl font-bold">
            {getInitials(invitationDetails.senderName)}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <motion.h1 variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.4, duration: 0.5 }} className="text-3xl font-bold text-charcoal mb-2">
        <span className="text-primary-blue">{invitationDetails.senderName}</span> has invited you!
      </motion.h1>
      <motion.p variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.6, duration: 0.5 }} className="text-base text-stone-gray mb-8">
        to join a partnership on DuoTrak to achieve your goals together.
      </motion.p>

      {invitationDetails.custom_message && (
        <motion.blockquote variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 0.8, duration: 0.5 }} className="mb-8 p-4 bg-gray-100 border-l-4 border-blue-300 text-gray-700 italic">
          <p>"{invitationDetails.custom_message}"</p>
        </motion.blockquote>
      )}

      <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: 1.0, duration: 0.5 }}>
        <Button onClick={handleAccept} className="w-full max-w-xs mx-auto" disabled={isProcessing}>
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {isProcessing ? 'Checking...' : 'Accept Invitation'}
        </Button>
      </motion.div>
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
