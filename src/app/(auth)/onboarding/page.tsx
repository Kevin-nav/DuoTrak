'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Loader2, Rocket, Users, Target } from 'lucide-react';
import Link from 'next/link';

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
      // Step 1: Accept the invitation to form the partnership
      await apiClient.acceptInvitation(token);
      toast.success('Partnership created successfully!');

      // Step 2: Mark onboarding as complete
      // This is implicitly handled by the backend upon partnership creation,
      // but we could add an explicit call if needed, e.g., apiClient.completeOnboarding();
      // For now, we assume the backend sets the flag.

      // Step 3: Redirect to the dashboard
      router.push('/dashboard');
    } catch (error: any) {
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
        <div className="container mx-auto flex items-center justify-center min-h-screen">
            <Suspense fallback={<div>Loading...</div>}>
                <OnboardingContent />
            </Suspense>
        </div>
    )
}
