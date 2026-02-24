"use client";

import { motion } from "framer-motion";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type TimeInvestmentStepProps = {
  form: any;
  timeCommitmentOptions: string[];
};

export default function TimeInvestmentStep({
  form,
  timeCommitmentOptions,
}: TimeInvestmentStepProps) {
  const selectedAvailability = form.watch("availability") as string[] | undefined;
  const selectedTimeCommitment = form.watch("timeCommitment");
  const showCustomScheduleInput = selectedTimeCommitment === "Custom schedule";

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-cool-gray bg-pearl-gray/70 p-3 dark:border-gray-600 dark:bg-gray-700/40">
        <p className="text-sm font-semibold text-charcoal dark:text-gray-100">Give AI your realistic capacity</p>
        <p className="mt-1 text-xs text-stone-gray dark:text-gray-300">
          We will use your windows and duration to suggest exact times that fit your week.
        </p>
        {!!selectedAvailability?.length && (
          <p className="mt-2 text-xs text-stone-gray dark:text-gray-300">
            Available windows: <span className="font-medium">{selectedAvailability.join(" · ")}</span>
          </p>
        )}
      </div>

      <FormField
        control={form.control}
        name="timeCommitment"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <p className="text-sm font-medium text-charcoal dark:text-gray-100">How much can you commit?</p>
            <div className="grid gap-2">
              {timeCommitmentOptions.map((option) => (
                <motion.label
                  key={option}
                  whileHover={{ scale: 1.01 }}
                  className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                    field.value === option
                      ? "border-primary-blue bg-accent-light-blue shadow-sm dark:bg-primary-blue/10"
                      : "border-cool-gray hover:border-primary-blue dark:border-gray-600"
                  }`}
                >
                  <FormControl>
                    <input
                      type="radio"
                      name="timeCommitment"
                      checked={field.value === option}
                      onChange={() => field.onChange(option)}
                      className="sr-only"
                    />
                  </FormControl>
                  <div
                    className={`mr-3 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      field.value === option ? "border-primary-blue" : "border-cool-gray dark:border-gray-600"
                    }`}
                  >
                    {field.value === option && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-2 w-2 rounded-full bg-primary-blue" />
                    )}
                  </div>
                  <span className="text-charcoal dark:text-gray-100">{option}</span>
                </motion.label>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {showCustomScheduleInput && (
        <FormField
          control={form.control}
          name="customTime"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Custom: e.g., 35 mins on Mon/Wed/Fri evenings"
                  {...field}
                  className="w-full rounded-lg border border-cool-gray bg-white p-3 text-charcoal focus:border-primary-blue focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
