import * as z from "zod";

export interface WizardStep {
  id: string;
  title: string;
  description: string;
}

const taskSchema = z.object({
  name: z.string().min(1, "Task name cannot be empty."),
  description: z.string().optional(),
  repeat_frequency: z.string().optional(),
  is_template_task: z.boolean().optional(),
  cadence_type: z.enum(["daily", "weekly", "custom"]).optional(),
  cadence_days: z.array(z.string()).optional(),
  cadence_duration_weeks: z.number().optional(),
  difficulty_level: z.number().min(1).max(5).optional(),
  minimum_viable_action: z.string().optional(),
});

export const formSchema = z
  .object({
    goalType: z.enum(["habit", "target-date", "milestone"]),
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

    // ── Shared Goal ──
    isSharedGoal: z.boolean().optional(),
    sharedGoalMode: z.enum(["independent", "together"]).optional(),

    // ── Planning Mode ──
    planningMode: z.enum(["ai", "manual"]).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.goalType === "target-date" && !values.targetDeadline?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["targetDeadline"],
        message: "Target deadline is required for target-date goals.",
      });
    }

    if (values.accountabilityType === "time_bound_action" && !values.timeWindow?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timeWindow"],
        message: "Time window is required for time-bound accountability.",
      });
    }
  });

export type GoalCreationFormValues = z.infer<typeof formSchema>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Step Definitions — Dynamic based on AI vs Manual path
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Common entry point */
export const startStep: WizardStep = {
  id: "goal",
  title: "What's Your Goal?",
  description: "Tell us what you want to achieve, or pick a template.",
};

/** AI-specific steps */
export const aiSteps: WizardStep[] = [
  { id: "personalize", title: "Quick Questions", description: "Help us personalize your plan." },
  { id: "review", title: "Your AI Plan", description: "Review your personalized plan." },
];

/** Manual-specific steps */
export const manualSteps: WizardStep[] = [
  { id: "motivation", title: "Your Why", description: "What drives you?" },
  { id: "availability", title: "Your Schedule", description: "When can you work on this?" },
  { id: "time", title: "Time Investment", description: "Set a sustainable effort level." },
  { id: "target-date", title: "Target Date", description: "Set your timeline." },
  { id: "checkin-style", title: "Check-In Style", description: "How to update your partner." },
  { id: "accountability", title: "Accountability", description: "How will completion be verified?" },
  { id: "review", title: "Review Your Plan", description: "Your goal plan is ready." },
];

/** Shared goal step (conditional) */
export const sharedGoalStep: WizardStep = {
  id: "sharing",
  title: "Share With Partner",
  description: "Set up your duo goal.",
};

/** Final confirmation step */
export const confirmStep: WizardStep = {
  id: "confirm",
  title: "Ready to Start",
  description: "Your day-one plan is ready.",
};

/**
 * Build the dynamic step list based on the chosen path.
 */
export function buildStepList(mode: "ai" | "manual", isShared: boolean): WizardStep[] {
  const steps = [startStep];

  if (mode === "ai") {
    steps.push(...aiSteps);
  } else {
    steps.push(...manualSteps);
  }

  if (isShared) {
    steps.push(sharedGoalStep);
  }

  steps.push(confirmStep);
  return steps;
}

/**
 * Legacy steps export for backward compatibility.
 * Tests and components that import `steps` will still work.
 */
export const steps: WizardStep[] = [
  { id: "goal", title: "Choose a Goal Starter", description: "Pick a suggested goal, then personalize it to fit you." },
  { id: "motivation", title: "Your Why", description: "What drives you?" },
  { id: "availability", title: "Your Schedule", description: "When can you work on this?" },
  { id: "time", title: "Time Investment", description: "Set a sustainable effort level." },
  { id: "target-date", title: "Target Completion Date", description: "Set your timeline for this goal." },
  { id: "checkin-style", title: "Check-In Style", description: "Pick how you want to update your partner." },
  { id: "accountability", title: "Accountability", description: "How will completion be verified?" },
  { id: "personalize", title: "Plan Questions", description: "Answer these questions for a tailored strategy." },
  { id: "review", title: "Review Your Plan", description: "Your goal plan is ready." },
];

export const availabilityOptions = [
  "Weekday mornings (6-9 AM)",
  "Weekday lunch break (12-2 PM)",
  "Weekday evenings (6-9 PM)",
  "Weekends (8 AM-6 PM)",
  "Late night (9 PM-12 AM)",
  "Flexible windows",
];

export const timeCommitmentOptions = [
  "10-15 min - 5-7 sessions/week",
  "20-30 min - 4-5 sessions/week",
  "30-45 min - 3-4 sessions/week",
  "45-60 min - 2-3 sessions/week",
  "60-90 min - 2 sessions/week",
  "Custom schedule",
];

export const checkInStyleOptions = [
  { value: "quick_text", label: "Quick Text", description: "Fast daily check-ins in a sentence or two." },
  { value: "photo_recap", label: "Photo Recap", description: "Share a quick picture recap after sessions." },
  { value: "voice_note", label: "Voice Note", description: "Send short audio updates for richer context." },
] as const;
