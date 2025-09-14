'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import AnimatedTextCharacter from '@/components/ui/AnimatedTextCharacter';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleAuthSuccess = async (firebaseToken: string) => {
    try {
      const response = await apiClient.post('/api/v1/auth/session-login', {
        firebase_token: firebaseToken
      });

      if (typeof window !== 'undefined' && response.csrf_token) {
        localStorage.setItem('csrf_token', response.csrf_token);
      }

      // Manually set the user data in the React Query cache
      // This avoids the need for a follow-up request and prevents the race condition
      queryClient.setQueryData(['user', 'me'], response.user);
      
      // This forces a full page reload, which is necessary to ensure the
      // new session cookie is sent to the server for the middleware to read,
      // and guarantees a fresh data fetch on the dashboard.
      window.location.href = '/dashboard';

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during login.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseToken = await userCredential.user.getIdToken();
      await handleAuthSuccess(firebaseToken);
    } catch (error) {
      setError('Invalid email or password. Please try again.');
      toast.error('Invalid email or password. Please try again.');
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
      const firebaseToken = await result.user.getIdToken();
      await handleAuthSuccess(firebaseToken);
    } catch (err: any) {
      let friendlyError = 'An unexpected error occurred during Google Sign-In.';
      if (err.code === 'auth/popup-blocked-by-browser') {
        friendlyError = 'Login popup blocked. Please allow popups for this site and try again.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        friendlyError = 'Login cancelled. You can try again whenever you are ready.';
      }
      setError(friendlyError);
      toast.error(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full text-center animate-fadeInUp">
      <div className="flex justify-center">
        <AnimatedTextCharacter text="Welcome Back!" className="text-3xl font-bold text-charcoal mb-2" />
      </div>
      <p className="text-base text-stone-gray mb-8">Let's pick up where you left off.</p>

      <div className="w-full max-w-lg mx-auto">
        {error && <p className="mb-4 text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg py-2 px-4">{error}</p>}
        
        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          <Input type="email" placeholder="Email Address" required disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" required disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)} />
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

        <GoogleSignInButton onClick={handleGoogleSignIn} text="Sign in with Google" disabled={isLoading}/>
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