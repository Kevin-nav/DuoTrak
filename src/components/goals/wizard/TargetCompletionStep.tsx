"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type TargetCompletionStepProps = {
  form: any;
};

export default function TargetCompletionStep({ form }: TargetCompletionStepProps) {
  const goalType = form.watch("goalType");

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-cool-gray bg-pearl-gray/70 p-3 text-xs text-stone-gray dark:border-gray-600 dark:bg-gray-700/40 dark:text-gray-300">
        {goalType === "target-date"
          ? "This date is required for target-date goals."
          : "Set an optional finish date so AI can pace your plan."}
      </div>

      <FormField
        control={form.control}
        name="targetDeadline"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-charcoal dark:text-gray-100">
              Target completion date {goalType === "target-date" ? "(required)" : "(optional)"}
            </FormLabel>
            <FormControl>
              <Input
                type="date"
                {...field}
                className="w-full rounded-lg border border-cool-gray bg-white p-3 text-charcoal focus:border-primary-blue focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
