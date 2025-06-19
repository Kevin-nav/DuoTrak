'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/Input';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { setAuthCookie } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Simulate successful login
    setAuthCookie();
    router.push('/dashboard');
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setError(null);
    // Simulate API call to Google
    setTimeout(() => {
      // Simulate a successful sign-in
      const isSuccess = Math.random() > 0.2; // 80% success rate
      if (isSuccess) {
        setAuthCookie();
        router.push('/dashboard');
      } else {
        setError('Google Sign-In failed. Please try again.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="text-center animate-fadeInUp">
      <h1 className="text-2xl font-bold text-charcoal mb-2">Welcome Back!</h1>
      <p className="text-base text-stone-gray mb-8">Let's pick up where you left off.</p>

      <div className="mx-auto max-w-lg">
        {error && <p className="mb-4 text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg py-2 px-4">{error}</p>}
        
        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          <Input type="email" placeholder="Email Address" required disabled={isLoading} />
          <Input type="password" placeholder="Password" required disabled={isLoading} />
          <div className="w-full text-right -mt-2">
            <Link href="/forgot-password" className="text-sm font-medium text-primary-blue hover:underline">
              Forgot your password?
            </Link>
          </div>
          <Button type="submit" className="w-full !mt-5" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Log In'}
          </Button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-cool-gray"></div>
          <span className="mx-4 text-sm text-stone-gray">OR</span>
          <div className="flex-grow border-t border-cool-gray"></div>
        </div>

        <GoogleSignInButton onClick={handleGoogleSignIn} text="Sign in with Google" />
      </div>

      <p className="text-sm text-stone-gray mt-6">
        Don't have an account?{' '}
        <Link href="/signup" className="font-bold text-primary-blue hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
