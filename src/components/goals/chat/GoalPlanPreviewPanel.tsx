"use client";

export default function GoalPlanPreviewPanel({
  capturedSlots,
  missingSlots,
  finalizedPlan,
}: {
  capturedSlots: Record<string, any>;
  missingSlots: string[];
  finalizedPlan: Record<string, any> | null;
}) {
  return (
    <aside className="rounded-xl border border-cool-gray bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="text-base font-bold text-charcoal dark:text-gray-100">Live Goal Draft</h3>
      <p className="mt-1 text-xs text-stone-gray dark:text-gray-400">
        Missing: {missingSlots.length === 0 ? "None" : missingSlots.join(", ")}
      </p>

      <div className="mt-4 space-y-2 text-sm">
        <div>
          <span className="text-stone-gray dark:text-gray-400">Type:</span>{" "}
          <span className="font-medium text-charcoal dark:text-gray-100">{capturedSlots.intent || "-"}</span>
        </div>
        <div>
          <span className="text-stone-gray dark:text-gray-400">Success:</span>{" "}
          <span className="font-medium text-charcoal dark:text-gray-100">{capturedSlots.success_definition || "-"}</span>
        </div>
        <div>
          <span className="text-stone-gray dark:text-gray-400">Availability:</span>{" "}
          <span className="font-medium text-charcoal dark:text-gray-100">{capturedSlots.availability || "-"}</span>
        </div>
        <div>
          <span className="text-stone-gray dark:text-gray-400">Time Budget:</span>{" "}
          <span className="font-medium text-charcoal dark:text-gray-100">{capturedSlots.time_budget || "-"}</span>
        </div>
      </div>

      {finalizedPlan ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">Finalized</p>
          <p className="mt-1 text-emerald-700 dark:text-emerald-300">Review is complete. You can create this goal now.</p>
        </div>
      ) : null}
    </aside>
  );
}
