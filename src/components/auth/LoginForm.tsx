'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import Link from 'next/link';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import AuthShell from '@/components/auth/AuthShell';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { auth } from '@/lib/firebase';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('token');

  const acceptInvitationMutation = useMutation(api.invitations.accept);

  const handleAuthSuccess = async () => {
    if (inviteToken) {
      try {
        await acceptInvitationMutation({ token: inviteToken });
        toast.success('Invitation accepted!', {
          description: 'Your partnership is confirmed. Welcome to DuoTrak!',
        });
      } catch (err: any) {
        console.error('Failed to accept invitation:', err);
        toast.error('Partnership Error', {
          description: err.message || 'Failed to auto-accept invitation.',
        });
      }
    }

    window.location.href = '/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

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

      await handleAuthSuccess();
    } catch (authError: any) {
      const friendlyError = authError.code?.startsWith('auth/')
        ? 'Invalid email or password. Please try again.'
        : authError.message || 'Login failed. Please try again.';
      setError(friendlyError);
      toast.error(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
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
    } catch (err: any) {
      let friendlyError = 'An unexpected error occurred during Google Sign-In.';
      if (err.code === 'auth/popup-blocked-by-browser') {
        friendlyError = 'Login popup blocked. Please allow popups for this site and try again.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        friendlyError = 'Login canceled. You can try again whenever you are ready.';
      } else if (!err.code?.startsWith('auth/')) {
        friendlyError = err.message || 'Login failed. Please try again.';
      }
      setError(friendlyError);
      toast.error(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      badge="Welcome Back"
      title="Log in to your duo"
      subtitle="Jump back into your shared goals and keep the streak alive."
      footer={
        <p>
          New to DuoTrak?{' '}
          <Link href="/signup" className="font-bold text-landing-terracotta hover:text-landing-espresso">
            Create an account
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
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

          <label className="block space-y-1.5 text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-landing-espresso-light">Password</span>
            <Input
              type="password"
              placeholder="Enter your password"
              required
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl border-landing-clay bg-landing-cream/40"
            />
          </label>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm font-semibold text-landing-terracotta hover:text-landing-espresso">
              Forgot your password?
            </Link>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-landing-espresso text-base font-bold text-landing-cream hover:bg-landing-terracotta"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Log In'}
          </Button>
        </form>

        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-landing-clay" />
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-landing-espresso-light">or</span>
          <div className="h-px flex-1 bg-landing-clay" />
        </div>

        <GoogleSignInButton onClick={handleGoogleSignIn} text="Continue with Google" disabled={isLoading} />

        <p className="rounded-xl border border-landing-clay/70 bg-landing-sand/50 px-4 py-3 text-xs leading-relaxed text-landing-espresso-light">
          Secure sign-in with protected session cookies. Your account and partnership data stay under your control.
        </p>
      </div>
    </AuthShell>
  );
}
