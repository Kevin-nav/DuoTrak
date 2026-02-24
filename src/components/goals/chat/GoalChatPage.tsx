"use client";

import Link from "next/link";
import GoalChatComposer from "@/components/goals/chat/GoalChatComposer";
import GoalChatThread from "@/components/goals/chat/GoalChatThread";
import GoalPlanPreviewPanel from "@/components/goals/chat/GoalPlanPreviewPanel";
import { useGoalChatFlow } from "@/components/goals/chat/useGoalChatFlow";

export default function GoalChatPage() {
  const flow = useGoalChatFlow();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <header className="mb-6 rounded-2xl border border-cool-gray bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-5 dark:border-gray-700 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">New Goal System</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-charcoal dark:text-gray-100">AI Goal Chat</h1>
        <p className="mt-2 max-w-3xl text-sm text-stone-gray dark:text-gray-300">
          Build goals by conversation. The assistant interviews you, enforces partner accountability, and converts intent
          into a strict executable plan.
        </p>
        <p className="mt-2 text-xs text-stone-gray dark:text-gray-400">
          Fallback:{" "}
          <Link href="/goals/new" className="font-semibold text-primary-blue hover:underline">
            open classic wizard
          </Link>
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <GoalChatThread messages={flow.messages} />
          <GoalChatComposer
            activeSlot={flow.activeSlot}
            slotDraft={flow.slotDraft}
            setDraftValue={flow.setDraftValue}
            tasksDraft={flow.tasksDraft}
            addTask={flow.addTask}
            updateTask={flow.updateTask}
            profilePrompts={flow.profile?.self_profile_prompts ?? []}
            profileDraft={flow.profileDraft}
            setProfileDraft={flow.setProfileDraft}
            onSubmit={flow.submitTurn}
            onFinalize={flow.finalize}
            canFinalize={flow.missingSlots.length === 0}
            hasFinalPlan={Boolean(flow.finalizedPlan?.goal_plan)}
            onCreate={flow.createFromPlan}
            isCreating={flow.isCreating}
          />
        </div>

        <div className="space-y-4">
          <GoalPlanPreviewPanel
            capturedSlots={flow.capturedSlots}
            missingSlots={flow.requiredSlotsSummary}
            finalizedPlan={flow.finalizedPlan?.goal_plan ?? null}
          />
          <div className="rounded-xl border border-cool-gray bg-white p-4 text-xs dark:border-gray-700 dark:bg-gray-900">
            <p className="font-semibold text-charcoal dark:text-gray-100">Profile Merge Snapshot</p>
            <p className="mt-2 text-stone-gray dark:text-gray-400">{flow.profile?.merged_summary || "Waiting for profile input..."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
