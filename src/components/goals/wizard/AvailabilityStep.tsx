"use client";

import { motion } from "framer-motion";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";

type AvailabilityStepProps = {
  form: any;
  availabilityOptions: string[];
};

export default function AvailabilityStep({ form, availabilityOptions }: AvailabilityStepProps) {
  const detailByOption: Record<string, string> = {
    "Weekday mornings (6-9 AM)": "Best for momentum habits before work",
    "Weekday lunch break (12-2 PM)": "Good for short focused sessions",
    "Weekday evenings (6-9 PM)": "Good for deeper work after the day",
    "Weekends (8 AM-6 PM)": "Best for longer uninterrupted sessions",
    "Late night (9 PM-12 AM)": "Good for quiet solo work",
    "Flexible windows": "AI can suggest multiple fallback slots",
  };

  return (
    <FormField
      control={form.control}
      name="availability"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <div className="rounded-lg border border-cool-gray bg-pearl-gray/60 p-3 text-xs text-stone-gray dark:border-gray-600 dark:bg-gray-700/40 dark:text-gray-300">
            Select every window you can realistically use. AI will propose exact check-in times from these.
          </div>
          {availabilityOptions.map((option) => (
            <motion.label
              key={option}
              whileHover={{ scale: 1.01 }}
              className={`flex cursor-pointer items-start rounded-lg border p-3 transition-all ${
                field.value?.includes(option)
                  ? "border-primary-blue bg-accent-light-blue shadow-sm dark:bg-primary-blue/10"
                  : "border-cool-gray hover:border-primary-blue dark:border-gray-600"
              }`}
            >
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value?.includes(option)}
                  onChange={(event) => {
                    const newValue = event.target.checked
                      ? [...(field.value || []), option]
                      : (field.value || []).filter((value: string) => value !== option);
                    field.onChange(newValue);
                  }}
                  className="sr-only"
                />
              </FormControl>
              <div
                className={`mr-3 flex h-5 w-5 items-center justify-center rounded border-2 ${
                  field.value?.includes(option)
                    ? "border-primary-blue bg-primary-blue"
                    : "border-cool-gray dark:border-gray-600"
                }`}
              >
                {field.value?.includes(option) && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-2 w-2 rounded-sm bg-white" />
                )}
              </div>
              <div>
                <p className="font-medium text-charcoal dark:text-gray-100">{option}</p>
                <p className="text-xs text-stone-gray dark:text-gray-400">{detailByOption[option] || ""}</p>
              </div>
            </motion.label>
          ))}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
