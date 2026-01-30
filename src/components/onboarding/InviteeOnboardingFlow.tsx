'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { useInvitation } from '@/contexts/invitation-context';
import { useUser } from '@/contexts/UserContext';
import WelcomeStep from './WelcomeStep';
import GoalDiscoveryStep from './GoalDiscoveryStep';
import IntelligentGoalCreationStep from './IntelligentGoalCreationStep';
import PlanReviewStep from './PlanReviewStep';
import FirstTaskStep from './FirstTaskStep';
import DraftReviewStep from './DraftReviewStep';
import { GoalCreate } from '@/schemas/goal';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const baseSteps = [
  {
    id: 'welcome',
    title: 'Welcome',
    component: WelcomeStep,
  },
  {
    id: 'discovery',
    title: 'Discover',
    component: GoalDiscoveryStep,
  },
  {
    id: 'creation',
    title: 'Define Goal',
    component: IntelligentGoalCreationStep,
  },
  {
    id: 'reviewPlan',
    title: 'Review Plan',
    component: PlanReviewStep,
  },
  {
    id: 'task',
    title: 'First Task',
    component: FirstTaskStep,
  },
];

export default function InviteeOnboardingFlow() {
  const queryClient = useQueryClient();
  const { userDetails } = useUser(); // Get user details to access partner's name
  const { goalDrafts } = useInvitation(); // Get drafts from context

  // Dynamically construct steps based on whether drafts exist
  const steps = [
    baseSteps[0], // Welcome step is always first
    ...(goalDrafts && goalDrafts.length > 0
      ? [{ id: 'review', title: 'Review Drafts', component: DraftReviewStep }]
      : []), // Add review step if drafts exist
    ...baseSteps.slice(1), // Add the rest of the steps
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [onboardingData, setOnboardingData] = useState<{
    selectedCategories: string[];
    goalTitle: string;
    goalDescription: string;
    firstTask: {
      title: string;
      description: string;
      scheduledTime: string;
      requiresVerification: boolean;
    };
    generatedPlan: { goalType: string; tasks: any[] } | null;
  }>({
    selectedCategories: [],
    goalTitle: '',
    goalDescription: '',
    firstTask: {
      title: '',
      description: '',
      scheduledTime: '',
      requiresVerification: false,
    },
    generatedPlan: null,
  });
  const [isStepValid, setIsStepValid] = useState(false);


  const { mutate: completeOnboarding, isPending: isCompleting } = useMutation({
    mutationFn: () => apiClient.completePartneredOnboarding(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
    onError: (error) => {
      toast.error('An error occurred', { description: error.message });
    },
  });

  const { mutate: createGoal, isPending: isCreating } = useMutation({
    mutationFn: (data: any) => apiClient.createOnboardingGoal(data.goal, data.task),
    onSuccess: () => {
      toast.success('Your first goal has been created!');
      completeOnboarding();
    },
    onError: (error) => {
      toast.error('Failed to create goal', { description: error.message });
    },
  });

  const updateData = useCallback((updates: any) => {
    setOnboardingData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep(currentStep + 1);
      setIsStepValid(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIsStepValid(true);
    }
  };

  const handleDraftSelected = (draft: any) => {
    // Populate data from the selected draft
    updateData({ goalTitle: draft.title, goalDescription: draft.description });
    // Find the index of the final task step and jump to it
    const taskStepIndex = steps.findIndex(step => step.id === 'task');
    if (taskStepIndex !== -1) {
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep(taskStepIndex);
      setIsStepValid(false);
    }
  };

  const handleCreateNew = () => {
    // Simply move to the next step in the flow, which will be the discovery step
    handleNext();
  };

  const handlePlanGenerated = (plan: any) => {
    updateData({ generatedPlan: plan });
    handleNext();
  };

  const handleFinish = () => {
    const { generatedPlan, goalTitle } = onboardingData;
    if (!generatedPlan) {
      toast.error("No plan generated. Please go back and create a plan.");
      return;
    }

    const goalData: GoalCreate = {
      name: goalTitle,
      category: generatedPlan.goalType, // Using goalType as category
      icon: null, // Default icon
      color: null, // Default color
      isHabit: generatedPlan.goalType === 'Habit',
      tasks: generatedPlan.tasks.map((task: any) => ({
        name: task.taskName,
        description: task.description,
        repeatFrequency: task.repeatFrequency,
      })),
    };

    createGoal({ goal: goalData });
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep].component;
  const isPending = isCompleting || isCreating;

  const currentStepProps: any = {
    data: onboardingData,
    updateData,
    onValidationChange: setIsStepValid,
  };

  if (steps[currentStep].id === 'review') {
    Object.assign(currentStepProps, {
      drafts: goalDrafts,
      partnerName: userDetails?.partner_full_name || 'Your partner',
      onSelectDraft: handleDraftSelected,
      onCreateNew: handleCreateNew
    });
  } else if (steps[currentStep].id === 'creation') {
    currentStepProps.onPlanGenerated = handlePlanGenerated;
  } else if (steps[currentStep].id === 'reviewPlan') {
    currentStepProps.plan = onboardingData.generatedPlan;
  }


  return (
    <div className="min-h-screen bg-[var(--theme-background)] flex flex-col font-sans">
      <div className="bg-[var(--theme-card)] shadow-sm border-b border-[var(--theme-border)]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-[var(--theme-foreground)]">Set Up Your First Goal</h1>
            <span className="text-sm text-[var(--theme-muted-foreground)]">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <div className="space-y-2">
            <Progress value={progress} className="h-2 bg-[var(--theme-muted)]" />
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${completedSteps.includes(index)
                      ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)]'
                      : index === currentStep
                        ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] ring-2 ring-[var(--theme-primary)] ring-offset-2'
                        : 'bg-[var(--theme-muted)] text-[var(--theme-muted-foreground)]'
                      }`}
                  >
                    {completedSteps.includes(index) ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className="text-xs text-[var(--theme-muted-foreground)] mt-1 hidden sm:block">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
              <CurrentStepComponent {...currentStepProps} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-[var(--theme-background)] border-t border-[var(--theme-border)] p-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button variant="ghost" onClick={handleSkip} disabled={isPending} className="text-[var(--theme-muted-foreground)] hover:text-[var(--theme-foreground)]">
            Skip for now
          </Button>
          <div className="flex gap-4">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0 || isPending} className="border-[var(--theme-border)]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={!isStepValid || isPending} className="bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] hover:bg-[var(--theme-primary)]/90">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={!isStepValid || isPending} className="bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] hover:bg-[var(--theme-primary)]/90">
                {isPending ? 'Finishing...' : 'Finish & Create Goal'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
