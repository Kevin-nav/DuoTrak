'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import AnimatedTextCharacter from '@/components/ui/AnimatedTextCharacter';
import { 
  getAuth,
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
} from 'firebase/auth';
import { persistentLog, clearPersistentLogs } from '@/lib/logger';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext'; // Import useUser

export default function LoginForm() {
  const { isAuthenticating } = useUser(); // Get isAuthenticating state

  const [isLoading, setIsLoading] = useState(false); // Keep local loading for form submission
  const [error, setError] = useState('');
  const auth = getAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearPersistentLogs();
    persistentLog('--- Starting Email Sign-In ---');
    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      persistentLog('Email Sign-In Successful with Firebase. UserContext will handle navigation.');
      // No navigation here. UserContext will handle the redirect.
    } catch (error: any) {
      persistentLog('!!! Email Sign-In FAILED !!!', { 
        errorMessage: error.message, 
        errorCode: error.code, 
      });
      const friendlyError = 'Invalid email or password. Please try again.';
      setError(friendlyError);
      toast.error(friendlyError);
      setIsLoading(false); // Stop local loading on error
    }
    // Do NOT set isLoading to false on success, as the page will be redirecting via UserContext.
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      persistentLog('Google Sign-In Popup Successful with Firebase. UserContext will handle navigation.');
      // No navigation here. UserContext will handle the redirect.
    } catch (error: any) {
      let friendlyError = 'An unexpected error occurred during Google Sign-In.';
      if (error.code === 'auth/popup-blocked-by-browser') {
        friendlyError = 'Login popup blocked. Please allow popups for this site and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        friendlyError = 'Login cancelled. You can try again whenever you are ready.';
      }

      persistentLog('!!! Google Sign-In Popup FAILED !!!', { 
        errorMessage: error.message, 
        errorCode: error.code, 
      });
      setError(friendlyError);
      toast.error(friendlyError);
      setIsLoading(false); // Stop local loading on error
    }
  };

  // Determine if the form should be disabled (either local loading or global authenticating)
  const formDisabled = isLoading || isAuthenticating;

  return (
    <div className="w-full text-center animate-fadeInUp">
      <div className="flex justify-center">
        <AnimatedTextCharacter text="Welcome Back!" className="text-3xl font-bold text-charcoal mb-2" />
      </div>
      <p className="text-base text-stone-gray mb-8">Let's pick up where you left off.</p>

      <div className="w-full max-w-lg mx-auto">
        {error && <p className="mb-4 text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg py-2 px-4">{error}</p>}
        
        <form className="w-full space-y-4" onSubmit={handleSubmit}>
          <Input type="email" placeholder="Email Address" required disabled={formDisabled} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" required disabled={formDisabled} value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="w-full text-right -mt-2">
            <Link href="/forgot-password" className="text-sm font-medium text-primary-blue hover:underline">
              Forgot your password?
            </Link>
          </div>
          <Button type="submit" className="w-full !mt-5" disabled={formDisabled}>
            {formDisabled ? 'Signing In...' : 'Log In'}
          </Button>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-cool-gray"></div>
          <span className="mx-4 text-sm text-stone-gray">OR</span>
          <div className="flex-grow border-t border-cool-gray"></div>
        </div>

        <GoogleSignInButton onClick={handleGoogleSignIn} text="Sign in with Google" disabled={formDisabled}/>
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
