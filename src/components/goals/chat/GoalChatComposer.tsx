"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type GoalChatTask = {
  name: string;
  description?: string;
  requires_partner_review?: boolean;
  review_sla?: string;
  escalation_policy?: string;
};

type GoalChatSlotUpdates = {
  intent?: "target-date" | "habit" | "milestone";
  success_definition?: string;
  availability?: string;
  time_budget?: string;
  accountability_mode?: string;
  deadline?: string;
  review_cycle?: string;
};

export default function GoalChatComposer({
  activeSlot,
  slotDraft,
  setDraftValue,
  tasksDraft,
  addTask,
  updateTask,
  profilePrompts,
  profileDraft,
  setProfileDraft,
  onSubmit,
  onFinalize,
  onCreate,
  canFinalize,
  hasFinalPlan,
  isCreating,
}: {
  activeSlot?: string;
  slotDraft: GoalChatSlotUpdates;
  setDraftValue: (slot: keyof GoalChatSlotUpdates, value: any) => void;
  tasksDraft: GoalChatTask[];
  addTask: () => void;
  updateTask: (index: number, patch: Partial<GoalChatTask>) => void;
  profilePrompts: Array<{ prompt_id: string; question: string }>;
  profileDraft: Record<string, string>;
  setProfileDraft: (draft: Record<string, string>) => void;
  onSubmit: () => void;
  onFinalize: () => void;
  onCreate: () => void;
  canFinalize: boolean;
  hasFinalPlan: boolean;
  isCreating: boolean;
}) {
  const textField = (name: keyof GoalChatSlotUpdates, label: string, placeholder?: string) => (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-stone-gray dark:text-gray-400">{label}</span>
      <input
        value={(slotDraft[name] as string) || ""}
        onChange={(event) => setDraftValue(name, event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      />
    </label>
  );

  return (
    <div className="space-y-4 rounded-xl border border-cool-gray bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div>
        <p className="text-sm font-semibold text-charcoal dark:text-gray-100">Current Question</p>
        <p className="text-xs text-stone-gray dark:text-gray-400">{activeSlot || "Goal setup"}</p>
      </div>

      {activeSlot === "intent" ? (
        <div className="grid grid-cols-3 gap-2">
          {(["habit", "milestone", "target-date"] as const).map((intent) => (
            <Button
              key={intent}
              type="button"
              variant={slotDraft.intent === intent ? "default" : "outline"}
              onClick={() => setDraftValue("intent", intent)}
              className="capitalize"
            >
              {intent.replace("-", " ")}
            </Button>
          ))}
        </div>
      ) : null}

      {activeSlot === "success_definition"
        ? textField("success_definition", "Success Definition", "What does success look like?")
        : null}
      {activeSlot === "availability" ? textField("availability", "Availability", "Weekdays 6-8 AM") : null}
      {activeSlot === "time_budget" ? textField("time_budget", "Time Budget", "45 minutes/day") : null}
      {activeSlot === "accountability_mode"
        ? textField("accountability_mode", "Accountability Mode", "Partner review + daily check-in")
        : null}
      {activeSlot === "deadline" ? textField("deadline", "Deadline", "2026-06-30") : null}
      {activeSlot === "review_cycle" ? textField("review_cycle", "Review Cycle", "Weekly") : null}

      {activeSlot === "tasks" ? (
        <div className="space-y-3">
          {tasksDraft.map((task, index) => (
            <div key={index} className="rounded-lg border border-cool-gray p-3 dark:border-gray-700">
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  placeholder="Task name"
                  value={task.name}
                  onChange={(event) => updateTask(index, { name: event.target.value })}
                  className="rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <input
                  placeholder="Description"
                  value={task.description || ""}
                  onChange={(event) => updateTask(index, { description: event.target.value })}
                  className="rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <input
                  placeholder="Review SLA (e.g., 24h)"
                  value={task.review_sla || ""}
                  onChange={(event) => updateTask(index, { review_sla: event.target.value })}
                  className="rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <input
                  placeholder="Escalation policy"
                  value={task.escalation_policy || ""}
                  onChange={(event) => updateTask(index, { escalation_policy: event.target.value })}
                  className="rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addTask}>
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-stone-gray dark:text-gray-400">Quick Personality Inputs</p>
        {profilePrompts.map((prompt) => (
          <label key={prompt.prompt_id} className="block">
            <span className="mb-1 block text-xs text-stone-gray dark:text-gray-400">{prompt.question}</span>
            <input
              value={profileDraft[prompt.prompt_id] || ""}
              onChange={(event) =>
                setProfileDraft({
                  ...profileDraft,
                  [prompt.prompt_id]: event.target.value,
                })
              }
              className="w-full rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onSubmit}>
          Save Answer
        </Button>
        <Button type="button" variant="outline" onClick={onFinalize} disabled={!canFinalize}>
          Finalize Plan
        </Button>
        <Button type="button" variant="secondary" onClick={onCreate} disabled={!hasFinalPlan || isCreating}>
          {isCreating ? "Creating..." : "Create Goal"}
        </Button>
      </div>
    </div>
  );
}
