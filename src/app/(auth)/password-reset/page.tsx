'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/Input';
import AnimatedTextCharacter from '@/components/ui/AnimatedTextCharacter';
import PasswordStrength from '@/components/auth/PasswordStrength';

// TODO: Integrate with Supabase auth
// This page should handle the 'PASSWORD_RECOVERY' auth event.
// The token from the email link will be in the URL fragment.
// Use supabase.auth.onAuthStateChange to capture the session
// and then call supabase.auth.updateUser({ password: newPassword })

export default function PasswordResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationCriteria, setValidationCriteria] = useState({
    minLength: false,
    hasUpper: false,
    hasNumber: false,
    hasSymbol: false,
  });
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setValidationCriteria({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[^A-Za-z0-9]/.test(password),
    });
    setPasswordsMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  const allCriteriaMet = Object.values(validationCriteria).every(Boolean);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!allCriteriaMet || !passwordsMatch) {
      if (!passwordsMatch) {
        setError('Passwords do not match.');
      }
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setMessage('Your password has been successfully updated.');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="text-center animate-fadeInUp">
      <div className="flex justify-center">
        <AnimatedTextCharacter text="Reset Your Password" className="text-3xl font-bold text-charcoal mb-2" />
      </div>
      <p className="text-base text-stone-gray mb-8">Choose a new, strong password.</p>

      <div className="mx-auto max-w-lg">
        {message && (
          <div className="text-center">
            <p className="mb-4 text-sm text-green-700 bg-green-100 border border-green-300 rounded-lg py-3 px-4">{message}</p>
            <Link href="/login">
              <Button className="w-full">Proceed to Log In</Button>
            </Link>
          </div>
        )}

        {error && <p className="mb-4 text-sm text-red-600 bg-red-100 border border-red-300 rounded-lg py-3 px-4">{error}</p>}

        {!message && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Input
                type="password"
                placeholder="New Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <div className="mt-2 text-left">
                <PasswordStrength criteria={validationCriteria} />
              </div>
            </div>
            <Input
              type="password"
              placeholder="Confirm New Password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={!passwordsMatch && confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading || !allCriteriaMet || !passwordsMatch}>
              {isLoading ? 'Resetting...' : 'Set New Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
