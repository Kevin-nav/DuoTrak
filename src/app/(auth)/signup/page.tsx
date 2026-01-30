'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AnimatedTextCharacter from '@/components/ui/AnimatedTextCharacter';
import PasswordStrength from '@/components/auth/PasswordStrength';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
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
  const router = useRouter();
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

  // Convex mutation for accepting invitations
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

  /**
   * With Convex, auth state syncs automatically via:
   * 1. ConvexProviderWithAuth in the layout detects Firebase auth
   * 2. UserSync component stores/updates user in Convex DB
   * 3. UserContext uses useQuery(api.users.current) for reactive state
   */
  const handleAuthSuccess = async () => {
    if (inviteToken) {
      try {
        await acceptInvitationMutation({ token: inviteToken });
        toast.success("Invitation accepted!", {
          description: "Your partnership is confirmed. Welcome to DuoTrak!",
        });
        window.location.href = '/dashboard';
      } catch (err: any) {
        console.error('Failed to accept invitation:', err);
        toast.error('Partnership Error', {
          description: err.message || 'Failed to auto-accept invitation.'
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

      await handleAuthSuccess();

    } catch (error: any) {
      persistentLog('!!! Email Sign-Up FAILED !!!', {
        errorMessage: error.message,
        errorCode: error.code,
        errorStack: error.stack
      });
      let friendlyError = error.message || 'Failed to create account.';
      if (error.code === 'auth/email-already-in-use') {
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
      await signInWithPopup(auth, provider);
      persistentLog('Google Sign-Up Popup Successful');
      await handleAuthSuccess();

    } catch (error: any) {
      let friendlyError = 'An unexpected error occurred during Google Sign-Up.';
      if (error.code === 'auth/popup-blocked-by-browser') {
        friendlyError = 'Signup popup blocked. Please allow popups for this site and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        friendlyError = 'Signup cancelled. You can try again whenever you are ready.';
      } else {
        friendlyError = error.message || 'Failed to sign up with Google.';
      }

      persistentLog('!!! Google Sign-Up Popup FAILED !!!', {
        errorMessage: error.message,
        errorCode: error.code,
        errorStack: error.stack
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
    <div className="w-full text-center animate-fadeInUp">
      <div className="flex justify-center">
        <AnimatedTextCharacter text="Create your account" className="text-3xl font-bold text-charcoal mb-2" />
      </div>
      <p className="text-base text-stone-gray mb-8">Let's get started on this journey together.</p>

      <div className="w-full max-w-lg mx-auto">
        {error && <p className="mb-4 text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg py-2 px-4">{error}</p>}

        <motion.form
          className="space-y-4"
          onSubmit={handleEmailSubmit}
          variants={shakeVariants}
          animate={isFormShaking ? 'shake' : 'initial'}
        >
          <Input type="text" placeholder="Full Name" required disabled={isLoading} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input type="email" placeholder="Email Address" required disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)} />
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
          <Button type="submit" className="w-full" disabled={isLoading || !allCriteriaMet}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
          <p className="text-xs text-stone-gray px-4">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-primary-blue">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-primary-blue">Privacy Policy</Link>.
          </p>
        </motion.form>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-cool-gray"></div>
          <span className="mx-4 text-sm text-stone-gray">OR</span>
          <div className="flex-grow border-t border-cool-gray"></div>
        </div>

        <GoogleSignInButton onClick={handleGoogleSignUp} text="Sign up with Google" disabled={isLoading} />
      </div>

      <p className="text-sm text-stone-gray mt-6">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-primary-blue hover:underline">Log In</Link>
      </p>
    </div>
  );
}