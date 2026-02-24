"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Form } from "@/components/ui/form";
import TemplatePickerStep from "@/components/goals/wizard/TemplatePickerStep";
import MotivationStep from "@/components/goals/wizard/MotivationStep";
import AvailabilityStep from "@/components/goals/wizard/AvailabilityStep";
import TimeInvestmentStep from "@/components/goals/wizard/TimeInvestmentStep";
import TargetCompletionStep from "@/components/goals/wizard/TargetCompletionStep";
import CheckInStyleStep from "@/components/goals/wizard/CheckInStyleStep";
import AccountabilityStep from "@/components/goals/wizard/AccountabilityStep";
import PersonalizeStep from "@/components/goals/wizard/PersonalizeStep";
import ReviewStep from "@/components/goals/wizard/ReviewStep";
import { useGoalCreationFlow } from "@/components/goals/wizard/useGoalCreationFlow";
import { availabilityOptions, checkInStyleOptions, steps, timeCommitmentOptions } from "@/components/goals/wizard/types";

const stepVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

export default function GoalCreationWizard() {
  const flow = useGoalCreationFlow();
  const isFirstStep = flow.currentStep === 0;
  const activeStep = steps[flow.currentStep];
  const stepTitle =
    flow.currentStep === 8 && flow.planningMode === "manual" ? "Review Your Manual Plan" : activeStep.title;
  const stepDescription =
    flow.currentStep === 8 && flow.planningMode === "manual"
      ? "Review your manually configured plan before saving."
      : activeStep.description;
  const nextButtonLabel = flow.currentStep === 0 ? "Next: Motivation" : "Next";

  return (
    <div className="min-h-screen bg-pearl-gray pb-20 pt-16 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <button
            onClick={flow.handleBack}
            disabled={isFirstStep}
            className="rounded-lg p-2 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-6 w-6 text-charcoal dark:text-gray-100" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100">Create New Goal</h1>
            <p className="text-sm text-stone-gray dark:text-gray-400">
              Step {flow.currentStep + 1} of {steps.length}
            </p>
          </div>
          <div className="w-10" />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="h-2 overflow-hidden rounded-full bg-cool-gray dark:bg-gray-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((flow.currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full bg-primary-blue"
            />
          </div>
        </motion.div>

        <Form {...flow.form}>
          <form onSubmit={flow.form.handleSubmit(flow.onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={flow.currentStep}
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="mb-6 rounded-xl border border-cool-gray bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <h2 className="mb-2 text-xl font-bold text-charcoal dark:text-gray-100">{stepTitle}</h2>
                <p className="mb-6 text-stone-gray dark:text-gray-300">{stepDescription}</p>

                {flow.currentStep === 0 && (
                  <div className="space-y-5">
                    <TemplatePickerStep
                      form={flow.form}
                      filteredSuggestions={flow.filteredSuggestions}
                      templatesLoading={flow.templatesLoading}
                      selectedTemplate={flow.selectedTemplate}
                      applySuggestedGoal={flow.applySuggestedGoal}
                      clearSelectedTemplate={flow.clearSelectedTemplate}
                      loadStarterTemplates={flow.loadStarterTemplates}
                      continueStepOneManual={flow.continueStepOneManual}
                      continueStepOneAi={flow.continueStepOneAi}
                      continuePending={flow.getQuestionsMutation.isPending}
                    />
                  </div>
                )}

                {flow.currentStep === 1 && <MotivationStep form={flow.form} />}

                {flow.currentStep === 2 && (
                  <AvailabilityStep form={flow.form} availabilityOptions={availabilityOptions} />
                )}

                {flow.currentStep === 3 && (
                  <TimeInvestmentStep form={flow.form} timeCommitmentOptions={timeCommitmentOptions} />
                )}

                {flow.currentStep === 4 && <TargetCompletionStep form={flow.form} />}

                {flow.currentStep === 5 && (
                  <CheckInStyleStep
                    form={flow.form}
                    checkInStyleOptions={checkInStyleOptions}
                    detectedTimezone={flow.detectedTimezone}
                  />
                )}

                {flow.currentStep === 6 && <AccountabilityStep form={flow.form} />}

                {flow.currentStep === 7 && (
                  <PersonalizeStep
                    getQuestionsPending={flow.getQuestionsMutation.isPending}
                    strategicQuestions={flow.strategicQuestions}
                    userProfileSummary={flow.userProfileSummary}
                    userAnswers={flow.userAnswers}
                    setUserAnswers={flow.setUserAnswers}
                  />
                )}

                {flow.currentStep === 8 && (
                  <ReviewStep
                    finalGoalPlan={flow.finalGoalPlan}
                    getPlanPending={flow.getPlanMutation.isPending}
                    planGenerationStage={flow.planGenerationStage}
                    recommendationReasons={flow.recommendationReasons}
                    showRecommendationReasons={flow.showRecommendationReasons}
                    setShowRecommendationReasons={flow.setShowRecommendationReasons}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {flow.currentStep !== 0 && (
            <div className="sticky bottom-20 z-20 -mx-1 rounded-xl bg-pearl-gray/95 p-1 backdrop-blur dark:bg-gray-900/90 sm:static sm:mx-0 sm:bg-transparent sm:p-0">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={flow.handleBack}
                  disabled={isFirstStep}
                  className="w-full rounded-lg border border-cool-gray px-6 py-3 text-charcoal transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800 sm:w-auto"
                >
                  Back
                </motion.button>

                <div className="hidden flex-1 sm:block" />

                {flow.currentStep < steps.length - 1 ? (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={flow.handleNext}
                    disabled={flow.getQuestionsMutation.isPending || flow.getPlanMutation.isPending}
                    className="flex w-full items-center justify-center space-x-2 rounded-lg bg-primary-blue px-6 py-3 text-white transition-colors hover:bg-primary-blue-hover disabled:opacity-50 sm:w-auto"
                  >
                    <span>
                      {flow.getQuestionsMutation.isPending
                      ? "Analyzing..."
                      : flow.getPlanMutation.isPending
                        ? "Creating Plan..."
                        : nextButtonLabel}
                  </span>
                    <ArrowRight className="h-4 w-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={flow.createGoalMutation.isPending || !flow.finalGoalPlan}
                    className="w-full rounded-lg bg-primary-blue px-6 py-3 text-white transition-colors hover:bg-primary-blue-hover disabled:opacity-50 sm:w-auto"
                  >
                    {flow.createGoalMutation.isPending ? "Saving..." : "Save Goal"}
                  </motion.button>
                )}
              </div>
            </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
