'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import ProfileSetupStep from './ProfileSetupStep';
import PreferencesStep from './PreferencesStep';
import InteractiveWaitingRoom from './InteractiveWaitingRoom';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

const steps = [
  { id: 'profile', title: 'Your Profile', description: 'Let your partner know who you are.', component: ProfileSetupStep },
  { id: 'preferences', title: 'Preferences', description: 'Customize your DuoTrak experience.', component: PreferencesStep },
  { id: 'waiting', title: 'Waiting Room', description: "Your invitation is sent! Now, let's wait for your partner.", component: InteractiveWaitingRoom },
];

export default function InviterOnboardingFlow() {
  const { userDetails, isLoading: isUserLoading, refetchUserDetails } = useUser();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>({
    profile: { fullName: '', bio: '', timezone: 'UTC' },
    preferences: { notifications: true, notificationTime: 'morning', theme: 'system', privacy: 'partner-only' },
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

      setOnboardingData(prev => ({
        ...prev,
        profile: {
          fullName: userDetails.full_name || '',
          bio: userDetails.bio || '',
          timezone: userDetails.timezone || 'UTC',
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Your DuoTrak Setup</h1>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                      completedSteps.includes(index)
                        ? "bg-green-500 text-white"
                        : index === currentStep
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {completedSteps.includes(index) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 hidden sm:block">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent
                {...(currentStep === steps.length - 1
                  ? { data: onboardingData, updateData }
                  : { data: onboardingData, updateData, onValidationChange: setIsCurrentStepValid, onComplete: handleNext })}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex justify-end">
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || isUserLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={!isCurrentStepValid || isUserLoading}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!isCurrentStepValid || isUserLoading}>
                Go to Waiting Room
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
