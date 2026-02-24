'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import ProfileSetupStep from './ProfileSetupStep';
import PreferencesStep from './PreferencesStep';
import InteractiveWaitingRoom from './InteractiveWaitingRoom';
import { useOnboardingGuard } from '@/hooks/useOnboardingGuard';
import FlowShell from '@/components/flow/FlowShell';
import FlowActionBar from '@/components/flow/FlowActionBar';

const steps = [
  { id: 'profile', title: 'Your Profile', description: 'Let your partner know who you are.', component: ProfileSetupStep },
  { id: 'preferences', title: 'Preferences', description: 'Customize your DuoTrak experience.', component: PreferencesStep },
  { id: 'waiting', title: 'Waiting Room', description: "Your invitation is sent! Now, let's wait for your partner.", component: InteractiveWaitingRoom },
];

export default function InviterOnboardingFlow() {
  const { isLoading: isUserLoading } = useOnboardingGuard();
  const { userDetails } = useUser();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>({
    profile: { fullName: '', bio: '' },
    preferences: { notifications: true, notificationTime: 'morning', privacy: 'partner-only' },
  });

  useEffect(() => {
    if (userDetails) {
      // Initialize step from localStorage
      const savedStep = localStorage.getItem('inviterOnboardingStep');
      if (userDetails.account_status === 'AWAITING_PARTNERSHIP' && savedStep) {
        const step = parseInt(savedStep, 10);
        setCurrentStep(step);
        // Mark previous steps as complete
        setCompletedSteps(Array.from({ length: step }, (_, i) => i));
      }

      setOnboardingData((prev: typeof onboardingData) => ({
        ...prev,
        profile: {
          fullName: userDetails.full_name || '',
          bio: userDetails.bio || '',
        },
      }));
    }
  }, [userDetails]);

  const updateData = useCallback((updates: any) => {
    setOnboardingData((prevData: any) => ({ ...prevData, ...updates }));
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      localStorage.setItem('inviterOnboardingStep', nextStep.toString());
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep(nextStep);
      setIsCurrentStepValid(false); // Reset validity for the next step
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIsCurrentStepValid(true); // Assume previous step was valid when going back
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep].component;

  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <FlowShell
      stepLabel={`Step ${currentStep + 1} of ${steps.length}`}
      title={steps[currentStep].title}
      subtitle={steps[currentStep].description}
      progress={progress}
      backHref="/invite-partner/pending"
      statusChip={currentStep === steps.length - 1 ? 'Waiting Room' : 'Onboarding'}
      actionBar={
        currentStep < steps.length - 1 ? (
          <FlowActionBar
            secondary={
              <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0 || isUserLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            }
            primary={
              <Button onClick={handleNext} disabled={!isCurrentStepValid || isUserLoading}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            }
          />
        ) : undefined
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
              completedSteps.includes(index)
                ? 'border-landing-sage/40 bg-landing-sage/15 text-landing-espresso'
                : index === currentStep
                  ? 'border-landing-terracotta/40 bg-landing-terracotta/15 text-landing-espresso'
                  : 'border-landing-clay bg-white text-landing-espresso-light'
            }`}
          >
            {completedSteps.includes(index) ? <Check className="h-3.5 w-3.5" /> : null}
            {step.title}
          </div>
        ))}
      </div>

      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CurrentStepComponent
              data={onboardingData}
              updateData={updateData}
              onValidationChange={setIsCurrentStepValid}
              onComplete={handleNext}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </FlowShell>
  );
}
