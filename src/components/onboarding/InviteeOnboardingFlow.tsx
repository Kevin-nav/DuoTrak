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
import FlowShell from '@/components/flow/FlowShell';
import FlowActionBar from '@/components/flow/FlowActionBar';

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
    <FlowShell
      stepLabel={showCustomGoal ? 'Custom Goal Builder' : `Step ${currentStep + 1} of ${STEPS.length}`}
      title={showCustomGoal ? 'Create your goal' : "Let's get started"}
      subtitle={showCustomGoal ? 'Generate a personalized goal plan with your partner context.' : `You are onboarding with ${partnerName}.`}
      progress={showCustomGoal ? 66 : progress}
      backHref="/pending-acceptance"
      statusChip={xpEarned > 0 ? `${xpEarned} XP` : 'New partner'}
      actionBar={
        <FlowActionBar
          tertiary={
            <Button variant="ghost" onClick={handleSkip} disabled={isPending} className="text-landing-espresso-light hover:text-landing-espresso">
              Skip for now
            </Button>
          }
          secondary={
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0 || isPending} className="border-landing-clay">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
          }
          primary={
            currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid || isPending || showCustomGoal}
                className="bg-landing-espresso text-landing-cream hover:bg-landing-terracotta"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={!isStepValid || isPending}
                className="bg-landing-espresso text-landing-cream hover:bg-landing-terracotta"
              >
                {isPending ? (
                  'Creating...'
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Finish & Start
                  </>
                )}
              </Button>
            )
          }
        />
      }
    >
      <div className="mb-4 flex items-center gap-2">
        {xpEarned > 0 ? (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1 rounded-full border border-landing-gold/40 bg-landing-gold/15 px-3 py-1 text-sm font-bold text-landing-espresso"
          >
            <Zap className="h-4 w-4 text-landing-terracotta" />
            {xpEarned} XP
          </motion.div>
        ) : null}
        {!showCustomGoal
          ? STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
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
            ))
          : null}
      </div>

      <div className="w-full">
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
    </FlowShell>
  );
}
