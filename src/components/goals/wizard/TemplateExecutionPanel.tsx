"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type TemplateExecutionPanelProps = {
  selectedTemplate: any | null;
  planningMode: "manual" | "ai";
  setPlanningMode: (mode: "manual" | "ai") => void;
  startTemplateAiImprove: () => void;
  createGoalFromTemplateNow: () => void;
  isCreatingGoal: boolean;
  getQuestionsPending: boolean;
  fields: any[];
  remove: (index: number) => void;
  append: (value: { name: string; description: string; repeat_frequency: string }) => void;
  form: any;
  availabilityOptions: string[];
  timeCommitmentOptions: string[];
  checkInStyleOptions: readonly { value: string; label: string; description: string }[];
};

export default function TemplateExecutionPanel({
  selectedTemplate,
  planningMode,
  setPlanningMode,
  startTemplateAiImprove,
  createGoalFromTemplateNow,
  isCreatingGoal,
  getQuestionsPending,
  fields,
  remove,
  append,
  form,
  availabilityOptions,
  timeCommitmentOptions,
  checkInStyleOptions,
}: TemplateExecutionPanelProps) {
  if (!selectedTemplate) return null;
  const manualSelected = planningMode === "manual";
  const aiSelected = planningMode === "ai";

  return (
    <>
      <div className="rounded-lg border border-primary-blue/30 bg-accent-light-blue p-3 dark:bg-primary-blue/10">
        <p className="text-sm font-semibold text-charcoal dark:text-gray-100">Selected template: {selectedTemplate.title}</p>
        <p className="mt-1 text-xs text-stone-gray dark:text-gray-300">
          Choose what to do with this template now.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={createGoalFromTemplateNow}
            disabled={isCreatingGoal}
            className="rounded-lg bg-primary-blue px-3 py-2 text-sm font-medium text-white hover:bg-primary-blue-hover disabled:opacity-60"
          >
            {isCreatingGoal ? "Creating..." : "Use Template Now"}
          </button>
          <button
            type="button"
            onClick={() => setPlanningMode("manual")}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              manualSelected
                ? "border-charcoal bg-charcoal text-white ring-2 ring-charcoal/30"
                : "border-cool-gray text-charcoal dark:border-gray-600 dark:text-gray-100"
            }`}
            aria-pressed={manualSelected}
          >
            Edit Manually
          </button>
          <button
            type="button"
            onClick={() => {
              setPlanningMode("ai");
              startTemplateAiImprove();
            }}
            disabled={getQuestionsPending}
            data-testid="template-improve-ai-button"
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              aiSelected
                ? "border-charcoal bg-charcoal text-white ring-2 ring-charcoal/30"
                : "border-cool-gray text-charcoal dark:border-gray-600 dark:text-gray-100"
            } disabled:opacity-60`}
            aria-pressed={aiSelected}
          >
            {getQuestionsPending ? "Starting AI..." : "Improve with AI"}
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-gray dark:text-gray-300">
          Current mode: <span className="font-semibold">{planningMode === "manual" ? "Manual" : "AI-assisted"}</span>. Use
          the main <span className="font-semibold">Next</span> button below to continue.
        </p>
      </div>

      <AnimatePresence initial={false}>
      {aiSelected && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-3 rounded-lg border border-primary-blue/30 p-3 dark:border-primary-blue/40"
        >
          <p className="text-sm font-semibold text-charcoal dark:text-gray-100">Quick AI Tune (focused inputs)</p>
          <p className="text-xs text-stone-gray dark:text-gray-300">
            Tell AI your constraints, then continue. You will skip the generic middle steps.
          </p>

          <FormField
            control={form.control}
            name="motivation"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Biggest blocker or context to account for" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="availability"
            render={({ field }) => (
              <FormItem>
                <div className="flex flex-wrap gap-2">
                  {availabilityOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        const current = Array.isArray(field.value) ? field.value : [];
                        const exists = current.includes(option);
                        field.onChange(exists ? current.filter((value: string) => value !== option) : [...current, option]);
                      }}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                        field.value?.includes(option)
                          ? "border-primary-blue bg-accent-light-blue text-charcoal dark:bg-primary-blue/10 dark:text-gray-100"
                          : "border-cool-gray text-stone-gray dark:border-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </FormItem>
            )}
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="timeCommitment"
              render={({ field }) => (
                <FormItem>
                  <select
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    className="w-full rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm text-charcoal dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    aria-label="Time commitment"
                  >
                    <option value="">Time commitment</option>
                    {timeCommitmentOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredCheckInStyle"
              render={({ field }) => (
                <FormItem>
                  <select
                    value={field.value}
                    onChange={(event) => field.onChange(event.target.value)}
                    className="w-full rounded-lg border border-cool-gray bg-white px-3 py-2 text-sm text-charcoal dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    aria-label="Check-in style"
                  >
                    {checkInStyleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormItem>
              )}
            />
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {manualSelected && (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-3 rounded-lg border border-cool-gray p-3"
      >
        <p className="text-sm font-semibold text-charcoal dark:text-gray-100">Template tasks (editable)</p>
        {fields.map((taskField, index) => (
          <div key={taskField.id} className="grid gap-2 rounded-md border border-cool-gray p-2 sm:grid-cols-[1fr,1fr,auto]">
            <FormField
              control={form.control}
              name={`tasks.${index}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Task name" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`tasks.${index}.repeat_frequency`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input {...field} placeholder="Cadence (daily, weekly...)" />
                  </FormControl>
                </FormItem>
              )}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="rounded border border-cool-gray px-3 py-2 text-sm text-stone-gray"
            >
              Remove
            </button>
            <FormField
              control={form.control}
              name={`tasks.${index}.description`}
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <FormControl>
                    <Input {...field} placeholder="Task description (optional)" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ name: "", description: "", repeat_frequency: "daily" })}
          className="rounded-lg border border-cool-gray px-3 py-2 text-sm text-charcoal dark:text-gray-100"
        >
          + Add task
        </button>
      </motion.div>
      )}
    </>
  );
}
