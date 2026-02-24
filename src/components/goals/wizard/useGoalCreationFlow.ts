"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useAction, useMutation as useConvexMutation, useQuery as useConvexQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { createGoalPlanViaBoundary, evaluateGoalPlanViaBoundary, getStrategicQuestionsViaBoundary } from "@/lib/api/goals";
import { validateArchetypeProfile } from "@/lib/goals/archetype-validators";
import type { DuotrakGoalPlan, GoalPlanResponse, QuestionsResponse, StrategicQuestion } from "@/schemas/goal";
import { formSchema, buildStepList, steps, type GoalCreationFormValues } from "@/components/goals/wizard/types";

const stepFields: (keyof GoalCreationFormValues)[][] = [
  ["goalType", "goalName"],
  ["motivation"],
  ["availability"],
  ["timeCommitment", "customTime"],
  ["targetDeadline"],
  ["preferredCheckInStyle"],
  ["accountabilityType", "timeWindow"],
];

export function useGoalCreationFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [strategicQuestions, setStrategicQuestions] = useState<StrategicQuestion[] | null>(null);
  const [userProfileSummary, setUserProfileSummary] = useState<any | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [finalGoalPlan, setFinalGoalPlan] = useState<DuotrakGoalPlan | null>(null);
  const [planGenerationStage, setPlanGenerationStage] = useState(0);
  const [showRecommendationReasons, setShowRecommendationReasons] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState("");
  const [suggestionGoalTypeFilter, setSuggestionGoalTypeFilter] = useState<"all" | "habit" | "target-date" | "milestone">("all");
  const [suggestionProofFilter, setSuggestionProofFilter] = useState<"all" | "photo" | "voice" | "time-window" | "hybrid">("all");
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [planningMode, setPlanningMode] = useState<"manual" | "ai">("ai");
  const [templateAiShortcutActive, setTemplateAiShortcutActive] = useState(false);
  const questionsTargetStepRef = useRef<number | null>(null);
  const [hasAttemptedAutoSeed, setHasAttemptedAutoSeed] = useState(false);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);

  // Shared goal state
  const [isSharedGoal, setIsSharedGoal] = useState(false);
  const [sharedGoalMode, setSharedGoalMode] = useState<"independent" | "together" | undefined>(undefined);

  const router = useRouter();
  const { toast } = useToast();
  const { userDetails, partnerDisplayName } = useUser();

  const form = useForm<GoalCreationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goalType: "habit",
      goalName: "",
      motivation: "",
      availability: [],
      timeCommitment: "",
      customTime: "",
      accountabilityType: "visual_proof",
      timeWindow: "",
      targetDeadline: "",
      isSharedGoal: false,
      sharedGoalMode: undefined,
      planningMode: "ai",
      preferredCheckInStyle: "quick_text",
      tasks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  const createGoal = useConvexMutation(api.goals.create);
  const createGoalWithInstances = useConvexMutation(api.goals.createWithInstances);
  const createSharedGoal = useConvexMutation(api.goals.createSharedGoal);
  const seedGoalTemplates = useConvexMutation(api.goalTemplates.seedDefaults);
  const getStrategicQuestionsAction = useAction(api.goalCreation.getStrategicQuestions);
  const createGoalPlanAction = useAction(api.goalCreation.createGoalPlan);
  const evaluateGoalPlanAction = useAction(api.goalCreation.evaluateGoalPlan);

  // Dynamic step list based on mode
  const dynamicSteps = useMemo(
    () => buildStepList(planningMode, isSharedGoal),
    [planningMode, isSharedGoal]
  );

  const detectedTimezone = useMemo(() => {
    if (typeof window === "undefined") return userDetails?.timezone || "UTC";
    return userDetails?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }, [userDetails?.timezone]);

  const dbTemplates = useConvexQuery(api.goalTemplates.listPublished, {
    search: suggestionQuery.trim() || undefined,
    goal_type: suggestionGoalTypeFilter === "all" ? undefined : suggestionGoalTypeFilter,
    proof_mode: suggestionProofFilter === "all" ? undefined : suggestionProofFilter,
  });

  const filteredSuggestions = dbTemplates ?? [];
  const templatesLoading = dbTemplates === undefined;

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
        .catch((error: any) => {
          const message = typeof error?.message === "string" ? error.message : "Could not create the goal. Please try again.";
          console.error("[GoalCreation] createGoal failed", error);
          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsCreatingGoal(false);
        });
    },
  };

  const evaluatePlanMutation = useMutation({
    mutationFn: (plan: DuotrakGoalPlan) => evaluateGoalPlanViaBoundary(plan, { evaluateGoalPlanAction }),
    onSuccess: () => {
      console.log("DEV-ONLY: Goal plan sent for evaluation.");
    },
    onError: (error) => {
      console.error("DEV-ONLY: Evaluation request failed.", error);
    },
  });

  const getQuestionsMutation = useMutation({
    mutationFn: (requestData: any) => getStrategicQuestionsViaBoundary(requestData, { getStrategicQuestionsAction }),
    onSuccess: (data: QuestionsResponse) => {
      const payload = data as unknown as Record<string, any>;
      setSessionId(payload.session_id ?? payload.sessionId ?? null);
      setUserProfileSummary(payload.user_profile_summary ?? payload.userProfileSummary ?? null);
      setStrategicQuestions(payload.strategic_questions ?? payload.strategicQuestions ?? null);
      const targetStep = questionsTargetStepRef.current;
      setCurrentStep((prev) => (targetStep !== null ? targetStep : prev + 1));
      questionsTargetStepRef.current = null;
    },
    onError: (error) => {
      questionsTargetStepRef.current = null;
      toast({
        title: "Error",
        description: `Could not generate planning questions: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const getPlanMutation = useMutation({
    mutationFn: (variables: { user_id: string; session_id: string; answers: Record<string, string> }) =>
      createGoalPlanViaBoundary(
        variables.session_id,
        { user_id: variables.user_id, answers: variables.answers },
        { createGoalPlanAction },
      ),
    onSuccess: (data: GoalPlanResponse) => {
      const payload = data as unknown as Record<string, any>;
      setFinalGoalPlan(payload.goal_plan ?? payload.goalPlan ?? null);
      setCurrentStep((prev) => prev + 1);

      if (process.env.NODE_ENV === "development") {
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

  useEffect(() => {
    if (templatesLoading || hasAttemptedAutoSeed) return;
    if ((dbTemplates?.length ?? 0) > 0) return;

    setHasAttemptedAutoSeed(true);
    seedGoalTemplates({})
      .then(() => {
        toast({
          title: "Starter templates loaded",
          description: "Pick one and use it immediately.",
        });
      })
      .catch(() => {
        // Keep silent here; manual button remains available.
      });
  }, [dbTemplates, hasAttemptedAutoSeed, seedGoalTemplates, templatesLoading, toast]);

  const applySuggestedGoal = (template: any) => {
    form.setValue("goalType", template.goal_type, { shouldValidate: true });
    form.setValue("goalName", template.title, { shouldValidate: true });
    form.setValue("motivation", template.motivation_suggestions?.[0] || "", { shouldValidate: true });
    form.setValue("accountabilityType", template.default_accountability_type, { shouldValidate: true });
    form.setValue("preferredCheckInStyle", template.default_check_in_style, { shouldValidate: true });
    form.setValue(
      "tasks",
      (template.tasks || []).map((task: any) => ({
        name: task.name,
        description: task.description || "",
        repeat_frequency: task.repeat_frequency || "daily",
      })),
      { shouldValidate: true },
    );
    setSelectedTemplate(template);
  };

  const clearSelectedTemplate = () => {
    setSelectedTemplate(null);
    setTemplateAiShortcutActive(false);
  };

  const buildManualPlanFromForm = (values: GoalCreationFormValues): DuotrakGoalPlan => {
    const fallbackTasks = (values.tasks || [])
      .filter((task) => task.name.trim().length > 0)
      .map((task) => ({
        description: task.name,
        success_metric: task.description || "Complete the task as planned.",
        recommended_cadence: task.repeat_frequency || "daily",
        recommended_time_windows: values.timeWindow ? [values.timeWindow] : [],
        consistency_rationale: "Derived from selected template and your manual adjustments.",
        verification_mode: values.accountabilityType === "time_bound_action" ? "time-window" : "photo",
        verification_mode_reason: "Based on your selected accountability style.",
        verification_confidence: 0.85,
        time_window_start: undefined,
        time_window_end: undefined,
        time_window_duration_minutes: undefined,
        partner_required: true,
        auto_approval_policy: "time_window_only",
        auto_approval_timeout_hours: 24,
        auto_approval_min_confidence: 0.85,
        partner_involvement: {
          daily_check_in_suggestion: "Quick daily confirmation with your partner.",
          weekly_anchor_review: "Weekly review and course correction.",
          fallback_if_missed: "Review blockers and recommit the next day.",
        },
        proof_guidance: {
          what_counts: ["Proof should clearly show completion."],
          good_examples: ["Time-accurate check-ins or clear media evidence."],
          avoid_examples: ["Late uploads without context."],
        },
      }));

    return {
      goal_type: values.goalType,
      title: values.goalName,
      description: values.motivation,
      milestones: [
        {
          title: "Core Plan",
          description: "Template-based plan ready for execution.",
          tasks: fallbackTasks,
        },
      ],
      success_metrics: ["Complete planned tasks consistently."],
      adherence_weight: 0.8,
      schedule_soft_cap_percent: 10,
      schedule_impact: {
        capacity_minutes: 420,
        projected_load_minutes: 300,
        overload_percent: 0,
        conflict_flags: [],
        fit_band: "good",
      },
      decision_trace: ["Built from selected template with your manual edits."],
      partner_accountability: {
        role: "Review partner-submitted proof and support consistency.",
        check_in_schedule: "daily",
        shared_celebrations: "weekly milestones",
      },
    } as DuotrakGoalPlan;
  };

  const createGoalFromTemplateNow = async () => {
    if (!selectedTemplate) {
      toast({ title: "Select a template first", variant: "destructive" });
      return;
    }
    if (!userDetails?.id) {
      toast({
        title: "Login required",
        description: "Please sign in before creating a goal.",
        variant: "destructive",
      });
      return;
    }
    const values = form.getValues();
    const parsedEndDate = values.goalType === "target-date" && values.targetDeadline ? Date.parse(values.targetDeadline) : NaN;
    const endDate = Number.isFinite(parsedEndDate) ? parsedEndDate : undefined;
    const templateTasks = (selectedTemplate.tasks || []).map((task: any) => ({
      name: task.name,
      description: task.description,
      repeat_frequency: task.repeat_frequency,
      time_window:
        task.time_window_start && task.time_window_duration_minutes
          ? `${task.time_window_start} (+${task.time_window_duration_minutes}m)`
          : undefined,
      accountability_type: selectedTemplate.default_accountability_type,
      verification_mode: task.verification_mode || selectedTemplate.recommended_proof_mode || "photo",
      verification_mode_reason: "Template default.",
      verification_confidence: 0.9,
      time_window_start: task.time_window_start,
      time_window_end: task.time_window_end,
      time_window_duration_minutes: task.time_window_duration_minutes,
      requires_partner_review: task.requires_partner_review ?? true,
      auto_approval_policy: task.auto_approval_policy || "time_window_only",
      auto_approval_timeout_hours: task.auto_approval_timeout_hours ?? 24,
      auto_approval_min_confidence: task.auto_approval_min_confidence ?? 0.85,
    }));
    const parsedProfileDefaults = (() => {
      try {
        return selectedTemplate.profile_defaults_json ? JSON.parse(selectedTemplate.profile_defaults_json) : {};
      } catch {
        return {};
      }
    })();
    const selectedArchetype = selectedTemplate.archetype || "general";
    const profileValidation = validateArchetypeProfile(selectedArchetype, parsedProfileDefaults);
    const safeArchetype = profileValidation.ok ? selectedArchetype : "general";
    const safeProfileJson = profileValidation.ok
      ? selectedTemplate.profile_defaults_json
      : JSON.stringify({});

    if (!profileValidation.ok) {
      toast({
        title: "Template adjusted for quick start",
        description: "We applied safe defaults so you can start immediately.",
      });
    }

    try {
      setIsCreatingGoal(true);
      const goalId = await createGoal({
        name: values.goalName || selectedTemplate.title,
        description: selectedTemplate.description,
        motivation: values.motivation || selectedTemplate.motivation_suggestions?.[0] || "",
        category: selectedTemplate.category,
        is_habit: values.goalType === "habit",
        goal_type: values.goalType,
        end_date: endDate,
        template_source_id: String(selectedTemplate._id),
        template_source_slug: selectedTemplate.slug,
        template_source_version: selectedTemplate.template_version,
        template_source_title: selectedTemplate.title,
        goal_archetype: safeArchetype,
        goal_profile_json: safeProfileJson,
        color: "#FFFFFF",
        icon: "default",
        availability: values.availability,
        time_commitment: values.timeCommitment,
        accountability_type: values.accountabilityType,
        tasks: templateTasks,
      });
      toast({
        title: "Goal created from template",
        description: "You can edit it anytime from the goal screen.",
      });
      router.push(`/goals/${goalId}`);
    } catch (error: any) {
      const message = typeof error?.message === "string" ? error.message : "Could not create goal from template. Please try again.";
      console.error("[GoalCreation] createGoalFromTemplateNow failed", error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const loadStarterTemplates = async () => {
    try {
      await seedGoalTemplates({});
      toast({
        title: "Starter templates loaded",
        description: "You can now pick a full template and personalize it.",
      });
    } catch {
      toast({
        title: "Could not load templates",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    if (templateAiShortcutActive && currentStep === 7) {
      setCurrentStep(0);
      return;
    }
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const continueStepOneManual = async () => {
    const isValid = await form.trigger(stepFields[0]);
    if (!isValid) return;
    setPlanningMode("manual");
    setTemplateAiShortcutActive(false);
    setCurrentStep(1);
  };

  const continueStepOneAi = async () => {
    setPlanningMode("ai");
    await startTemplateAiImprove();
  };

  const startTemplateAiImprove = async () => {
    if (!selectedTemplate) {
      toast({ title: "Select a template first", variant: "destructive" });
      return;
    }
    if (!userDetails) {
      toast({ title: "User not found. Please log in again.", variant: "destructive" });
      return;
    }

    const aiTuneFields: (keyof GoalCreationFormValues)[] = ["goalName"];
    const isValid = await form.trigger(aiTuneFields);
    if (!isValid) return;

    const values = form.getValues();
    questionsTargetStepRef.current = 7;
    setTemplateAiShortcutActive(true);
    getQuestionsMutation.mutate({
      user_id: userDetails.id,
      wizard_data: {
        goal_description: values.goalName,
        motivation: values.motivation,
        availability: values.availability,
        time_commitment: values.timeCommitment,
        accountability_type: values.accountabilityType,
        goal_type: values.goalType,
        timezone: detectedTimezone,
        goal_template_id: selectedTemplate?._id ? String(selectedTemplate._id) : undefined,
        goal_template_title: selectedTemplate?.title,
        goal_template_tasks: (values.tasks || []).map((task) => ({
          name: task.name,
          description: task.description,
          repeat_frequency: task.repeat_frequency,
        })),
        partner_name: partnerDisplayName || null,
        target_deadline: values.targetDeadline || null,
        preferred_check_in_style: values.preferredCheckInStyle,
        // Shared goal fields
        is_shared_goal: isSharedGoal,
        shared_goal_mode: sharedGoalMode,
        partner_timezone: userDetails?.partner_timezone,
        // Template enhancement mode
        template_enhancement_mode: !!selectedTemplate,
      },
    });
  };

  const handleNext = async () => {
    if (currentStep === 0) return;

    if (currentStep === 7) {
      if (!userDetails) {
        toast({ title: "User not found. Please log in again.", variant: "destructive" });
        return;
      }
      const allQuestionsAnswered = Boolean(
        strategicQuestions?.length &&
        strategicQuestions.every((question: any) => {
          const questionKey = question.question_key ?? question.questionKey;
          const answer = userAnswers[questionKey];
          return typeof answer === "string" && answer.trim().length > 0;
        }),
      );

      if (sessionId && allQuestionsAnswered) {
        getPlanMutation.mutate({ user_id: userDetails.id, session_id: sessionId, answers: userAnswers });
      } else {
        toast({ title: "Please answer all questions.", variant: "destructive" });
      }
      return;
    }

    const fieldsToValidate = stepFields[currentStep];
    const isValid = await form.trigger(fieldsToValidate);
    if (!isValid) return;

    if (currentStep === 6) {
      if (!userDetails) {
        toast({ title: "User not found. Please log in again.", variant: "destructive" });
        return;
      }
      const values = form.getValues();
      if (planningMode === "ai") {
        setTemplateAiShortcutActive(false);
        getQuestionsMutation.mutate({
          user_id: userDetails.id,
          wizard_data: {
            goal_description: values.goalName,
            motivation: values.motivation,
            availability: values.availability,
            time_commitment: values.timeCommitment,
            accountability_type: values.accountabilityType,
            goal_type: values.goalType,
            timezone: detectedTimezone,
            goal_template_id: selectedTemplate?._id ? String(selectedTemplate._id) : undefined,
            goal_template_title: selectedTemplate?.title,
            goal_template_tasks: (values.tasks || []).map((task) => ({
              name: task.name,
              description: task.description,
              repeat_frequency: task.repeat_frequency,
            })),
            partner_name: partnerDisplayName || null,
            target_deadline: values.targetDeadline || null,
            preferred_check_in_style: values.preferredCheckInStyle,
          },
        });
      } else {
        setTemplateAiShortcutActive(false);
        setFinalGoalPlan(buildManualPlanFromForm(values));
        setCurrentStep(8);
      }
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const recommendationReasons = ((finalGoalPlan as any)?.decision_trace || (finalGoalPlan as any)?.decisionTrace || [])
    .slice(0, 3)
    .map((reason: string) => reason.trim())
    .filter((reason: string) => reason.length > 0);

  const onSubmit = (values: GoalCreationFormValues) => {
    const effectivePlan = finalGoalPlan ?? buildManualPlanFromForm(values);
    const { motivation, availability, timeCommitment, accountabilityType, timeWindow, goalType, targetDeadline } = values;
    const parsedEndDate = goalType === "target-date" && targetDeadline ? Date.parse(targetDeadline) : NaN;
    const endDate = Number.isFinite(parsedEndDate) ? parsedEndDate : undefined;

    const computeWindowDuration = (start?: string | null, end?: string | null): number | undefined => {
      if (!start || !end) return undefined;
      const startMatch = start.match(/^(\d{1,2}):(\d{2})$/);
      const endMatch = end.match(/^(\d{1,2}):(\d{2})$/);
      if (!startMatch || !endMatch) return undefined;
      const startMinutes = Number(startMatch[1]) * 60 + Number(startMatch[2]);
      const endMinutes = Number(endMatch[1]) * 60 + Number(endMatch[2]);
      const duration = endMinutes >= startMinutes ? endMinutes - startMinutes : 24 * 60 - startMinutes + endMinutes;
      return duration > 0 ? duration : undefined;
    };

    const profileDefaults = (() => {
      try {
        return selectedTemplate?.profile_defaults_json ? JSON.parse(selectedTemplate.profile_defaults_json) : {};
      } catch {
        return {};
      }
    })();
    const selectedArchetype = selectedTemplate?.archetype || "general";
    const profileValidation = validateArchetypeProfile(selectedArchetype, profileDefaults);
    if (!profileValidation.ok) {
      toast({
        title: "Template settings incomplete",
        description: profileValidation.message,
        variant: "destructive",
      });
      return;
    }

    const goalToCreate = {
      name: effectivePlan.title,
      description: effectivePlan.description,
      motivation,
      category: "General",
      is_habit: goalType === "habit",
      goal_type: goalType,
      end_date: endDate,
      template_source_id: selectedTemplate?._id ? String(selectedTemplate._id) : undefined,
      template_source_slug: selectedTemplate?.slug,
      template_source_version: selectedTemplate?.template_version,
      template_source_title: selectedTemplate?.title,
      goal_archetype: selectedArchetype,
      goal_profile_json: selectedTemplate?.profile_defaults_json,
      color: "#FFFFFF",
      icon: "default",
      availability,
      time_commitment: timeCommitment,
      accountability_type: accountabilityType,
      tasks: (effectivePlan.milestones || []).flatMap((milestone: any) =>
        (milestone.tasks || []).map((task: any) => ({
          name: task.description,
          description: task.success_metric ?? task.successMetric,
          repeat_frequency: task.recommended_cadence ?? task.recommendedCadence ?? "daily",
          time_window: task.recommended_time_windows?.[0] ?? task.recommendedTimeWindows?.[0] ?? timeWindow,
          accountability_type: accountabilityType,
          verification_mode: task.verification_mode ?? task.verificationMode ?? "photo",
          verification_mode_reason:
            task.verification_mode_reason ?? task.verificationModeReason ?? "Photo verification offers clear evidence.",
          verification_confidence:
            typeof (task.verification_confidence ?? task.verificationConfidence) === "number"
              ? (task.verification_confidence ?? task.verificationConfidence)
              : 0.85,
          time_window_start: task.time_window_start ?? task.timeWindowStart ?? undefined,
          time_window_end: task.time_window_end ?? task.timeWindowEnd ?? undefined,
          time_window_duration_minutes:
            typeof task.time_window_duration_minutes === "number"
              ? task.time_window_duration_minutes
              : typeof task.timeWindowDurationMinutes === "number"
                ? task.timeWindowDurationMinutes
                : computeWindowDuration(task.time_window_start ?? task.timeWindowStart, task.time_window_end ?? task.timeWindowEnd),
          requires_partner_review:
            typeof (task.partner_required ?? task.partnerRequired) === "boolean"
              ? (task.partner_required ?? task.partnerRequired)
              : true,
          auto_approval_policy: task.auto_approval_policy || "time_window_only",
          auto_approval_timeout_hours:
            typeof (task.auto_approval_timeout_hours ?? task.autoApprovalTimeoutHours) === "number"
              ? (task.auto_approval_timeout_hours ?? task.autoApprovalTimeoutHours)
              : 24,
          auto_approval_min_confidence:
            typeof (task.auto_approval_min_confidence ?? task.autoApprovalMinConfidence) === "number"
              ? (task.auto_approval_min_confidence ?? task.autoApprovalMinConfidence)
              : 0.85,
        })),
      ),
    };

    // Branch: shared goal vs personal goal
    if (isSharedGoal && sharedGoalMode && userDetails?.partner_id && userDetails?.partnership_id) {
      setIsCreatingGoal(true);
      createSharedGoal({
        name: goalToCreate.name,
        description: goalToCreate.description,
        motivation: goalToCreate.motivation,
        category: goalToCreate.category,
        is_habit: goalToCreate.is_habit,
        goal_type: goalToCreate.goal_type,
        end_date: goalToCreate.end_date,
        goal_archetype: goalToCreate.goal_archetype as any,
        goal_profile_json: goalToCreate.goal_profile_json,
        availability: goalToCreate.availability,
        time_commitment: goalToCreate.time_commitment,
        accountability_type: goalToCreate.accountability_type,
        planning_mode: planningMode,
        ai_plan_json: finalGoalPlan ? JSON.stringify(finalGoalPlan) : undefined,
        shared_goal_mode: sharedGoalMode,
        partner_id: userDetails.partner_id,
        partnership_id: userDetails.partnership_id,
        tasks: goalToCreate.tasks.map((t: any) => ({
          name: t.name,
          description: t.description,
          repeat_frequency: t.repeat_frequency,
          time_window: t.time_window,
          verification_mode: t.verification_mode,
          time_window_start: t.time_window_start,
          time_window_end: t.time_window_end,
          time_window_duration_minutes: t.time_window_duration_minutes,
          requires_partner_review: t.requires_partner_review,
          is_template_task: true,
        })),
      })
        .then(() => {
          toast({
            title: "Shared Goal Created!",
            description: `Your partner will be notified to accept the goal.`,
          });
          router.push("/goals");
        })
        .catch((error: any) => {
          const message = typeof error?.message === "string" ? error.message : "Could not create the shared goal.";
          console.error("[GoalCreation] createSharedGoal failed", error);
          toast({
            title: "Error",
            description: message,
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsCreatingGoal(false);
        });
    } else {
      createGoalMutation.mutate(goalToCreate);
    }
  };

  return {
    form,
    fields,
    append,
    remove,
    currentStep,
    setCurrentStep,
    strategicQuestions,
    userProfileSummary,
    userAnswers,
    setUserAnswers,
    finalGoalPlan,
    planGenerationStage,
    showRecommendationReasons,
    setShowRecommendationReasons,
    suggestionQuery,
    setSuggestionQuery,
    suggestionGoalTypeFilter,
    setSuggestionGoalTypeFilter,
    suggestionProofFilter,
    setSuggestionProofFilter,
    selectedTemplate,
    planningMode,
    setPlanningMode,
    templateAiShortcutActive,
    templatesLoading,
    filteredSuggestions,
    detectedTimezone,
    createGoalFromTemplateNow,
    loadStarterTemplates,
    applySuggestedGoal,
    clearSelectedTemplate,
    startTemplateAiImprove,
    continueStepOneManual,
    continueStepOneAi,
    handleNext,
    handleBack,
    onSubmit,
    recommendationReasons,
    createGoalMutation,
    getQuestionsMutation,
    getPlanMutation,
    isCreatingGoal,
    // Shared goal
    isSharedGoal,
    setIsSharedGoal,
    sharedGoalMode,
    setSharedGoalMode,
    // Dynamic steps
    dynamicSteps,
  };
}
