'use client';

import React from 'react';
import { useUser } from '@/contexts/UserContext';
import InvitePartnerForm from '@/components/invitation/InvitePartnerForm';
import { Loader2 } from 'lucide-react';
import FlowShell from '@/components/flow/FlowShell';

export default function InvitePartnerPage() {
  const { isLoading: isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-landing-cream">
        <Loader2 className="h-8 w-8 animate-spin text-landing-terracotta" />
      </div>
    );
  }

  return (
    <FlowShell
      stepLabel="Step 1 of 4"
      title="Invite your partner"
      subtitle="Send one invite and start your shared accountability journey."
      progress={25}
      backHref="/dashboard"
      statusChip="Invitation setup"
    >
      <InvitePartnerForm />
    </FlowShell>
  );
}
