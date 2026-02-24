"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation as useConvexMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import {
  createGoalChatSession,
  finalizeGoalChat,
  sendGoalChatTurn,
  type GoalChatFinalizeResponse,
  type GoalChatProfileState,
  type GoalChatSlotUpdates,
  type GoalChatTask,
} from "@/lib/api/goal-chat";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const SLOT_LABELS: Record<string, string> = {
  intent: "Goal Type",
  success_definition: "Success Definition",
  availability: "Availability",
  time_budget: "Time Budget",
  accountability_mode: "Accountability Style",
  deadline: "Deadline",
  review_cycle: "Review Cycle",
  tasks: "Tasks",
};

const slotPromptText = (slot: string | undefined) => {
  if (!slot) return "Tell me about the goal you want to create.";
  return `Let's fill: ${SLOT_LABELS[slot] ?? slot}`;
};

const createTaskTemplate = (): GoalChatTask => ({
  name: "",
  description: "",
  requires_partner_review: true,
  review_sla: "24h",
  escalation_policy: "Escalate after missed SLA",
});

const mapPlanToGoalPayload = (plan: Record<string, any>) => {
  const intent = (plan.intent ?? "habit") as "habit" | "target-date" | "milestone";
  const tasks = Array.isArray(plan.tasks) ? plan.tasks : [];
  const endDateMs = intent === "target-date" && typeof plan.deadline === "string" ? Date.parse(plan.deadline) : NaN;

  return {
    name: (plan.success_definition as string) || "AI Chat Goal",
    description: `Goal built with AI chat: ${plan.intent ?? "habit"}`,
    motivation: (plan.success_definition as string) || "",
    category: "General",
    icon: "default",
    color: "#FFFFFF",
    is_habit: intent === "habit",
    goal_type: intent,
    end_date: Number.isFinite(endDateMs) ? endDateMs : undefined,
    goal_archetype: "general" as const,
    goal_profile_json: JSON.stringify({ profile_summary: plan.profile_summary || "" }),
    availability: plan.availability ? [String(plan.availability)] : [],
    time_commitment: typeof plan.time_budget === "string" ? plan.time_budget : undefined,
    accountability_type: typeof plan.accountability_mode === "string" ? plan.accountability_mode : undefined,
    tasks: tasks
      .filter((task: any) => typeof task?.name === "string" && task.name.trim().length > 0)
      .map((task: any) => ({
        name: String(task.name),
        description: task.description ? String(task.description) : undefined,
        repeat_frequency: intent === "habit" ? "daily" : "weekly",
        accountability_type: String(plan.accountability_mode || "partner-review"),
        verification_mode: "photo",
        verification_mode_reason: "Partner accountability requires visible proof.",
        verification_confidence: 0.9,
        requires_partner_review: true,
        auto_approval_policy: "none",
        auto_approval_timeout_hours: 24,
        auto_approval_min_confidence: 0.85,
      })),
  };
};

export function useGoalChatFlow() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [missingSlots, setMissingSlots] = useState<string[]>([]);
  const [capturedSlots, setCapturedSlots] = useState<Record<string, any>>({});
  const [profile, setProfile] = useState<GoalChatProfileState | null>(null);
  const [slotDraft, setSlotDraft] = useState<GoalChatSlotUpdates>({});
  const [profileDraft, setProfileDraft] = useState<Record<string, string>>({});
  const [tasksDraft, setTasksDraft] = useState<GoalChatTask[]>([createTaskTemplate()]);
  const [finalizedPlan, setFinalizedPlan] = useState<GoalChatFinalizeResponse | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const activeSlot = missingSlots[0];
  const router = useRouter();
  const createGoal = useConvexMutation(api.goals.createWithInstances);
  const { userDetails } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    createGoalChatSession({
      user_id: userDetails?.id,
      behavioral_summary: "Behavioral signals will be connected to historical performance in the next backend slice.",
    })
      .then((response) => {
        if (!mounted) return;
        setSessionId(response.session_id);
        setMissingSlots(response.missing_slots);
        setProfile(response.profile);
        setMessages([
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: slotPromptText(response.missing_slots[0]),
          },
        ]);
      })
      .catch((error) => {
        toast({
          title: "Could not start AI goal chat",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      });
    return () => {
      mounted = false;
    };
  }, [toast, userDetails?.id]);

  const requiredSlotsSummary = useMemo(
    () => missingSlots.map((slot) => SLOT_LABELS[slot] ?? slot),
    [missingSlots],
  );

  const setDraftValue = (slot: keyof GoalChatSlotUpdates, value: any) => {
    setSlotDraft((current) => ({ ...current, [slot]: value }));
  };

  const addTask = () => {
    setTasksDraft((current) => [...current, createTaskTemplate()]);
  };

  const updateTask = (index: number, patch: Partial<GoalChatTask>) => {
    setTasksDraft((current) => current.map((task, i) => (i === index ? { ...task, ...patch } : task)));
  };

  const submitTurn = async () => {
    if (!sessionId) return;
    const userText = slotPromptText(activeSlot);
    const payload: GoalChatSlotUpdates = { ...slotDraft };
    if (activeSlot === "tasks") {
      payload.tasks = tasksDraft;
    }

    try {
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: userText }]);
      const response = await sendGoalChatTurn(sessionId, {
        message: userText,
        slot_updates: payload,
        profile_answers: profileDraft,
      });

      setCapturedSlots(response.captured_slots);
      setMissingSlots(response.missing_slots);
      setProfile(response.profile);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: response.next_prompt }]);
      setSlotDraft({});
    } catch (error) {
      toast({
        title: "Turn failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const finalize = async () => {
    if (!sessionId) return;
    try {
      const response = await finalizeGoalChat(sessionId, { has_partner: Boolean(userDetails?.partner_id) });
      setFinalizedPlan(response);
      toast({
        title: "Plan ready",
        description: "Review generated tasks and create the goal when ready.",
      });
    } catch (error) {
      toast({
        title: "Finalize blocked",
        description: error instanceof Error ? error.message : "Fill missing required details.",
        variant: "destructive",
      });
    }
  };

  const createFromPlan = async () => {
    if (!finalizedPlan?.goal_plan) return;
    try {
      setIsCreating(true);
      const payload = mapPlanToGoalPayload(finalizedPlan.goal_plan);
      const goalId = await createGoal(payload as any);
      toast({
        title: "Goal created",
        description: "Your AI-built goal is live.",
      });
      router.push(`/goals/${goalId}`);
    } catch (error) {
      toast({
        title: "Create failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return {
    sessionId,
    messages,
    missingSlots,
    capturedSlots,
    requiredSlotsSummary,
    activeSlot,
    slotDraft,
    setDraftValue,
    profile,
    profileDraft,
    setProfileDraft,
    tasksDraft,
    addTask,
    updateTask,
    submitTurn,
    finalize,
    finalizedPlan,
    createFromPlan,
    isCreating,
  };
}
