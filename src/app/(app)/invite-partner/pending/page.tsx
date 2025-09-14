'use client';

'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck, Loader2, Bell, User, Target, CheckCircle, Circle, Rocket } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { differenceInHours } from 'date-fns';

const motivationQuotes = [
    {
        quote: "Did you know? Users with an accountability partner are 95% more likely to achieve their goals.",
        author: "The Accountability Effect"
    },
    {
        quote: "The secret to getting ahead is getting started. Why not set up your first personal goal while you wait?",
        author: "Mark Twain (paraphrased)"
    },
    {
        quote: "Once your partner joins, you'll be able to see their progress in real-time to stay motivated.",
        author: "DuoTrak Tip"
    }
];

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

  const randomQuote = useMemo(() => motivationQuotes[Math.floor(Math.random() * motivationQuotes.length)], []);

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !user.sent_invitation) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <CardTitle>No Pending Invitation</CardTitle>
                    <CardDescription>You do not have any pending invitations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/invite-partner')}>Invite a Partner</Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
            <MailCheck className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">Invitation Sent!</h1>
            <p className="text-lg text-gray-600 mt-2">
                Your invitation is on its way to <span className="font-semibold text-primary">{user.sent_invitation.receiver_email}</span>.
            </p>
        </div>

        {/* Onboarding Progress Tracker */}
        <div className="mb-10">
            <ol className="flex items-center w-full">
                <li className="flex w-full items-center text-primary">
                    <div className="flex items-center">
                        <CheckCircle className="w-6 h-6 mr-2" />
                        <span className="font-medium">Account Ready</span>
                    </div>
                    <div className="flex-auto border-t-2 border-primary mx-4"></div>
                </li>
                <li className="flex w-full items-center text-primary">
                    <div className="flex items-center">
                        <CheckCircle className="w-6 h-6 mr-2" />
                        <span className="font-medium">Invitation Sent</span>
                    </div>
                    <div className="flex-auto border-t-2 border-primary mx-4"></div>
                </li>
                <li className="flex w-full items-center text-primary">
                    <div className="flex items-center">
                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        <span className="font-medium">Waiting for Partner</span>
                    </div>
                    <div className="flex-auto border-t-2 border-gray-200 mx-4"></div>
                </li>
                <li className="flex items-center text-gray-500">
                    <Circle className="w-6 h-6 mr-2" />
                    <span className="font-medium">Begin Journey</span>
                </li>
            </ol>
        </div>

        {/* Action Center */}
        <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">Get Ready While You Wait</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center"><User className="mr-2"/> Complete Your Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-4">A complete profile helps your partner connect with you.</p>
                        <Button variant="secondary" className="w-full" asChild>
                            <Link href="/profile/edit">Edit Profile</Link>
                        </Button>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center"><Target className="mr-2"/> Set a Personal Goal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-4">Get a head start by creating your first personal goal.</p>
                        <Button variant="secondary" className="w-full" asChild>
                            <Link href="/goals/new">Create Goal</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>

        {/* Nudge and Withdraw Actions */}
        <Card className="mb-10">
            <CardHeader>
                <CardTitle>Manage Your Invitation</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleNudge} disabled={isNudging || !canNudge} className="flex-1">
                    {isNudging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                    {canNudge ? 'Send a Reminder' : 'Reminder Sent'}
                </Button>
                <Button onClick={handleWithdraw} disabled={isWithdrawing} variant="outline" className="flex-1">
                    {isWithdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Withdraw Invitation
                </Button>
            </CardContent>
        </Card>

        {/* Motivation Corner */}
        <div className="text-center p-6 bg-blue-50 rounded-lg">
            <Rocket className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <p className="text-md text-blue-800 italic">"{randomQuote.quote}"</p>
            <p className="text-sm text-blue-600 mt-2">- {randomQuote.author}</p>
        </div>

      </div>
    </div>
  );
}

