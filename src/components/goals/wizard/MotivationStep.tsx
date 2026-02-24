"use client";

import { COMMON_MOTIVATION_SUGGESTIONS } from "@/lib/goals/motivation-suggestions";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

type MotivationStepProps = {
  form: any;
};

export default function MotivationStep({ form }: MotivationStepProps) {
  return (
    <FormField
      control={form.control}
      name="motivation"
      render={({ field }) => (
        <FormItem>
          <div className="mb-3 flex flex-wrap gap-2">
            {COMMON_MOTIVATION_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => field.onChange(suggestion)}
                className="rounded-full border border-cool-gray px-3 py-1 text-xs text-stone-gray transition hover:border-primary-blue hover:text-charcoal dark:border-gray-600 dark:text-gray-300"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <FormControl>
            <Textarea
              placeholder="e.g., Improve my health, Boost my confidence, Learn a valuable new skill"
              rows={4}
              {...field}
              className="w-full resize-none rounded-lg border border-cool-gray bg-white p-4 text-charcoal focus:border-primary-blue focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
