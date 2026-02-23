"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Clock, Camera, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAction, useMutation as useConvexMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  getStrategicQuestionsViaBoundary,
  createGoalPlanViaBoundary,
  evaluateGoalPlanViaBoundary,
} from "@/lib/api/goals";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import {
  QuestionsResponse,
  GoalPlanResponse,
  StrategicQuestion,
  DuotrakGoalPlan
} from "@/schemas/goal";

import { useFieldArray } from "react-hook-form";

interface WizardStep {

  id: string
  title: string
  description: string
}

const taskSchema = z.object({
  name: z.string().min(1, "Task name cannot be empty."),
  description: z.string().optional(),
  repeat_frequency: z.string().optional(),
});

const formSchema = z.object({
  goalName: z.string().min(1, "Goal name is required."),
  motivation: z.string().min(1, "Motivation is required."),
  availability: z.array(z.string()).min(1, "Please select at least one availability option."),
  timeCommitment: z.string().min(1, "Please select a time commitment."),
  customTime: z.string().optional(),
  accountabilityType: z.enum(["visual_proof", "time_bound_action"]),
  timeWindow: z.string().optional(),
  targetDeadline: z.string().optional(),
  preferredCheckInStyle: z.enum(["quick_text", "photo_recap", "voice_note"]),
  tasks: z.array(taskSchema).optional(),
});


export default function GoalCreationWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { userDetails, partnerDisplayName } = useUser();

  // V3 State Management
  const [session_id, setSessionId] = useState<string | null>(null);
  const [strategicQuestions, setStrategicQuestions] = useState<StrategicQuestion[] | null>(null);
  const [userProfileSummary, setUserProfileSummary] = useState<any | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [finalGoalPlan, setFinalGoalPlan] = useState<DuotrakGoalPlan | null>(null);
  const [planGenerationStage, setPlanGenerationStage] = useState(0);
  const [showRecommendationReasons, setShowRecommendationReasons] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goalName: "",
      motivation: "",
      availability: [],
      timeCommitment: "",
      customTime: "",
      accountabilityType: "visual_proof",
      timeWindow: "",
      targetDeadline: "",
      preferredCheckInStyle: "quick_text",
      tasks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  const createGoal = useConvexMutation(api.goals.create);
  const getStrategicQuestionsAction = useAction(api.goalCreation.getStrategicQuestions);
  const createGoalPlanAction = useAction(api.goalCreation.createGoalPlan);
  const evaluateGoalPlanAction = useAction(api.goalCreation.evaluateGoalPlan);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);

  const createGoalMutation = {
    isPending: isCreatingGoal,
    mutate: (data: any) => {
      setIsCreatingGoal(true);
      createGoal(data)
        .then(() => {
          toast({
            title: "Goal Created!",
            description: "Your new goal has been saved successfully.",
          });
          router.push("/goals");
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: "Could not create the goal. Please try again.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsCreatingGoal(false);
        });
    }
  };


  // V3 Phase 1: Get Questions
  const getQuestionsMutation = useMutation({
    mutationFn: (requestData: any) =>
      getStrategicQuestionsViaBoundary(requestData, { getStrategicQuestionsAction }),
    onSuccess: (data: QuestionsResponse) => {
      setSessionId(data.session_id);
      setUserProfileSummary(data.user_profile_summary);
      setStrategicQuestions(data.strategic_questions);
      setCurrentStep(currentStep + 1); // Move to the new questions step
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not generate planning questions: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // V3 Phase 2: Get Plan
  const getPlanMutation = useMutation({
    mutationFn: (variables: { user_id: string; session_id: string; answers: Record<string, string> }) =>
      createGoalPlanViaBoundary(
        variables.session_id,
        { user_id: variables.user_id, answers: variables.answers },
        { createGoalPlanAction }
      ),
    onSuccess: (data: GoalPlanResponse) => {
      setFinalGoalPlan(data.goal_plan);
      setCurrentStep(currentStep + 1); // Move to the final review step

      // Conditionally trigger evaluation only in development
      if (process.env.NODE_ENV === 'development') {
        evaluatePlanMutation.mutate(data.goal_plan);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Could not create your goal plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!getPlanMutation.isPending) {
      setPlanGenerationStage(0);
      return;
    }

    const interval = setInterval(() => {
      setPlanGenerationStage((prev) => (prev < 2 ? prev + 1 : prev));
    }, 1400);

    return () => clearInterval(interval);
  }, [getPlanMutation.isPending]);

  // Dev-only: Fire-and-forget evaluation
  const evaluatePlanMutation = useMutation({
    mutationFn: (plan: DuotrakGoalPlan) =>
      evaluateGoalPlanViaBoundary(plan, { evaluateGoalPlanAction }),
    onSuccess: () => {
      console.log("DEV-ONLY: Goal plan sent for evaluation.");
    },
    onError: (error) => {
      console.error("DEV-ONLY: Evaluation request failed.", error);
    }
  });



  const steps: WizardStep[] = [
    { id: "goal", title: "Your Goal", description: "What do you want to achieve?" },
    { id: "motivation", title: "Your Why", description: "What drives you?" },
    { id: "availability", title: "Your Schedule", description: "When can you work on this?" },
    { id: "time", title: "Time Investment", description: "Set a sustainable cadence and target timeline." },
    { id: "accountability", title: "Accountability", description: "How will you track completion?" },
    { id: "personalize", title: "Personalize Your Plan", description: "Answer these questions to get a tailored strategy." },
    { id: "review", title: "Review Your Plan", description: "Your hyper-personalized plan is ready." },
  ]

  const availabilityOptions = [
    "Mornings (6-9 AM)",
    "Lunchtime (12-2 PM)",
    "Evenings (6-9 PM)",
    "Weekends only",
    "I'm flexible",
  ]

  const timeCommitmentOptions = ["15-30 mins daily", "1 hour weekly", "Suggest optimal based on my input"]
  const checkInStyleOptions = [
    { value: "quick_text", label: "Quick Text", description: "Fast daily check-ins in a sentence or two." },
    { value: "photo_recap", label: "Photo Recap", description: "Share a quick picture recap after sessions." },
    { value: "voice_note", label: "Voice Note", description: "Send short audio updates for richer context." },
  ] as const;

  const stepFields: (keyof z.infer<typeof formSchema>)[][] = [
    ["goalName"],
    ["motivation"],
    ["availability"],
    ["timeCommitment", "customTime", "targetDeadline", "preferredCheckInStyle"],
    ["accountabilityType", "timeWindow"],
  ];

  const handleNext = async () => {
    if (currentStep === 5) { // "Personalize" step
      if (!userDetails) {
        toast({ title: "User not found. Please log in again.", variant: "destructive" });
        return;
      }
      if (session_id && Object.keys(userAnswers).length === strategicQuestions?.length) {
        getPlanMutation.mutate({ user_id: userDetails.id, session_id, answers: userAnswers });
      } else {
        toast({ title: "Please answer all questions.", variant: "destructive" });
      }
      return;
    }

    const fieldsToValidate = stepFields[currentStep];
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      if (currentStep === 4) { // Step before "Personalize"
        if (!userDetails) {
          toast({ title: "User not found. Please log in again.", variant: "destructive" });
          return;
        }
        const values = form.getValues();
        getQuestionsMutation.mutate({
          user_id: userDetails.id,
          wizard_data: {
            goal_description: values.goalName,
            motivation: values.motivation,
            availability: values.availability,
            time_commitment: values.timeCommitment,
            accountability_type: values.accountabilityType,
            partner_name: partnerDisplayName || null,
            target_deadline: values.targetDeadline || null,
            preferred_check_in_style: values.preferredCheckInStyle,
          }
        });
      } else if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const formatVerificationMode = (mode?: string) => {
    if (!mode) return "Photo";
    if (mode === "time-window") return "Time Window";
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  const recommendationReasons = (finalGoalPlan?.decision_trace || [])
    .slice(0, 3)
    .map((reason: string) => reason.trim())
    .filter((reason: string) => reason.length > 0);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!finalGoalPlan) {
      toast({ title: "No final plan to save.", description: "Please complete the planning process.", variant: "destructive" });
      return;
    }

    const { motivation, availability, timeCommitment, accountabilityType, timeWindow } = values;

    const goalToCreate = {
      name: finalGoalPlan.title,
      description: finalGoalPlan.description,
      motivation: motivation,
      category: 'General', // Or derive from plan
      is_habit: false, // Or derive from plan
      color: '#FFFFFF', // Placeholder
      icon: 'default', // Placeholder
      availability: availability,
      time_commitment: timeCommitment,
      accountability_type: accountabilityType,
      tasks: finalGoalPlan.milestones.flatMap(m => m.tasks.map(t => ({
        name: t.description,
        description: t.success_metric,
        repeat_frequency: t.recommended_cadence || "daily",
        time_window: t.recommended_time_windows?.[0] || timeWindow,
        accountability_type: accountabilityType,
        verification_mode: t.verification_mode || "photo",
        verification_mode_reason: t.verification_mode_reason || "Photo verification offers clear evidence.",
        verification_confidence: typeof t.verification_confidence === "number" ? t.verification_confidence : 0.85,
        time_window_start: t.time_window_start || undefined,
        time_window_end: t.time_window_end || undefined,
        auto_approval_policy: t.auto_approval_policy || "time_window_only",
        auto_approval_timeout_hours: typeof t.auto_approval_timeout_hours === "number" ? t.auto_approval_timeout_hours : 24,
        auto_approval_min_confidence: typeof t.auto_approval_min_confidence === "number" ? t.auto_approval_min_confidence : 0.85,
      }))),
    };

    createGoalMutation.mutate(goalToCreate);
  }




  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  }

  return (
    <div className="min-h-screen bg-pearl-gray dark:bg-gray-900 pt-16 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <button
            onClick={handleBack}
            className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-charcoal dark:text-gray-100" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100">Create New Goal</h1>
            <p className="text-sm text-stone-gray dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </motion.div>

        {/* Progress Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="h-2 bg-cool-gray dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-primary-blue rounded-full"
            />
          </div>
        </motion.div>

        {/* Step Content */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 mb-6"
              >
                <h2 className="text-xl font-bold text-charcoal dark:text-gray-100 mb-2">{steps[currentStep].title}</h2>
                <p className="text-stone-gray dark:text-gray-300 mb-6">{steps[currentStep].description}</p>

                {/* Step Content */}
                {currentStep === 0 && (
                  <FormField
                    control={form.control}
                    name="goalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="e.g., Run a 5K, Meditate daily for 15 mins, Learn to code in Python"
                            {...field}
                            className="w-full p-4 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentStep === 1 && (
                  <FormField
                    control={form.control}
                    name="motivation"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Improve my health, Boost my confidence, Learn a valuable new skill"
                            rows={4}
                            {...field}
                            className="w-full p-4 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentStep === 2 && (
                  <FormField
                    control={form.control}
                    name="availability"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        {availabilityOptions.map((option) => (
                          <motion.label
                            key={option}
                            whileHover={{ scale: 1.01 }}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${field.value?.includes(option)
                              ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                              : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                              }`}
                          >
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value?.includes(option)}
                                onChange={(e) => {
                                  const newValue = e.target.checked
                                    ? [...(field.value || []), option]
                                    : (field.value || []).filter((value) => value !== option);
                                  field.onChange(newValue);
                                }}
                                className="sr-only"
                              />
                            </FormControl>
                            <div
                              className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${field.value?.includes(option)
                                ? "border-primary-blue bg-primary-blue"
                                : "border-cool-gray dark:border-gray-600"
                                }`}
                            >
                              {field.value?.includes(option) && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2 h-2 bg-white rounded-sm"
                                />
                              )}
                            </div>
                            <span className="text-charcoal dark:text-gray-100">{option}</span>
                          </motion.label>
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="timeCommitment"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          {timeCommitmentOptions.map((option) => (
                            <motion.label
                              key={option}
                              whileHover={{ scale: 1.01 }}
                              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${field.value === option
                                ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                                : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                                }`}
                            >
                              <FormControl>
                                <input
                                  type="radio"
                                  name="timeCommitment"
                                  checked={field.value === option}
                                  onChange={() => field.onChange(option)}
                                  className="sr-only"
                                />
                              </FormControl>
                              <div
                                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${field.value === option
                                  ? "border-primary-blue"
                                  : "border-cool-gray dark:border-gray-600"
                                  }`}
                              >
                                {field.value === option && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2 h-2 bg-primary-blue rounded-full"
                                  />
                                )}
                              </div>
                              <span className="text-charcoal dark:text-gray-100">{option}</span>
                            </motion.label>
                          ))}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Custom: e.g., 45 mins 3x per week"
                              {...field}
                              className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="targetDeadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-charcoal dark:text-gray-100">Target completion date (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="preferredCheckInStyle"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-sm font-medium text-charcoal dark:text-gray-100">Preferred partner check-in style</FormLabel>
                          {checkInStyleOptions.map((option) => (
                            <motion.label
                              key={option.value}
                              whileHover={{ scale: 1.01 }}
                              className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${field.value === option.value
                                ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                                : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                                }`}
                            >
                              <FormControl>
                                <input
                                  type="radio"
                                  name="preferredCheckInStyle"
                                  checked={field.value === option.value}
                                  onChange={() => field.onChange(option.value)}
                                  className="sr-only"
                                />
                              </FormControl>
                              <div className="mr-3 mt-0.5">
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${field.value === option.value
                                    ? "border-primary-blue"
                                    : "border-cool-gray dark:border-gray-600"
                                    }`}
                                >
                                  {field.value === option.value && <div className="w-2 h-2 rounded-full bg-primary-blue" />}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-charcoal dark:text-gray-100">{option.label}</p>
                                <p className="text-sm text-stone-gray dark:text-gray-400">{option.description}</p>
                              </div>
                            </motion.label>
                          ))}
                          <p className="text-xs text-stone-gray dark:text-gray-400">
                            Daily partner involvement is encouraged, never forced. DuoTrak nudges consistency without blocking progress.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="accountabilityType"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <motion.label
                            whileHover={{ scale: 1.01 }}
                            className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all ${field.value === "visual_proof"
                              ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                              : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                              }`}
                          >
                            <FormControl>
                              <input
                                type="radio"
                                name="accountability"
                                checked={field.value === "visual_proof"}
                                onChange={() => field.onChange("visual_proof")}
                                className="sr-only"
                              />
                            </FormControl>
                            <div
                              className={`w-5 h-5 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center ${field.value === "visual_proof"
                                ? "border-primary-blue"
                                : "border-cool-gray dark:border-gray-600"
                                }`}
                            >
                              {field.value === "visual_proof" && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2 h-2 bg-primary-blue rounded-full"
                                />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <Camera className="w-5 h-5 text-primary-blue" />
                                <span className="font-semibold text-charcoal dark:text-gray-100">Visual Proof (Recommended)</span>
                              </div>
                              <p className="text-sm text-stone-gray dark:text-gray-400">
                                Upload a picture to confirm task completion
                              </p>
                            </div>
                          </motion.label>

                          <motion.label
                            whileHover={{ scale: 1.01 }}
                            className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all ${field.value === "time_bound_action"
                              ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                              : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                              }`}
                          >
                            <FormControl>
                              <input
                                type="radio"
                                name="accountability"
                                checked={field.value === "time_bound_action"}
                                onChange={() => field.onChange("time_bound_action")}
                                className="sr-only"
                              />
                            </FormControl>
                            <div
                              className={`w-5 h-5 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center ${field.value === "time_bound_action"
                                ? "border-primary-blue"
                                : "border-cool-gray dark:border-gray-600"
                                }`}
                            >
                              {field.value === "time_bound_action" && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-2 h-2 bg-primary-blue rounded-full"
                                />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Clock className="w-5 h-5 text-primary-blue" />
                                <span className="font-semibold text-charcoal dark:text-gray-100">Time-Bound Action</span>
                              </div>
                              <p className="text-sm text-stone-gray dark:text-gray-400 mb-3">
                                Mark completed within a specific time window
                              </p>
                              {field.value === "time_bound_action" && (
                                <FormField
                                  control={form.control}
                                  name="timeWindow"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type="text"
                                          placeholder="e.g., 7:00 AM Â± 10 mins"
                                          {...field}
                                          className="w-full p-2 border border-cool-gray dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none text-sm"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>
                          </motion.label>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-6">
                    {getQuestionsMutation.isPending ? (
                      <div className="text-center">
                        <Sparkles className="w-12 h-12 text-primary-blue mx-auto animate-spin" />
                        <h3 className="text-lg font-semibold mt-4">Analyzing your goal...</h3>
                        <p className="text-stone-gray">Our AI is preparing some questions to personalize your plan.</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 bg-accent-light-blue dark:bg-primary-blue/10 rounded-lg border border-primary-blue/20">
                          <h3 className="font-semibold text-charcoal dark:text-gray-100">AI Analysis: Your Profile</h3>
                          {userProfileSummary && (
                            <>
                              <p className="text-sm text-stone-gray dark:text-gray-300 mt-1">
                                <strong>Archetype:</strong> {userProfileSummary.archetype}
                              </p>
                              <p className="text-sm text-stone-gray dark:text-gray-300">
                                <strong>Potential Risks:</strong> {userProfileSummary.risk_factors?.join(", ")}
                              </p>
                            </>
                          )}
                        </div>
                        <div className="space-y-4">
                          {strategicQuestions?.map((q) => (
                            <div key={q.question_key}>
                              <FormLabel>{q.question}</FormLabel>
                              {/* Simple radio group for now */}
                              <div className="mt-2 space-y-2">
                                {q.suggested_answers.map((answer: string) => (
                                  <label key={answer} className="flex items-center p-3 rounded-lg border border-cool-gray dark:border-gray-600 cursor-pointer hover:border-primary-blue">
                                    <input
                                      type="radio"
                                      name={q.question_key}
                                      value={answer}
                                      onChange={(e) => setUserAnswers({ ...userAnswers, [q.question_key]: e.target.value })}
                                      className="mr-3"
                                    />
                                    {answer}
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {currentStep === 6 && (
                  <AnimatePresence mode="wait">
                    {getPlanMutation.isPending || !finalGoalPlan ? (
                      <motion.div key="loading" className="text-center">
                        <Sparkles className="w-16 h-16 text-primary-blue mx-auto animate-spin" />
                        <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100 mb-2">Generating your hyper-personalized plan...</h3>
                        <p className="text-stone-gray dark:text-gray-400">
                          {["Analyzing your consistency windows...", "Designing partner accountability rhythm...", "Drafting picture-proof guidance for each task..."][planGenerationStage]}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div key="plan" className="space-y-6">
                        <h3 className="text-xl font-bold text-charcoal dark:text-gray-100">{finalGoalPlan.title}</h3>
                        <p className="text-stone-gray dark:text-gray-300">{finalGoalPlan.description}</p>
                        {finalGoalPlan.schedule_impact && (
                          <div className="rounded-lg border border-cool-gray dark:border-gray-600 bg-white dark:bg-gray-800 p-3 text-sm">
                            <p className="font-semibold text-charcoal dark:text-gray-100">Schedule impact</p>
                            <p className="text-stone-gray dark:text-gray-300">
                              Weekly load: {finalGoalPlan.schedule_impact.projected_load_minutes} / {finalGoalPlan.schedule_impact.capacity_minutes} mins
                            </p>
                            <p className="text-stone-gray dark:text-gray-300">
                              Fit: {finalGoalPlan.schedule_impact.fit_band}
                              {typeof finalGoalPlan.schedule_impact.overload_percent === "number" && ` · Overload ${finalGoalPlan.schedule_impact.overload_percent}%`}
                            </p>
                          </div>
                        )}
                        {recommendationReasons.length > 0 && (
                          <div className="rounded-lg border border-primary-blue/30 bg-accent-light-blue dark:bg-primary-blue/10 p-3">
                            <button
                              type="button"
                              onClick={() => setShowRecommendationReasons((prev) => !prev)}
                              className="w-full text-left text-sm font-semibold text-primary-blue"
                            >
                              Why this recommendation {showRecommendationReasons ? "▲" : "▼"}
                            </button>
                            {showRecommendationReasons && (
                              <ul className="mt-2 space-y-1 text-sm text-stone-gray dark:text-gray-300">
                                {recommendationReasons.map((reason: string, reasonIndex: number) => (
                                  <li key={`reason-${reasonIndex}`}>- {reason}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        <div className="space-y-4">
                          {finalGoalPlan.milestones.map((milestone, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-pearl-gray dark:bg-gray-700/50">
                              <h4 className="font-semibold text-charcoal dark:text-gray-100">{milestone.title}</h4>
                              <p className="text-sm text-stone-gray dark:text-gray-400 mb-2">{milestone.description}</p>
                              <ul className="space-y-3">
                                {milestone.tasks.map((task, taskIndex) => (
                                  <li key={taskIndex} className="text-sm text-charcoal dark:text-gray-300 border border-cool-gray dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-800">
                                    <p><strong>{task.description}</strong></p>
                                    <p className="text-stone-gray dark:text-gray-400 mt-1">{task.success_metric}</p>
                                    <p className="mt-2"><strong>Cadence:</strong> {task.recommended_cadence}</p>
                                    <p><strong>Best windows:</strong> {task.recommended_time_windows?.join(", ") || "Flexible based on your schedule"}</p>
                                    <p><strong>Why this works:</strong> {task.consistency_rationale}</p>
                                    <p>
                                      <strong>Verification mode:</strong> {formatVerificationMode(task.verification_mode)}
                                      {typeof task.verification_confidence === "number" ? ` (${Math.round(task.verification_confidence * 100)}% confidence)` : ""}
                                    </p>
                                    <p><strong>Why this mode:</strong> {task.verification_mode_reason || "Selected for reliable partner review."}</p>
                                    {task.verification_mode === "time-window" && (
                                      <p>
                                        <strong>Time-window rule:</strong> Complete between {task.time_window_start || "configured start"} and {task.time_window_end || "configured end"} for high-confidence verification.
                                      </p>
                                    )}
                                    <div className="mt-2">
                                      <p><strong>Partner touchpoint:</strong> {task.partner_involvement?.daily_check_in_suggestion}</p>
                                      <p><strong>Weekly anchor:</strong> {task.partner_involvement?.weekly_anchor_review}</p>
                                    </div>
                                    <div className="mt-2">
                                      <p><strong>Suggested proof guidance:</strong></p>
                                      <ul className="list-disc list-inside text-stone-gray dark:text-gray-400">
                                        {(task.proof_guidance?.what_counts || []).map((item: string, proofIdx: number) => (
                                          <li key={`count-${proofIdx}`}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBack}
                className="px-6 py-3 border border-cool-gray dark:border-gray-600 text-charcoal dark:text-gray-100 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
              >
                Back
              </motion.button>

              <div className="flex-1" />

              {currentStep < steps.length - 1 ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  disabled={getQuestionsMutation.isPending || getPlanMutation.isPending}
                  className="px-6 py-3 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <span>
                    {getQuestionsMutation.isPending ? "Analyzing..." :
                      getPlanMutation.isPending ? "Creating Plan..." : "Next"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={createGoalMutation.isPending || !finalGoalPlan}
                  className="px-6 py-3 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {createGoalMutation.isPending ? "Saving..." : "Save Goal"}
                </motion.button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}








