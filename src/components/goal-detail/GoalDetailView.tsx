"use client";

import { useRouter } from "next/navigation";
import { DomainGoal } from "../../../packages/domain/src/goals";
import { getGoalProgressModel, inferGoalArchetype } from "@/lib/goals/progress-metrics";
import { useUpdateGoal } from "@/hooks/useGoals";
import { useToast } from "@/hooks/use-toast";
import TaskVerificationModal from "../task-verification-modal";
import GoalHeaderCard from "./GoalHeaderCard";
import GoalTabs from "./GoalTabs";
import ThisWeekTab from "./ThisWeekTab";
import FullPlanTab from "./FullPlanTab";
import GoalSettingsTab from "./GoalSettingsTab";
import CelebrationOverlay from "./CelebrationOverlay";
import { useGoalDetailState } from "./useGoalDetailState";
import { GoalDetailViewProps } from "./types";

export default function GoalDetailView({ goal }: GoalDetailViewProps) {
  const router = useRouter();
  const updateGoal = useUpdateGoal(goal.id);
  const { toast } = useToast();

  const archetype = inferGoalArchetype(goal);
  const progressModel = getGoalProgressModel(goal);

  const {
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
  } = useGoalDetailState({
    goal,
    archetype,
    updateGoal,
    toast: (payload) =>
      toast({
        title: payload.title,
        description: payload.description,
        variant: payload.variant,
      }),
  });

  return (
    <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
      <div className="mx-auto max-w-2xl px-3 pt-4 sm:px-4 sm:pt-8">
        <GoalHeaderCard
          goal={goal}
          archetype={archetype}
          completedCount={completedCount}
          progressModel={progressModel}
          onBack={() => router.back()}
        />

        <GoalTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "this-week" ? (
          <ThisWeekTab
            goal={goal}
            groupedWeekTasks={groupedWeekTasks}
            onTaskAction={handleTaskAction}
          />
        ) : null}

        {activeTab === "full-plan" ? (
          <FullPlanTab
            goal={goal}
            collapsedMilestones={collapsedMilestones}
            onToggleMilestone={toggleMilestone}
          />
        ) : null}

        {activeTab === "settings" ? (
          <GoalSettingsTab
            archetype={archetype}
            profileDraft={profileDraft}
            onProfileDraftChange={setProfileDraft}
            isSavingProfile={isSavingProfile}
            onSave={saveProfile}
          />
        ) : null}

        <TaskVerificationModal
          isOpen={!!proofModalTaskId}
          onClose={() => setProofModalTaskId(null)}
          taskName={goal.tasks.find((task) => task.id === proofModalTaskId)?.name || ""}
          onSubmit={() => handleProofSubmit()}
        />

        <CelebrationOverlay show={showCelebration} />
      </div>
    </div>
  );
}
