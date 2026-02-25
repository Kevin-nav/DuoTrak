"use client";

import { useState } from "react";
import { DomainGoal } from "../../../packages/domain/src/goals";
import { validateArchetypeProfile } from "@/lib/goals/archetype-validators";
import { resolveVerificationMode } from "./utils";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { TabKey } from "./types";

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
  const [activeTab, setActiveTab] = useState<TabKey>("this-week");
  const [proofModal, setProofModal] = useState<{ instanceId: string; taskName: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [collapsedMilestones, setCollapsedMilestones] = useState<Record<number, boolean>>({});
  const markInstanceComplete = useMutation((api as any).taskInstances.markComplete);
  const submitInstanceVerification = useMutation((api as any).taskInstances.submitVerification);

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

  const completedCount = goal.tasks.filter((task) => task.status === "completed").length;

  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 1800);
  };

  const handleTaskAction = async (task: any) => {
    const mode = resolveVerificationMode(
      {
        verificationMode: task.verificationMode || task.task_verification_mode,
        accountabilityType: task.accountabilityType || task.task_accountability_type,
      } as any,
      goal.accountabilityType || undefined
    );
    if (mode === "task_completion" || mode === "time-window") {
      const instanceId = task._id;
      if (!instanceId) return;
      try {
        await markInstanceComplete({ instance_id: instanceId } as any);
        triggerCelebration();
      } catch (error: any) {
        toast({
          title: "Could not update task",
          description: error?.message || "Please try again.",
          variant: "destructive",
        });
      }
      return;
    }
    setProofModal({
      instanceId: String(task._id || task.instance_id || ""),
      taskName: String(task.task_name || task.name || "Task"),
    });
  };

  const handleProofSubmit = async () => {
    if (!proofModal?.instanceId) return;
    try {
      await submitInstanceVerification({ instance_id: proofModal.instanceId } as any);
      setProofModal(null);
      triggerCelebration();
    } catch (error: any) {
      toast({
        title: "Could not submit verification",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
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
    proofModal,
    setProofModal,
    isSavingProfile,
    showCelebration,
    collapsedMilestones,
    toggleMilestone,
    completedCount,
    profileDraft,
    setProfileDraft,
    handleTaskAction,
    handleProofSubmit,
    saveProfile,
  };
}
