'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/Input';
import AnimatedTextCharacter from '@/components/ui/AnimatedTextCharacter';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    // TODO: Integrate with Supabase auth
    // await supabase.auth.resetPasswordForEmail(email, {
    //   redirectTo: `${window.location.origin}/password-reset`,
    // });

    // Simulate API call
    setTimeout(() => {
      const isSuccess = Math.random() > 0.1; // 90% success rate
      if (isSuccess) {
        setMessage('If an account with that email exists, a password reset link has been sent.');
      } else {
        setError('Failed to send reset link. Please try again.');
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="text-center animate-fadeInUp">
      <div className="flex justify-center">
        <AnimatedTextCharacter text="Forgot Password?" className="text-3xl font-bold text-charcoal mb-2" />
      </div>
      <p className="text-base text-stone-gray mb-8">No worries, we'll send you reset instructions.</p>

      <div className="mx-auto max-w-lg">
        {message && <p className="mb-4 text-sm text-green-700 bg-green-100 border border-green-300 rounded-lg py-3 px-4">{message}</p>}
        {error && <p className="mb-4 text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg py-3 px-4">{error}</p>}

        {!message && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="Enter your email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        )}
      </div>

      <p className="text-sm text-stone-gray mt-6">
        <Link href="/login" className="font-bold text-primary-blue hover:underline">
          &larr; Back to Log In
        </Link>
      </p>
    </div>
  );
}
