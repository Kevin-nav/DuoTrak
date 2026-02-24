"use client";

import { Button } from "@/components/ui/button";

export default function GoalSummaryCard({
  summary,
  onChangeField,
  onChangeTask,
  onBack,
  onApprove,
  isCreating,
}: {
  summary: Record<string, any>;
  onChangeField: (key: string, value: any) => void;
  onChangeTask: (index: number, patch: Record<string, any>) => void;
  onBack: () => void;
  onApprove: () => void;
  isCreating: boolean;
}) {
  const tasks = Array.isArray(summary.tasks) ? summary.tasks : [];
  return (
    <div className="rounded-2xl border border-cool-gray bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <h2 className="text-xl font-bold text-charcoal dark:text-gray-100">Review Goal Summary</h2>
      <p className="mt-1 text-sm text-stone-gray dark:text-gray-400">Edit anything before approving creation.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-stone-gray dark:text-gray-400">Goal Type</span>
          <select
            value={summary.intent || "habit"}
            onChange={(event) => onChangeField("intent", event.target.value)}
            className="w-full rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="habit">habit</option>
            <option value="milestone">milestone</option>
            <option value="target-date">target-date</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-stone-gray dark:text-gray-400">Success Definition</span>
          <input
            value={summary.success_definition || ""}
            onChange={(event) => onChangeField("success_definition", event.target.value)}
            className="w-full rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-stone-gray dark:text-gray-400">Availability</span>
          <input
            value={summary.availability || ""}
            onChange={(event) => onChangeField("availability", event.target.value)}
            className="w-full rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-stone-gray dark:text-gray-400">Time Budget</span>
          <input
            value={summary.time_budget || ""}
            onChange={(event) => onChangeField("time_budget", event.target.value)}
            className="w-full rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-stone-gray dark:text-gray-400">Accountability</span>
          <input
            value={summary.accountability_mode || ""}
            onChange={(event) => onChangeField("accountability_mode", event.target.value)}
            className="w-full rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </label>
        {summary.intent === "target-date" ? (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-stone-gray dark:text-gray-400">Deadline</span>
            <input
              value={summary.deadline || ""}
              onChange={(event) => onChangeField("deadline", event.target.value)}
              className="w-full rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
        ) : (
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-stone-gray dark:text-gray-400">Review Cycle</span>
            <input
              value={summary.review_cycle || ""}
              onChange={(event) => onChangeField("review_cycle", event.target.value)}
              className="w-full rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </label>
        )}
      </div>

      <div className="mt-5 space-y-3">
        <p className="text-sm font-semibold text-charcoal dark:text-gray-100">Tasks</p>
        {tasks.map((task, index) => (
          <div key={index} className="rounded-lg border border-cool-gray p-3 dark:border-gray-700">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={task.name || ""}
                placeholder="Task name"
                onChange={(event) => onChangeTask(index, { name: event.target.value })}
                className="rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <input
                value={task.description || ""}
                placeholder="Description"
                onChange={(event) => onChangeTask(index, { description: event.target.value })}
                className="rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <input
                value={task.review_sla || ""}
                placeholder="Review SLA"
                onChange={(event) => onChangeTask(index, { review_sla: event.target.value, requires_partner_review: true })}
                className="rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <input
                value={task.escalation_policy || ""}
                placeholder="Escalation policy"
                onChange={(event) => onChangeTask(index, { escalation_policy: event.target.value, requires_partner_review: true })}
                className="rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back to Chat
        </Button>
        <Button type="button" onClick={onApprove} disabled={isCreating}>
          {isCreating ? "Creating..." : "Approve & Create Goal"}
        </Button>
      </div>
    </div>
  );
}
