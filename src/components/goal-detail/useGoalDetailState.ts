"use client";

import { useMemo, useState } from "react";
import { DomainGoal, DomainTask } from "../../../packages/domain/src/goals";
import { validateArchetypeProfile } from "@/lib/goals/archetype-validators";
import { WeekGroup } from "./types";
import { dayName, resolveVerificationMode } from "./utils";

const defaultProfileDraft = {
  currency: "USD",
  targetAmount: "",
  currentAmount: "",
  weeklyContribution: "",
  targetLongRunKm: "",
  currentLongRunKm: "",
  totalWeeks: "",
  completedWeeks: "",
  targetStreak: "",
  currentStreak: "",
  dailyTarget: "",
};

export function useGoalDetailState({
  goal,
  archetype,
  updateGoal,
  toast,
}: {
  goal: DomainGoal;
  archetype: string;
  updateGoal: any;
  toast: (payload: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}) {
  const [activeTab, setActiveTab] = useState<"this-week" | "full-plan" | "settings">("this-week");
  const [proofModalTaskId, setProofModalTaskId] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [collapsedMilestones, setCollapsedMilestones] = useState<Record<number, boolean>>({});

  const initialProfile = (() => {
    try {
      return goal.goalProfileJson ? JSON.parse(goal.goalProfileJson) : {};
    } catch {
      return {};
    }
  })();

  const [profileDraft, setProfileDraft] = useState<Record<string, string>>({
    ...defaultProfileDraft,
    currency: String(initialProfile.currency || "USD"),
    targetAmount: String(initialProfile.targetAmount || ""),
    currentAmount: String(initialProfile.currentAmount || ""),
    weeklyContribution: String(initialProfile.weeklyContribution || ""),
    targetLongRunKm: String(initialProfile.targetLongRunKm || ""),
    currentLongRunKm: String(initialProfile.currentLongRunKm || ""),
    totalWeeks: String(initialProfile.totalWeeks || ""),
    completedWeeks: String(initialProfile.completedWeeks || ""),
    targetStreak: String(initialProfile.targetStreak || ""),
    currentStreak: String(initialProfile.currentStreak || ""),
    dailyTarget: String(initialProfile.dailyTarget || ""),
  });

  const groupedWeekTasks = useMemo<WeekGroup[]>(() => {
    const now = new Date();
    const todayKey = now.toDateString();
    const buckets = new Map<string, DomainTask[]>();

    for (const task of goal.tasks) {
      const date = new Date(task.created_at);
      const key = date.toDateString();
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(task);
    }

    const entries = [...buckets.entries()].sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
    const groups = entries.map(([key, tasks]) => ({
      label: key === todayKey ? "TODAY" : dayName(new Date(key)),
      tasks,
    }));

    if (!groups.some((group) => group.label === "TODAY")) {
      groups.push({ label: "TODAY", tasks: [] });
    }

    return groups;
  }, [goal.tasks]);

  const completedCount = goal.tasks.filter((task) => task.status === "completed").length;

  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 1800);
  };

  const handleTaskAction = (task: DomainTask) => {
    const mode = resolveVerificationMode(task, goal.accountabilityType || undefined);
    if (mode === "task_completion" || mode === "time-window") {
      triggerCelebration();
      return;
    }
    setProofModalTaskId(task.id);
  };

  const handleProofSubmit = () => {
    setProofModalTaskId(null);
    triggerCelebration();
  };

  const saveProfile = () => {
    const toNumber = (value: string) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    let payload: Record<string, unknown> = {};
    if (archetype === "savings") {
      payload = {
        currency: profileDraft.currency || "USD",
        targetAmount: toNumber(profileDraft.targetAmount),
        currentAmount: toNumber(profileDraft.currentAmount),
        weeklyContribution: toNumber(profileDraft.weeklyContribution),
      };
    } else if (archetype === "marathon") {
      payload = {
        targetLongRunKm: toNumber(profileDraft.targetLongRunKm),
        currentLongRunKm: toNumber(profileDraft.currentLongRunKm),
        totalWeeks: toNumber(profileDraft.totalWeeks),
        completedWeeks: toNumber(profileDraft.completedWeeks),
      };
    } else if (archetype === "daily_habit") {
      payload = {
        targetStreak: toNumber(profileDraft.targetStreak),
        currentStreak: toNumber(profileDraft.currentStreak),
        dailyTarget: toNumber(profileDraft.dailyTarget),
      };
    }

    const validation = validateArchetypeProfile(archetype as any, payload);
    if (!validation.ok) {
      toast({
        title: "Invalid goal settings",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    setIsSavingProfile(true);
    updateGoal.mutate(
      { goal_archetype: archetype, goal_profile_json: JSON.stringify(payload) },
      { onSettled: () => setIsSavingProfile(false) }
    );
  };

  const toggleMilestone = (idx: number) => {
    setCollapsedMilestones((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return {
    activeTab,
    setActiveTab,
    proofModalTaskId,
    setProofModalTaskId,
    isSavingProfile,
    showCelebration,
    collapsedMilestones,
    toggleMilestone,
    groupedWeekTasks,
    completedCount,
    profileDraft,
    setProfileDraft,
    handleTaskAction,
    handleProofSubmit,
    saveProfile,
  };
}
