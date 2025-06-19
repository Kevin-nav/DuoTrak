'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

export default function PendingAcceptancePage() {
  return (
    <div className="text-center animate-fadeInUp pt-16">
      <div className="w-24 h-24 bg-accent-light-blue rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">⏳</div>
      <h1 className="text-2xl font-bold text-charcoal mb-2">Invite Sent!</h1>
      <p className="text-base text-stone-gray mb-8">Now, we wait. We'll let you know as soon as Alex accepts your invitation.</p>
      
      <Button variant="secondary" onClick={() => { /* Resend logic */ }}>Resend Invite</Button>
    </div>
  );
}
