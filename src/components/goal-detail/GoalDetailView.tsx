"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DomainGoal } from "../../../packages/domain/src/goals";
import { getGoalProgressModel, inferGoalArchetype } from "@/lib/goals/progress-metrics";
import { useUpdateGoal } from "@/hooks/useGoals";
import { useToast } from "@/hooks/use-toast";
import TaskVerificationModal from "../task-verification-modal";
import GoalHeaderCard from "./GoalHeaderCard";
import GoalTabs from "./GoalTabs";
import ThisWeekTab from "./ThisWeekTab";
import AllTasksTab from "./AllTasksTab";
import FullPlanTab from "./FullPlanTab";
import GoalSettingsTab from "./GoalSettingsTab";
import CelebrationOverlay from "./CelebrationOverlay";
import { useGoalDetailState } from "./useGoalDetailState";
import { GoalDetailViewProps } from "./types";
import { useGoalExecution } from "@/hooks/useGoalExecution";

export default function GoalDetailView({ goal }: GoalDetailViewProps) {
  const router = useRouter();
  const updateGoal = useUpdateGoal(goal.id);
  const { toast } = useToast();

  const archetype = inferGoalArchetype(goal);
  const progressModel = getGoalProgressModel(goal);
  const { data: executionData, isLoading: isExecutionLoading } = useGoalExecution(goal.id, {
    timelineLimit: 200,
  });

  const {
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
      <button
        type="button"
        onClick={() => router.back()}
        className="fixed left-3 top-[calc(env(safe-area-inset-top)+0.65rem)] z-40 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card/95 text-muted-foreground shadow-sm backdrop-blur sm:hidden"
        aria-label="Go back"
      >
        <ArrowLeft className="h-4.5 w-4.5" />
      </button>

      <div className="mx-auto max-w-2xl px-3 pt-14 sm:px-4 sm:pt-8">
        <GoalHeaderCard
          goal={goal}
          archetype={archetype}
          completedCount={completedCount}
          progressModel={progressModel}
          onBack={() => router.back()}
        />

        <GoalTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "this-week" ? (
          isExecutionLoading || !executionData ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Loading weekly task instances...
            </div>
          ) : (
            <ThisWeekTab
              weekStart={executionData.week_start}
              weekInstances={executionData.week_instances}
              weekSummary={executionData.week_summary}
              onTaskAction={handleTaskAction}
            />
          )
        ) : null}

        {activeTab === "all-tasks" ? (
          isExecutionLoading || !executionData ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Loading task timeline...
            </div>
          ) : (
            <AllTasksTab
              allInstances={executionData.all_instances}
              todayStart={executionData.today_start}
              todayEnd={executionData.today_end}
            />
          )
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
          isOpen={!!proofModal}
          onClose={() => setProofModal(null)}
          taskName={proofModal?.taskName || ""}
          onSubmit={handleProofSubmit}
        />

        <CelebrationOverlay show={showCelebration} />
      </div>
    </div>
  );
}
