"use client";

import { motion } from "framer-motion";
import { Target, Clock, Users, CalendarDays, ListChecks, Repeat, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const cardInitial = { opacity: 0, x: 20 };
const cardAnimate = {
  opacity: 1,
  x: 0,
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

function FieldLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
      <Icon className="h-3.5 w-3.5 text-taupe" />
      {label}
    </span>
  );
}

const inputClasses =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-taupe/40";

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
    <motion.div
      className="rounded-2xl border border-border bg-card p-5"
      initial={cardInitial}
      animate={cardAnimate}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sand">
          <ListChecks className="h-4.5 w-4.5 text-espresso" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Review Goal Summary</h2>
          <p className="text-xs text-muted-foreground">Edit anything before approving creation.</p>
        </div>
      </div>

      {/* ── Fields Grid ── */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <FieldLabel icon={Target} label="Goal Type" />
          <select
            value={summary.intent || "habit"}
            onChange={(e) => onChangeField("intent", e.target.value)}
            className={inputClasses}
          >
            <option value="habit">Habit</option>
            <option value="milestone">Milestone</option>
            <option value="target-date">Target Date</option>
          </select>
        </label>

        <label className="block">
          <FieldLabel icon={Target} label="Success Definition" />
          <input
            value={summary.success_definition || ""}
            onChange={(e) => onChangeField("success_definition", e.target.value)}
            className={inputClasses}
            placeholder="What does success look like?"
          />
        </label>

        <label className="block">
          <FieldLabel icon={Clock} label="Availability" />
          <input
            value={summary.availability || ""}
            onChange={(e) => onChangeField("availability", e.target.value)}
            className={inputClasses}
            placeholder="e.g. mornings, weekends"
          />
        </label>

        <label className="block">
          <FieldLabel icon={Clock} label="Time Budget" />
          <input
            value={summary.time_budget || ""}
            onChange={(e) => onChangeField("time_budget", e.target.value)}
            className={inputClasses}
            placeholder="e.g. 30 min/day"
          />
        </label>

        <label className="block">
          <FieldLabel icon={Users} label="Accountability" />
          <input
            value={summary.accountability_mode || ""}
            onChange={(e) => onChangeField("accountability_mode", e.target.value)}
            className={inputClasses}
            placeholder="e.g. partner-review"
          />
        </label>

        {summary.intent === "target-date" ? (
          <label className="block">
            <FieldLabel icon={CalendarDays} label="Deadline" />
            <input
              value={summary.deadline || ""}
              onChange={(e) => onChangeField("deadline", e.target.value)}
              className={inputClasses}
              placeholder="YYYY-MM-DD"
            />
          </label>
        ) : (
          <label className="block">
            <FieldLabel icon={Repeat} label="Review Cycle" />
            <input
              value={summary.review_cycle || ""}
              onChange={(e) => onChangeField("review_cycle", e.target.value)}
              className={inputClasses}
              placeholder="e.g. weekly"
            />
          </label>
        )}
      </div>

      {/* ── Tasks ── */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-1.5">
          <ListChecks className="h-4 w-4 text-taupe" />
          <p className="text-sm font-semibold text-foreground">Tasks</p>
        </div>

        <div className="space-y-2.5">
          {tasks.map((task: Record<string, any>, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="rounded-xl border border-border bg-background p-3 transition-shadow hover:shadow-sm"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  value={task.name || ""}
                  placeholder="Task name"
                  onChange={(e) => onChangeTask(index, { name: e.target.value })}
                  className={inputClasses}
                />
                <input
                  value={task.description || ""}
                  placeholder="Description"
                  onChange={(e) => onChangeTask(index, { description: e.target.value })}
                  className={inputClasses}
                />
                <div className="relative">
                  <Shield className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={task.review_sla || ""}
                    placeholder="Review SLA"
                    onChange={(e) =>
                      onChangeTask(index, { review_sla: e.target.value, requires_partner_review: true })
                    }
                    className={`${inputClasses} pl-8`}
                  />
                </div>
                <input
                  value={task.escalation_policy || ""}
                  placeholder="Escalation policy"
                  onChange={(e) =>
                    onChangeTask(index, { escalation_policy: e.target.value, requires_partner_review: true })
                  }
                  className={inputClasses}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="mt-6 flex gap-2">
        <Button type="button" variant="outline" onClick={onBack}>
          Back to Chat
        </Button>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button type="button" onClick={onApprove} disabled={isCreating}>
            {isCreating ? "Creating..." : "Approve & Create Goal"}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
