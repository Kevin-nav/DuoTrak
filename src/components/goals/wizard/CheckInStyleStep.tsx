"use client";

import { motion } from "framer-motion";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type CheckInStyleStepProps = {
  form: any;
  checkInStyleOptions: readonly { value: string; label: string; description: string }[];
  detectedTimezone: string;
};

export default function CheckInStyleStep({ form, checkInStyleOptions, detectedTimezone }: CheckInStyleStepProps) {
  return (
    <FormField
      control={form.control}
      name="preferredCheckInStyle"
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel className="text-sm font-medium text-charcoal dark:text-gray-100">Preferred partner check-in style</FormLabel>
          {checkInStyleOptions.map((option) => (
            <motion.label
              key={option.value}
              whileHover={{ scale: 1.01 }}
              className={`flex cursor-pointer items-start rounded-lg border p-3 transition-all ${
                field.value === option.value
                  ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                  : "border-cool-gray hover:border-primary-blue dark:border-gray-600"
              }`}
            >
              <FormControl>
                <input
                  type="radio"
                  name="preferredCheckInStyle"
                  checked={field.value === option.value}
                  onChange={() => field.onChange(option.value)}
                  className="sr-only"
                />
              </FormControl>
              <div className="mr-3 mt-0.5">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    field.value === option.value ? "border-primary-blue" : "border-cool-gray dark:border-gray-600"
                  }`}
                >
                  {field.value === option.value && <div className="h-2 w-2 rounded-full bg-primary-blue" />}
                </div>
              </div>
              <div>
                <p className="font-medium text-charcoal dark:text-gray-100">{option.label}</p>
                <p className="text-sm text-stone-gray dark:text-gray-400">{option.description}</p>
              </div>
            </motion.label>
          ))}
          <p className="text-xs text-stone-gray dark:text-gray-400">
            Time-window checks use your auto-detected timezone: <span className="font-semibold">{detectedTimezone}</span>.
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
