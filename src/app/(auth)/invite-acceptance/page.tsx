'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Clock, UserX } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

// Loading component
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center text-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-primary-blue mb-4" />
    <p className="text-stone-gray">Verifying your invitation...</p>
  </div>
);

// Error component with specific error types
const ErrorState = ({ errorType, message }: { errorType: string; message: string }) => {
  const getErrorIcon = () => {
    switch (errorType) {
      case 'INVITATION_EXPIRED':
        return <Clock className="w-16 h-16 text-amber-500 mb-4" />;
      case 'INVITATION_ALREADY_USED':
        return <UserX className="w-16 h-16 text-gray-500 mb-4" />;
      default:
        return <AlertCircle className="w-16 h-16 text-red-500 mb-4" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'INVITATION_EXPIRED':
        return 'Invitation Expired';
      case 'INVITATION_ALREADY_USED':
        return 'Invitation Already Used';
      default:
        return 'Invitation Invalid';
    }
  };

  return (
    <div className="text-center py-12">
      {getErrorIcon()}
      <h2 className="text-2xl font-bold text-gray-800 mb-2">{getErrorTitle()}</h2>
      <p className="text-stone-gray mb-6 max-w-sm mx-auto">{message}</p>
      <Button onClick={() => (window.location.href = '/')} variant="outline">
        Go to Homepage
      </Button>
    </div>
  );
};

function InviteAcceptanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Convex query for invitation details
  const invitationResult = useQuery(
    api.invitations.getByToken,
    token ? { token } : 'skip'
  );

  // Convex query for checking if receiver already exists
  const userStatusResult = useQuery(
    api.users.checkStatusByEmail,
    invitationResult?.invitation?.receiverEmail
      ? { email: invitationResult.invitation.receiverEmail }
      : 'skip'
  );

  // Convex mutation to mark as viewed
  const markAsViewedMutation = useMutation(api.invitations.markAsViewed);

  // Mark invitation as viewed when loaded
  useEffect(() => {
    if (token && invitationResult?.invitation) {
      markAsViewedMutation({ token }).catch((e) => {
        console.error('Failed to mark invitation as viewed:', e);
      });
    }
  }, [token, invitationResult?.invitation, markAsViewedMutation]);

  // Handle no token
  if (!token) {
    return (
      <ErrorState
        errorType="INVITATION_NOT_FOUND"
        message="No invitation token was found in the URL. Please check the link and try again."
      />
    );
  }

  // Loading state
  if (invitationResult === undefined) {
    return <LoadingState />;
  }

  // Error states from query
  if (invitationResult.error) {
    const errorMessages: Record<string, string> = {
      INVITATION_NOT_FOUND: 'This invitation link is invalid. Please ask your partner to send a new one.',
      INVITATION_EXPIRED: 'This invitation has expired. Please ask your partner to send a new one.',
      INVITATION_ALREADY_USED: 'This invitation has already been accepted.',
    };
    return (
      <ErrorState
        errorType={invitationResult.error}
        message={errorMessages[invitationResult.error] || 'Unknown error occurred.'}
      />
    );
  }

  const invitation = invitationResult.invitation;
  if (!invitation) {
    return <ErrorState errorType="UNKNOWN" message="Could not load invitation details." />;
  }

  const handleAccept = () => {
    // Check user status and route appropriately
    if (userStatusResult?.user_exists) {
      if (userStatusResult.partnership_status === 'no_partner') {
        // User exists and is available, send to login
        router.push(`/login?token=${token}`);
      } else {
        // User exists but is already in a partnership
        toast.error('This email is already in an active partnership and cannot accept new invitations.');
      }
    } else {
      // User does not exist, send to signup
      router.push(`/signup?token=${token}`);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="text-center">
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Avatar className="w-24 h-24 mx-auto mb-6 ring-4 ring-blue-100">
          <AvatarImage src={invitation.senderProfilePictureUrl} alt={invitation.senderName} />
          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-3xl font-bold">
            {getInitials(invitation.senderName)}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <motion.h1
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-3xl font-bold text-charcoal mb-2"
      >
        <span className="text-primary-blue">{invitation.senderName}</span> has invited you!
      </motion.h1>
      <motion.p
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-base text-stone-gray mb-8"
      >
        to join a partnership on DuoTrak to achieve your goals together.
      </motion.p>

      {invitation.customMessage && (
        <motion.blockquote
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mb-8 p-4 bg-gray-100 border-l-4 border-blue-300 text-gray-700 italic"
        >
          <p>"{invitation.customMessage}"</p>
        </motion.blockquote>
      )}

      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 1.0, duration: 0.5 }}
      >
        <Button
          onClick={handleAccept}
          className="w-full max-w-xs mx-auto"
          disabled={userStatusResult === undefined}
        >
          {userStatusResult === undefined ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Checking...
            </>
          ) : (
            'Accept Invitation'
          )}
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
      className="container mx-auto flex items-center justify-center min-h-screen p-4"
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
