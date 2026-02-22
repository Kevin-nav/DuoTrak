'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sendPasswordResetEmail } from 'firebase/auth';
import AuthShell from '@/components/auth/AuthShell';
import { auth } from '@/lib/firebase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('If an account with that email exists, a password reset link has been sent.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      setMessage('If an account with that email exists, a password reset link has been sent.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      badge="Reset Access"
      title="Forgot your password?"
      subtitle="No problem. We will send reset instructions to your email."
      footer={
        <p>
          Remembered it?{' '}
          <Link href="/login" className="font-bold text-landing-terracotta hover:text-landing-espresso">
            Back to log in
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        {message && (
          <p className="rounded-xl border border-landing-sage/40 bg-landing-sage/10 px-4 py-3 text-sm text-landing-espresso">
            {message}
          </p>
        )}

        {!message && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-1.5 text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-landing-espresso-light">Email</span>
              <Input
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 rounded-xl border-landing-clay bg-landing-cream/40"
              />
            </label>

            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-landing-espresso text-base font-bold text-landing-cream hover:bg-landing-terracotta"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  );
}
