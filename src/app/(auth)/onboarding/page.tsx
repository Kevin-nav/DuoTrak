'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Loader2, Rocket, Users, Target } from 'lucide-react';
import Link from 'next/link';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

const onboardingSteps = [
  {
    icon: <Users className="w-12 h-12 text-primary-blue" />,
    title: 'Welcome to DuoTrak!',
    description: "You're about to start a shared journey of motivation and success with your partner.",
  },
  {
    icon: <Target className="w-12 h-12 text-primary-blue" />,
    title: 'Set Shared Goals',
    description: 'Create goals together, assign tasks, and visualize your joint progress every step of the way.',
  },
  {
    icon: <Rocket className="w-12 h-12 text-primary-blue" />,
    title: 'Achieve More, Together',
    description: "Stay accountable, celebrate victories, and build momentum. Let's get started!",
  },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [currentStep, setCurrentStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Use Convex mutation for accepting invitation
  const acceptInvitationMutation = useMutation(api.invitations.accept);

  const isLastStep = currentStep === onboardingSteps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleFinalize = async () => {
    if (!token) {
      toast.error('Invitation token is missing. Cannot complete setup.');
      return;
    }
    if (!termsAccepted) {
      toast.error('You must agree to the Terms of Service to continue.');
      return;
    }

    setIsProcessing(true);
    try {
      // Accept the invitation via Convex - this creates the partnership
      await acceptInvitationMutation({ token });
      toast.success('Partnership created successfully!');

      // Clean up localStorage
      localStorage.removeItem('duotrak-partner-info');
      localStorage.removeItem('duotrak-goal-drafts');
      localStorage.removeItem('duotrak-invitation-token');
      localStorage.removeItem('inviterOnboardingStep');

      // Redirect to the dashboard
      router.push('/dashboard');
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('already have a partner')) {
        toast.error('You are already in a partnership. Redirecting to dashboard...');
        router.push('/dashboard');
        return;
      }
      if (error.message?.includes('no longer valid')) {
        toast.error('This invitation has already been accepted or is no longer valid.');
        return;
      }
      if (error.message?.includes('expired')) {
        toast.error('This invitation has expired. Please ask your partner to send a new one.');
        return;
      }
      toast.error(error.message || 'Failed to complete setup. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const { icon, title, description } = onboardingSteps[currentStep];

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          {icon}
        </motion.div>
        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLastStep && (
          <div className="flex items-center space-x-2 justify-center mt-6">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the{' '}
              <Link href="/terms" className="underline text-primary-blue">
                Terms of Service
              </Link>
            </label>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        {isLastStep ? (
          <Button onClick={handleFinalize} className="w-full" disabled={!termsAccepted || isProcessing}>
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Complete Setup
          </Button>
        ) : (
          <Button onClick={handleNext} className="w-full">
            Next
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function OnboardingPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen p-4">
      <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        <OnboardingContent />
      </Suspense>
    </div>
  );
}
