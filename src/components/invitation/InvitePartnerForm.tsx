'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Eye, Heart } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useInvitation } from '@/contexts/invitation-context';
import { useRouter } from 'next/navigation';
import { persistentLog } from '@/lib/logger';
import CelebrationAnimation from '@/components/celebration-animation';

// Defines the validation schema for the form fields.
const formSchema = z.object({
  partnerName: z.string().min(1, { message: "Partner's name is required." }),
  partnerEmail: z.string().email({ message: "Invalid email address." }),
  customMessage: z.string().optional(),
});

// Creates a TypeScript type from the schema.
type FormData = z.infer<typeof formSchema>;

export default function InvitePartnerForm() {
  const { sendInvitation } = useUser();
  const { setInvitationToken } = useInvitation();
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [invitationSent, setInvitationSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Watches form fields to update the UI in real-time (for the preview).
  const { partnerName, customMessage } = watch();

  const onSubmit = async (data: FormData) => {
    persistentLog('Invite partner form submitted.', data);
    setError('root', { message: '' }); // Clear previous root errors

    try {
      const response = await sendInvitation(data.partnerEmail, data.partnerName, data.customMessage);
      if (response && response.invitation && response.invitation.invitation_token) {
        setInvitationToken(response.invitation.invitation_token);
        persistentLog('Invitation successfully created and token stored.');
      } else {
        persistentLog('Invitation response did not contain a token.', { response });
        throw new Error('Could not retrieve invitation details. Please try again.');
      }
      
      setInvitationSent(true);
      // Redirect after 3 seconds to allow the celebration animation to play.
      setTimeout(() => router.push('/onboarding/inviter'), 3000);
    } catch (err: any) {
      persistentLog('Error inviting partner.', { error: err.message, stack: err.stack });
      setError('root', { message: err.message || 'An unexpected error occurred. Please try again.' });
    }
  };

  // Default text for the invitation email if no custom message is provided.
  const defaultMessage = `You've been invited to team up on DuoTrak!\n\nDuoTrak is a revolutionary new app designed to help partners like you achieve their goals together. It's all about teamwork, motivation, and celebrating your wins, big and small.\n\nReady to join forces and make amazing things happen? We can't wait to see what you'll accomplish together.`;

  // If the invitation has been sent, show the celebration animation.
  if (invitationSent) {
    return <CelebrationAnimation isVisible={true} type="goal-reached" message="Invitation Sent!" />;
  }

  // Otherwise, render the form.
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-5">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-landing-espresso-light">Partner's Name *</label>
            <Input {...register('partnerName')} placeholder="e.g., Alex" className="h-11 border-landing-clay bg-landing-cream/40" />
            {errors.partnerName && <p className="text-red-500 text-sm mt-1 text-left">{errors.partnerName.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-landing-espresso-light">Partner's Email *</label>
            <Input type="email" {...register('partnerEmail')} placeholder="alex@example.com" className="h-11 border-landing-clay bg-landing-cream/40" />
            {errors.partnerEmail && <p className="text-red-500 text-sm mt-1 text-left">{errors.partnerEmail.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-landing-espresso-light">Personal Message (Optional)</label>
          <Textarea
            {...register('customMessage')}
            placeholder="Add a personal touch to your invitation..."
            rows={3}
            className="resize-none border-landing-clay bg-landing-cream/40"
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2 border-landing-clay">
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide Preview' : 'Preview Email'}
          </Button>
          <Button type="submit" className="w-full bg-landing-espresso text-landing-cream hover:bg-landing-terracotta" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>

      {/* Email Preview Section */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl border border-landing-clay bg-landing-cream/60 p-5"
        >
          <div className="overflow-hidden rounded-lg border border-landing-clay bg-white shadow-sm">
            <div className="bg-landing-espresso p-4 text-landing-cream">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <span className="font-semibold">DuoTrak Invitation</span>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">You're invited to join DuoTrak!</h3>
              <div className="whitespace-pre-line text-gray-700 text-sm leading-relaxed mb-6 text-left">
                {customMessage ? (
                  <>
                    <p className="font-semibold">A message from {partnerName || 'your friend'}:</p>
                    <blockquote className="border-l-4 border-gray-200 pl-4 my-2">{customMessage}</blockquote>
                    <hr className="my-4" />
                    <p>{defaultMessage}</p>
                  </>
                ) : (
                  <p>{defaultMessage}</p>
                )}
              </div>
              <Button className="w-full bg-landing-espresso text-landing-cream hover:bg-landing-terracotta">
                Accept Invitation & Join DuoTrak
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Root Error Display */}
      {errors.root && (
        <Alert variant="destructive" className="mt-4 text-left">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}
    </motion.div>
  );
}
