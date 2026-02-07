'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { useInvitation } from '@/contexts/invitation-context';
import { useUser } from '@/contexts/UserContext';
import QuickWelcomeStep from './QuickWelcomeStep';
import GoalSelectionStep from './GoalSelectionStep';
import FirstTaskStep from './FirstTaskStep';
import IntelligentGoalCreationStep from './IntelligentGoalCreationStep';
import { GoalCreate } from '@/schemas/goal';
import { Check, ArrowLeft, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface GoalDraft {
  title: string;
  description: string;
  category: string;
  frequency?: string;
}

// Streamlined 3-step flow
const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'goal', title: 'Choose Goal' },
  { id: 'task', title: 'First Task' },
];

export default function InviteeOnboardingFlow() {
  const queryClient = useQueryClient();
  const { userDetails } = useUser();
  const { goalDrafts, clearAllInvitationData } = useInvitation();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isStepValid, setIsStepValid] = useState(false);
  const [showCustomGoal, setShowCustomGoal] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  // Onboarding data state
  const [onboardingData, setOnboardingData] = useState<{
    nickname: string;
    goalTitle: string;
    selectedGoal: GoalDraft | null;
    customGoal: GoalDraft | null;
    generatedPlan: { goalType: string; tasks: any[] } | null;
    firstTask: {
      title: string;
      description: string;
      scheduledTime: string;
      requiresVerification: boolean;
    };
  }>({
    nickname: '',
    goalTitle: '',
    selectedGoal: null,
    customGoal: null,
    generatedPlan: null,
    firstTask: {
      title: '',
      description: '',
      scheduledTime: '',
      requiresVerification: false,
    },
  });

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
      setXpEarned((prev) => prev + 25); // +25 XP for first task
      toast.success('Your first goal has been created!');
      completeOnboarding();
      clearAllInvitationData();
    },
    onError: (error) => {
      toast.error('Failed to create goal', { description: error.message });
    },
  });

  const updateData = useCallback((updates: Partial<typeof onboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      // Award XP on step completion
      if (currentStep === 0) setXpEarned((prev) => prev + 50); // +50 XP for welcome
      if (currentStep === 1) setXpEarned((prev) => prev + 100); // +100 XP for goal selection

      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep(currentStep + 1);
      setIsStepValid(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setIsStepValid(true);
      setShowCustomGoal(false);
    }
  };

  const handleGoalSelected = (goal: GoalDraft) => {
    updateData({
      selectedGoal: goal,
      goalTitle: goal.title,
      generatedPlan: {
        goalType: goal.category,
        tasks: [
          {
            taskName: `Start ${goal.title.toLowerCase()}`,
            description: goal.description,
            repeatFrequency: goal.frequency || 'daily',
          },
        ],
      },
    });
    setIsStepValid(true);
  };

  const handleCreateCustomGoal = () => {
    setShowCustomGoal(true);
    setIsStepValid(false);
  };

  const handleCustomPlanGenerated = (plan: any) => {
    updateData({ generatedPlan: plan });
    setShowCustomGoal(false);
    setIsStepValid(true);
    handleNext();
  };

  const handleFinish = () => {
    const { selectedGoal, generatedPlan } = onboardingData;
    const goalToUse = selectedGoal;

    if (!goalToUse || !generatedPlan) {
      toast.error('Please select a goal first.');
      return;
    }

    const goalData: GoalCreate = {
      name: goalToUse.title,
      category: generatedPlan.goalType,
      icon: null,
      color: null,
      isHabit: goalToUse.frequency === 'daily' || goalToUse.frequency === 'weekly',
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
    clearAllInvitationData();
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isPending = isCompleting || isCreating;
  const partnerName = userDetails?.partner_full_name || 'Your partner';

  // Render appropriate step content
  const renderStepContent = () => {
    // If showing custom goal creation, use the AI step
    if (showCustomGoal) {
      return (
        <IntelligentGoalCreationStep
          onPlanGenerated={handleCustomPlanGenerated}
        />
      );
    }

    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <QuickWelcomeStep
            data={{ nickname: onboardingData.nickname }}
            updateData={(updates) => updateData(updates)}
            onValidationChange={setIsStepValid}
          />
        );
      case 'goal':
        return (
          <GoalSelectionStep
            drafts={goalDrafts}
            partnerName={partnerName}
            onSelectGoal={handleGoalSelected}
            onCreateNew={handleCreateCustomGoal}
            onValidationChange={setIsStepValid}
          />
        );
      case 'task':
        return (
          <FirstTaskStep
            data={onboardingData}
            updateData={updateData}
            onValidationChange={setIsStepValid}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-background)] flex flex-col font-sans">
      {/* Header with progress */}
      <div className="bg-[var(--theme-card)] shadow-sm border-b border-[var(--theme-border)]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--theme-foreground)]">
                {showCustomGoal ? 'Create Your Goal' : "Let's Get Started"}
              </h1>
              {/* XP Counter */}
              {xpEarned > 0 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 rounded-full border border-purple-200"
                >
                  <Zap className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-bold text-purple-700">{xpEarned} XP</span>
                </motion.div>
              )}
            </div>
            {!showCustomGoal && (
              <span className="text-sm text-[var(--theme-muted-foreground)]">
                Step {currentStep + 1} of {STEPS.length}
              </span>
            )}
          </div>

          {!showCustomGoal && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2 bg-[var(--theme-muted)]" />
              <div className="flex justify-between">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${completedSteps.includes(index)
                        ? 'bg-green-500 text-white'
                        : index === currentStep
                          ? 'bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] ring-2 ring-[var(--theme-primary)] ring-offset-2'
                          : 'bg-[var(--theme-muted)] text-[var(--theme-muted-foreground)]'
                        }`}
                    >
                      {completedSteps.includes(index) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span className="text-xs text-[var(--theme-muted-foreground)] mt-1 hidden sm:block">
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={showCustomGoal ? 'custom' : currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer navigation */}
      <div className="bg-[var(--theme-background)] border-t border-[var(--theme-border)] p-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={isPending}
            className="text-[var(--theme-muted-foreground)] hover:text-[var(--theme-foreground)]"
          >
            Skip for now
          </Button>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || isPending}
              className="border-[var(--theme-border)]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid || isPending || showCustomGoal}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={!isStepValid || isPending}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                {isPending ? (
                  'Creating...'
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Finish & Start! (+25 XP)
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
