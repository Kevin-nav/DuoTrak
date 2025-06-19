'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/Input';
import AnimatedTextCharacter from '@/components/ui/AnimatedTextCharacter';
import PasswordStrength from '@/components/auth/PasswordStrength';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { setAuthCookie } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isFormShaking, setIsFormShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationCriteria, setValidationCriteria] = useState({
    minLength: false,
    hasUpper: false,
    hasNumber: false,
    hasSymbol: false,
  });

  useEffect(() => {
    setValidationCriteria({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const allCriteriaMet = Object.values(validationCriteria).every(Boolean);

  const handleEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!allCriteriaMet) {
      setIsFormShaking(true);
      setTimeout(() => setIsFormShaking(false), 500);
      return;
    }

    setIsLoading(true);
    // Simulate successful signup
    setTimeout(() => {
      setAuthCookie();
      router.push('/invite-partner');
    }, 1000);
  };

  const handleGoogleSignUp = () => {
    setIsLoading(true);
    setError(null);
    // Simulate API call to Google
    setTimeout(() => {
      const isSuccess = Math.random() > 0.2; // 80% success rate
      if (isSuccess) {
        setAuthCookie();
        router.push('/invite-partner');
      } else {
        setError('Google Sign-Up failed. Please try again.');
        setIsLoading(false);
      }
    }, 1500);
  };
  
  const shakeVariants = {
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5 },
    },
    initial: {
      x: 0,
    },
  };

  return (
    <div className="text-center animate-fadeInUp">
      <div className="flex justify-center">
        <AnimatedTextCharacter text="Create your account" className="text-3xl font-bold text-charcoal mb-2" />
      </div>
      <p className="text-base text-stone-gray mb-8">Let's get started on this journey together.</p>

      <div className="mx-auto max-w-lg">
        {error && <p className="mb-4 text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg py-2 px-4">{error}</p>}

        <motion.form
          className="space-y-4"
          onSubmit={handleEmailSubmit}
          variants={shakeVariants}
          animate={isFormShaking ? 'shake' : 'initial'}
        >
          <Input type="text" placeholder="Full Name" required disabled={isLoading} />
          <Input type="email" placeholder="Email Address" required disabled={isLoading} />
          <div>
            <Input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${isFormShaking && !allCriteriaMet ? 'border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            />
            <div className="mt-2 text-left">
              <PasswordStrength criteria={validationCriteria} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
          <p className="text-xs text-stone-gray px-4">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-primary-blue">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-primary-blue">
              Privacy Policy
            </Link>
            .
          </p>
        </motion.form>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-cool-gray"></div>
          <span className="mx-4 text-sm text-stone-gray">OR</span>
          <div className="flex-grow border-t border-cool-gray"></div>
        </div>

        <GoogleSignInButton onClick={handleGoogleSignUp} text="Sign up with Google" />
      </div>

      <p className="text-sm text-stone-gray mt-6">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-primary-blue hover:underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
