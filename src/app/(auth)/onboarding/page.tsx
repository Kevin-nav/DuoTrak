'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Rocket, Target, Users } from 'lucide-react';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { api } from '../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import FlowShell from '@/components/flow/FlowShell';
import FlowActionBar from '@/components/flow/FlowActionBar';

const onboardingSteps = [
  {
    icon: Users,
    title: 'Welcome to DuoTrak',
    description: "You are about to start a shared journey of motivation and success with your partner.",
  },
  {
    icon: Target,
    title: 'Set shared goals',
    description: 'Create goals together, assign tasks, and track progress with accountability.',
  },
  {
    icon: Rocket,
    title: 'Launch together',
    description: 'Stay consistent, celebrate wins, and build long-term momentum as a duo.',
  },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [currentStep, setCurrentStep] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const acceptInvitationMutation = useMutation(api.invitations.accept);

  const isLastStep = currentStep === onboardingSteps.length - 1;
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;
  const Icon = onboardingSteps[currentStep].icon;

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
      await acceptInvitationMutation({ token });
      toast.success('Partnership created successfully!');
      localStorage.removeItem('duotrak-partner-info');
      localStorage.removeItem('duotrak-goal-drafts');
      localStorage.removeItem('duotrak-invitation-token');
      localStorage.removeItem('inviterOnboardingStep');
      router.push('/dashboard');
    } catch (error: any) {
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

  return (
    <FlowShell
      stepLabel={`Step ${currentStep + 1} of ${onboardingSteps.length}`}
      title={onboardingSteps[currentStep].title}
      subtitle={onboardingSteps[currentStep].description}
      progress={progress}
      statusChip={isLastStep ? 'Ready to complete' : 'Onboarding'}
      actionBar={
        <FlowActionBar
          primary={
            isLastStep ? (
              <Button onClick={handleFinalize} disabled={!termsAccepted || isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Complete Setup
              </Button>
            ) : (
              <Button onClick={() => setCurrentStep((prev) => prev + 1)}>Next</Button>
            )
          }
        />
      }
    >
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-landing-terracotta text-white">
          <Icon className="h-10 w-10" />
        </div>

        <div className="mx-auto max-w-lg text-sm text-landing-espresso-light">
          This quick setup makes sure both partners start with clear expectations and shared motivation.
        </div>

        {isLastStep ? (
          <div className="mx-auto mt-4 flex max-w-md items-start gap-3 rounded-xl border border-landing-clay bg-landing-cream/50 p-4 text-left">
            <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
            <label htmlFor="terms" className="text-sm leading-relaxed text-landing-espresso-light">
              I agree to the{' '}
              <Link href="/terms" className="font-semibold text-landing-terracotta hover:text-landing-espresso">
                Terms of Service
              </Link>{' '}
              and understand this will create a partnership.
            </label>
          </div>
        ) : null}
      </div>
    </FlowShell>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-landing-cream">
          <Loader2 className="h-8 w-8 animate-spin text-landing-terracotta" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
