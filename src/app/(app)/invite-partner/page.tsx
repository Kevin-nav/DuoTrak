'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/Input';

export default function InvitePartnerPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Simulate sending invite
    router.push('/pending-acceptance');
  };

  return (
    <div className="text-center animate-fadeInUp">
      <div className="w-24 h-24 bg-accent-light-blue rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">🤝</div>
      <h1 className="text-2xl font-bold text-charcoal mb-2">Invite Your Partner</h1>
      <p className="text-base text-stone-gray mb-8">Enter your partner's email to send them an invitation.</p>

      <div className="mx-auto max-w-lg">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input type="text" placeholder="Partner's Name" required />
          <Input
            type="email"
            placeholder="Partner's Email Address"
            required
          />
          <Button type="submit" className="w-full">Send Invitation</Button>
        </form>
      </div>
    </div>
  );
}
