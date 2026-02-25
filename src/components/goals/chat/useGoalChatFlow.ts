"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation as useConvexMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import {
  createGoalChatSession,
  finalizeGoalChat,
  generateGoalPlan,
  getGoalChatSummary,
  patchGoalChatSummary,
  streamGoalChatTurn,
  type GeneratedPlan,
  type GoalChatProfileState,
} from "@/lib/api/goal-chat";

type ChatMessage = { id: string; role: "assistant" | "user"; text: string };

/** Map frequency string to Convex cadence_type */
const toCadenceType = (freq: string): "daily" | "weekly" | "custom" => {
  if (freq === "daily") return "daily";
  if (freq === "weekly" || freq === "biweekly" || freq === "monthly") return "weekly";
  return "custom";
};

/**
 * Convert the AI-generated plan into the exact shape Convex's
 * `goals.createWithInstances` expects — no extra fields.
 */
const toGoalPayload = (plan: GeneratedPlan) => {
  const intent = (plan.intent ?? "habit") as "habit" | "target-date" | "milestone";
  const endDate =
    intent === "target-date" && typeof plan.deadline === "string" ? Date.parse(plan.deadline) : NaN;

  // Flatten milestones → tasks, mapping to Convex schema fields
  const tasks = plan.milestones.flatMap((milestone) =>
    milestone.tasks.map((task) => ({
      name: String(task.name || "Task"),
      description: task.description || undefined,
      repeat_frequency: task.frequency || "weekly",
      accountability_type: task.accountability_type || plan.accountability_type || "task_completion",
      verification_mode: task.accountability_type || plan.accountability_type || "task_completion",
      verification_mode_reason: "Partner accountability",
      verification_confidence: 0.9,
      requires_partner_review: true,
      auto_approval_policy: "none",
      auto_approval_timeout_hours: 24,
      auto_approval_min_confidence: 0.85,
      is_template_task: true,
      // Convex schema fields for schedule
      cadence_type: toCadenceType(task.frequency),
      cadence_days: task.days,
      time_window_duration_minutes: task.duration_minutes,
    })),
  );

  // Store milestone metadata in ai_plan_json for progress tracking
  const aiPlan = {
    milestones: plan.milestones.map((m) => ({
      name: m.name,
      description: m.description,
      target_week: m.target_week,
      progress_weight: m.progress_weight,
      task_count: m.tasks.length,
    })),
    generated_at: new Date().toISOString(),
  };

  return {
    name: plan.title || "AI Goal",
    description: plan.description || `Created from AI goal chat (${intent})`,
    motivation: plan.description || "",
    category: "General",
    is_habit: intent === "habit",
    goal_type: intent,
    end_date: Number.isFinite(endDate) ? endDate : undefined,
    goal_archetype: "general" as const,
    accountability_type: plan.accountability_type || "task_completion",
    planning_mode: "ai" as const,
    ai_plan_json: JSON.stringify(aiPlan),
    tasks,
  };
};

export function useGoalChatFlow() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [missingSlots, setMissingSlots] = useState<string[]>([]);
  const [profile, setProfile] = useState<GoalChatProfileState | null>(null);
  const [profileAnswers, setProfileAnswers] = useState<Record<string, string>>({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [readyForSummary, setReadyForSummary] = useState(false);
  const [screen, setScreen] = useState<"chat" | "summary" | "plan">("chat");
  const [summary, setSummary] = useState<Record<string, any> | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { userDetails } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const createGoal = useConvexMutation(api.goals.createWithInstances);

  useEffect(() => {
    let mounted = true;
    console.log("[GoalChat] Creating session...");
    createGoalChatSession({
      user_id: userDetails?.id,
      behavioral_summary: "Behavioral profile inference will be enriched from historical performance data.",
    })
      .then((session) => {
        if (!mounted) return;
        console.log("[GoalChat] Session created:", session.session_id);
        setSessionId(session.session_id);
        setMissingSlots(session.missing_slots);
        setProfile(session.profile);
        setMessages([{ id: crypto.randomUUID(), role: "assistant", text: "Tell me the goal you want to create, and I'll guide you one step at a time." }]);
      })
      .catch((error) => {
        console.error("[GoalChat] Session creation FAILED:", error);
        toast({ title: "Failed to start goal chat", description: String(error), variant: "destructive" });
      });
    return () => {
      mounted = false;
    };
  }, [toast, userDetails?.id]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = async (text: string, selectedChip?: string) => {
    console.log("[GoalChat] sendMessage called. sessionId:", sessionId, "isStreaming:", isStreaming);
    if (!sessionId || isStreaming) {
      console.warn("[GoalChat] sendMessage blocked — sessionId:", sessionId, "isStreaming:", isStreaming);
      return;
    }
    const outgoing = selectedChip || text.trim();
    if (!outgoing) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsStreaming(true);
    setInput("");
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", text: outgoing }]);

    const assistantId = crypto.randomUUID();
    setMessages((m) => [...m, { id: assistantId, role: "assistant", text: "" }]);

    try {
      await streamGoalChatTurn(
        sessionId,
        {
          message: outgoing,
          selected_chip: selectedChip,
          profile_answers: profileAnswers,
        },
        {
          onToken: (token) => {
            setMessages((current) =>
              current.map((msg) => (msg.id === assistantId ? { ...msg, text: msg.text + token } : msg)),
            );
          },
          onChips: (nextChips) => setChips(nextChips),
          onQuestionState: (state) => {
            setMissingSlots(state.missing_slots);
            setProfile(state.profile);
            setReadyForSummary(state.is_ready_to_finalize);
          },
          onReadyForSummary: (ready) => setReadyForSummary(ready),
        },
        controller.signal,
      );
    } catch (error) {
      if (!controller.signal.aborted) {
        toast({ title: "Streaming failed", description: String(error), variant: "destructive" });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const openSummary = async () => {
    if (!sessionId) return;
    try {
      setIsGeneratingPlan(true);
      setScreen("plan");
      const data = await generateGoalPlan(sessionId);
      setGeneratedPlan(data.plan);
    } catch (error) {
      toast({ title: "Could not generate plan", description: String(error), variant: "destructive" });
      setScreen("chat");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const updateSummaryField = (key: string, value: any) => {
    setSummary((current) => ({ ...(current || {}), [key]: value }));
  };

  const updateSummaryTask = (index: number, patch: Record<string, any>) => {
    setSummary((current) => {
      const next = { ...(current || {}) };
      const tasks = Array.isArray(next.tasks) ? [...next.tasks] : [];
      tasks[index] = { ...(tasks[index] || {}), ...patch };
      next.tasks = tasks;
      return next;
    });
  };

  const approveAndCreate = async () => {
    if (!sessionId) return;
    try {
      setIsCreating(true);

      if (generatedPlan) {
        // Use the AI-generated plan directly
        const goalId = await createGoal(toGoalPayload(generatedPlan) as any);
        toast({ title: "Goal created", description: "Your new goal is live!" });
        router.push(`/goals/${goalId}`);
      } else if (summary) {
        // Fallback: old summary flow
        await patchGoalChatSummary(sessionId, summary);
        const finalized = await finalizeGoalChat(sessionId, Boolean(userDetails?.partner_id));
        if (!finalized.finalized || !finalized.goal_plan) {
          throw new Error((finalized.validation_errors || []).join(", ") || "Plan validation failed.");
        }
        const goalId = await createGoal(toGoalPayload(finalized.goal_plan as any) as any);
        toast({ title: "Goal created", description: "Your new goal is live!" });
        router.push(`/goals/${goalId}`);
      }
    } catch (error) {
      toast({ title: "Could not create goal", description: String(error), variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const missingText = useMemo(() => (missingSlots.length ? missingSlots.join(", ") : "none"), [missingSlots]);

  return {
    sessionId,
    screen,
    setScreen,
    messages,
    input,
    setInput,
    chips,
    sendMessage,
    stopGeneration,
    isStreaming,
    readyForSummary,
    openSummary,
    summary,
    generatedPlan,
    isGeneratingPlan,
    updateSummaryField,
    updateSummaryTask,
    approveAndCreate,
    isCreating,
    profile,
    profileAnswers,
    setProfileAnswers,
    missingText,
  };
}
