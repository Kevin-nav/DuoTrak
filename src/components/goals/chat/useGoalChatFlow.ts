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
  getGoalChatSummary,
  patchGoalChatSummary,
  streamGoalChatTurn,
  type GoalChatProfileState,
} from "@/lib/api/goal-chat";

type ChatMessage = { id: string; role: "assistant" | "user"; text: string };

const toGoalPayload = (plan: Record<string, any>) => {
  const intent = (plan.intent ?? "habit") as "habit" | "target-date" | "milestone";
  const endDate = intent === "target-date" && typeof plan.deadline === "string" ? Date.parse(plan.deadline) : NaN;
  const tasks = Array.isArray(plan.tasks) ? plan.tasks : [];

  return {
    name: (plan.success_definition as string) || "AI Goal",
    description: `Created from AI goal chat (${intent})`,
    motivation: (plan.success_definition as string) || "",
    category: "General",
    is_habit: intent === "habit",
    goal_type: intent,
    end_date: Number.isFinite(endDate) ? endDate : undefined,
    goal_archetype: "general" as const,
    goal_profile_json: JSON.stringify({ profile: plan.profile_summary || "" }),
    availability: plan.availability ? [String(plan.availability)] : [],
    time_commitment: typeof plan.time_budget === "string" ? plan.time_budget : undefined,
    accountability_type: typeof plan.accountability_mode === "string" ? plan.accountability_mode : "partner-review",
    tasks: tasks.map((task: any) => ({
      name: String(task.name || "Task"),
      description: task.description ? String(task.description) : undefined,
      repeat_frequency: intent === "habit" ? "daily" : "weekly",
      accountability_type: String(plan.accountability_mode || "partner-review"),
      verification_mode: "photo",
      verification_mode_reason: "Partner review accountability",
      verification_confidence: 0.9,
      requires_partner_review: Boolean(task.requires_partner_review ?? true),
      auto_approval_policy: "none",
      auto_approval_timeout_hours: 24,
      auto_approval_min_confidence: 0.85,
    })),
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
  const [screen, setScreen] = useState<"chat" | "summary">("chat");
  const [summary, setSummary] = useState<Record<string, any> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { userDetails } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const createGoal = useConvexMutation(api.goals.createWithInstances);

  useEffect(() => {
    let mounted = true;
    createGoalChatSession({
      user_id: userDetails?.id,
      behavioral_summary: "Behavioral profile inference will be enriched from historical performance data.",
    })
      .then((session) => {
        if (!mounted) return;
        setSessionId(session.session_id);
        setMissingSlots(session.missing_slots);
        setProfile(session.profile);
        setMessages([{ id: crypto.randomUUID(), role: "assistant", text: "Tell me the goal you want to create, and I’ll guide you one step at a time." }]);
      })
      .catch((error) => {
        toast({ title: "Failed to start goal chat", description: String(error), variant: "destructive" });
      });
    return () => {
      mounted = false;
    };
  }, [toast, userDetails?.id]);

  const sendMessage = async (text: string, selectedChip?: string) => {
    if (!sessionId || isStreaming) return;
    const outgoing = selectedChip || text.trim();
    if (!outgoing) return;

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
      );
    } catch (error) {
      toast({ title: "Streaming failed", description: String(error), variant: "destructive" });
    } finally {
      setIsStreaming(false);
    }
  };

  const openSummary = async () => {
    if (!sessionId) return;
    try {
      const data = await getGoalChatSummary(sessionId);
      setSummary(data.summary);
      setScreen("summary");
    } catch (error) {
      toast({ title: "Could not load summary", description: String(error), variant: "destructive" });
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
    if (!sessionId || !summary) return;
    try {
      setIsCreating(true);
      await patchGoalChatSummary(sessionId, summary);
      const finalized = await finalizeGoalChat(sessionId, Boolean(userDetails?.partner_id));
      if (!finalized.finalized || !finalized.goal_plan) {
        throw new Error((finalized.validation_errors || []).join(", ") || "Plan validation failed.");
      }
      const goalId = await createGoal(toGoalPayload(finalized.goal_plan) as any);
      toast({ title: "Goal created", description: "Your new goal is live." });
      router.push(`/goals/${goalId}`);
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
    isStreaming,
    readyForSummary,
    openSummary,
    summary,
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
