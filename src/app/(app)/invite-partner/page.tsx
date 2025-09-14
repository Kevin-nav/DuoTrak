'use client';

import React from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { persistentLog } from '@/lib/logger';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Define the Zod schema for form validation
const formSchema = z.object({
  partnerName: z.string().min(1, { message: "Partner's name is required." }),
  partnerEmail: z.string().email({ message: "Invalid email address." }),
});

type FormData = z.infer<typeof formSchema>;

export default function InvitePartnerPage() {
  const { userDetails, isLoading: isUserLoading, sendInvitation } = useUser();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    persistentLog('Invite partner form submitted.', data);
    setError('root', { message: '' }); // Clear previous root errors

    try {
      await sendInvitation(data.partnerEmail, data.partnerName);
      persistentLog('Invitation successfully created. Redirecting to inviter setup page.');
      router.push('/onboarding/setup');

    } catch (err: any) {
      persistentLog('Error inviting partner.', { error: err.message, stack: err.stack });
      setError('root', { message: err.message });
    }
  };

  // While checking user status, show a loading state.
  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="text-center animate-fadeInUp">
      <div className="w-24 h-24 bg-accent-light-blue rounded-full mx-auto mb-6 flex items-center justify-center text-4xl">🤝</div>
      <h1 className="text-2xl font-bold text-charcoal mb-2">Invite Your Partner</h1>
      <p className="text-base text-stone-gray mb-8">Enter your partner's name and email to send them an invitation.</p>

      <div className="mx-auto max-w-lg">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input
              type="text"
              placeholder="Partner's Name"
              {...register('partnerName')}
              disabled={isSubmitting}
            />
            {errors.partnerName && (
              <p className="text-red-500 text-sm mt-1 text-left">{errors.partnerName.message}</p>
            )}
          </div>
          <div>
            <Input
              type="email"
              placeholder="Partner's Email Address"
              {...register('partnerEmail')}
              disabled={isSubmitting}
            />
            {errors.partnerEmail && (
              <p className="text-red-500 text-sm mt-1 text-left">{errors.partnerEmail.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </form>

        {errors.root && (
          <Alert variant="destructive" className="mt-4 text-left">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errors.root.message}</AlertDescription>
          </Alert>
        )}

      </div>
    </div>
  );
}
