'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function InviteAcceptancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const handleRedirect = (path: 'signup' | 'login') => {
    if (token) {
      router.push(`/${path}?token=${token}`);
    } else {
      toast.error("Invitation token is missing or invalid.");
      router.push(`/${path}`);
    }
  };

  return (
    <div className="text-center animate-fadeInUp">
      <div className="w-24 h-24 bg-accent-light-blue rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">💌</div>
      <h1 className="text-2xl font-bold text-charcoal mb-2">A Partnership Awaits</h1>
      <p className="text-base text-stone-gray mb-8">You've been invited to join a partner on DuoTrak. Accept to start achieving your goals together.</p>

      <div className="mx-auto max-w-lg space-y-4">
        <Button onClick={() => handleRedirect('signup')} className="w-full">Accept & Sign Up</Button>
        <Button onClick={() => handleRedirect('login')} variant="secondary" className="w-full">I Already Have an Account</Button>
      </div>
    </div>
  );
}
