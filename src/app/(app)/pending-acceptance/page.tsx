// src/app/(app)/pending-acceptance/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ApiClient } from '@/lib/api/client';

interface InvitationDetails {
  sender_name: string;
  receiver_name: string;
  expires_at: string;
}

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError("Invitation token is missing.");
      setIsLoading(false);
      return;
    }

    const fetchInvitationDetails = async () => {
      try {
        const apiClient = new ApiClient();
        const response = await apiClient.getPublicInvitationDetails(token);
        setDetails(response);
      } catch (err) {
        setError("Failed to fetch invitation details. The link may be invalid or expired.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitationDetails();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;

    if (!user && !isUserLoading) {
      // Not logged in, redirect to login
      router.push(`/login?redirect=/pending-acceptance?token=${token}`);
      return;
    }

    try {
      const apiClient = new ApiClient();
      await apiClient.acceptInvitation(token);
      toast.success("Invitation accepted! You are now partners.");
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invitation.");
    }
  };

  if (isLoading || isUserLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card>
        <CardHeader>
          <CardTitle>You're Invited!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            <strong>{details?.sender_name}</strong> has invited you to become partners on DuoTrak.
          </p>
          <Button onClick={handleAccept}>Accept Invitation</Button>
        </CardContent>
      </Card>
    </div>
  );
}