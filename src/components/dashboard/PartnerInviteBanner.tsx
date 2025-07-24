'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 flex-shrink-0 text-primary-blue">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);

export default function PartnerInviteBanner() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    toast({
      title: 'One last step!',
      description: 'To get started, you need to invite your partner. Redirecting you now...',
      variant: 'default',
    });

    const timer = setTimeout(() => {
      router.push('/invite-partner');
    }, 2500); // 2.5-second delay before redirecting

    return () => clearTimeout(timer);
  }, [router, toast]);

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-gray bg-white p-12 text-center animate-pulse">
        <Loader2 className="h-12 w-12 animate-spin text-primary-blue mb-4" />
        <h3 className="text-xl font-bold text-charcoal">Finalizing Your Account...</h3>
        <p className="text-base text-stone-gray">
            Redirecting you to the partner invitation page.
        </p>
    </div>
  );
}
