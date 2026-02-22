'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PasswordStrength from '@/components/auth/PasswordStrength';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import AuthShell from '@/components/auth/AuthShell';
import { useUser } from '@/contexts/UserContext';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { toast } from 'sonner';
import { persistentLog, clearPersistentLogs } from '@/lib/logger';
import { auth } from '@/lib/firebase';

export default function SignupPage() {
  const searchParams = useSearchParams();
  const { userDetails } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFormShaking, setIsFormShaking] = useState(false);
  const [validationCriteria, setValidationCriteria] = useState({
    minLength: false,
    hasUpper: false,
    hasNumber: false,
    hasSymbol: false,
  });

  const inviteToken = searchParams.get('token');
  const acceptInvitationMutation = useMutation(api.invitations.accept);

  useEffect(() => {
    if (userDetails) {
      setError('You already have an account. Please log in.');
    }
  }, [userDetails]);

  useEffect(() => {
    setValidationCriteria({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const allCriteriaMet = Object.values(validationCriteria).every(Boolean);

  const handleAuthSuccess = async () => {
    if (inviteToken) {
      try {
        await acceptInvitationMutation({ token: inviteToken });
        toast.success('Invitation accepted!', {
          description: 'Your partnership is confirmed. Welcome to DuoTrak!',
        });
        window.location.href = '/dashboard';
      } catch (err: any) {
        console.error('Failed to accept invitation:', err);
        toast.error('Partnership Error', {
          description: err.message || 'Failed to auto-accept invitation.',
        });
        window.location.href = '/onboarding/start';
      }
    } else {
      window.location.href = '/onboarding/start';
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!allCriteriaMet) {
      setIsFormShaking(true);
      setTimeout(() => setIsFormShaking(false), 500);
      return;
    }

    clearPersistentLogs();
    persistentLog('--- Starting Email Sign-Up ---');
    setIsLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      persistentLog('Email account created. Updating profile...');

      await updateProfile(userCredential.user, {
        displayName: fullName,
      });
      persistentLog('Profile updated with display name.');

      const idToken = await userCredential.user.getIdToken();
      const sessionResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to create session');
      }
      persistentLog('Session cookie created successfully.');

      await handleAuthSuccess();
    } catch (signupError: any) {
      persistentLog('!!! Email Sign-Up FAILED !!!', {
        errorMessage: signupError.message,
        errorCode: signupError.code,
        errorStack: signupError.stack,
      });
      let friendlyError = signupError.message || 'Failed to create account.';
      if (signupError.code === 'auth/email-already-in-use') {
        friendlyError = 'This email is already registered. Please log in.';
      }
      setError(friendlyError);
      toast.error(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    clearPersistentLogs();
    persistentLog('--- Starting Google Sign-Up ---');
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);

      const idToken = await result.user.getIdToken();
      const sessionResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      await handleAuthSuccess();
    } catch (signupError: any) {
      let friendlyError = 'An unexpected error occurred during Google Sign-Up.';
      if (signupError.code === 'auth/popup-blocked-by-browser') {
        friendlyError = 'Signup popup blocked. Please allow popups for this site and try again.';
      } else if (signupError.code === 'auth/popup-closed-by-user') {
        friendlyError = 'Signup canceled. You can try again whenever you are ready.';
      } else {
        friendlyError = signupError.message || 'Failed to sign up with Google.';
      }

      persistentLog('!!! Google Sign-Up Popup FAILED !!!', {
        errorMessage: signupError.message,
        errorCode: signupError.code,
        errorStack: signupError.stack,
      });
      setError(friendlyError);
      toast.error(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const shakeVariants = {
    shake: { x: [0, -10, 10, -10, 10, 0], transition: { duration: 0.5 } },
    initial: { x: 0 },
  };

  return (
    <AuthShell
      badge="Create Account"
      title="Start your duo streak"
      subtitle="Build goals with someone who keeps you honest and motivated."
      footer={
        <p>
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-landing-terracotta hover:text-landing-espresso">
            Log in
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <motion.form
          className="space-y-4"
          onSubmit={handleEmailSubmit}
          variants={shakeVariants}
          animate={isFormShaking ? 'shake' : 'initial'}
        >
          <label className="block space-y-1.5 text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-landing-espresso-light">Full name</span>
            <Input
              type="text"
              placeholder="Alex Rivera"
              required
              disabled={isLoading}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 rounded-xl border-landing-clay bg-landing-cream/40"
            />
          </label>

          <label className="block space-y-1.5 text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-landing-espresso-light">Email</span>
            <Input
              type="email"
              placeholder="you@example.com"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl border-landing-clay bg-landing-cream/40"
            />
          </label>

          <div className="space-y-1.5 text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-landing-espresso-light">Password</span>
            <Input
              type="password"
              placeholder="Create a strong password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`h-12 rounded-xl border-landing-clay bg-landing-cream/40 ${
                isFormShaking && !allCriteriaMet ? 'border-red-500 focus-visible:ring-red-400' : ''
              }`}
              disabled={isLoading}
            />
            <PasswordStrength criteria={validationCriteria} />
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-landing-espresso text-base font-bold text-landing-cream hover:bg-landing-terracotta"
            disabled={isLoading || !allCriteriaMet}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>

          <p className="text-xs leading-relaxed text-landing-espresso-light">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="font-semibold text-landing-terracotta hover:text-landing-espresso">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-semibold text-landing-terracotta hover:text-landing-espresso">
              Privacy Policy
            </Link>
            .
          </p>
        </motion.form>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-landing-clay" />
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-landing-espresso-light">or</span>
          <div className="h-px flex-1 bg-landing-clay" />
        </div>

        <GoogleSignInButton onClick={handleGoogleSignUp} text="Sign up with Google" disabled={isLoading} />
      </div>
    </AuthShell>
  );
}
