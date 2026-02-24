"use client";

import { motion } from "framer-motion";
import { Camera, Clock } from "lucide-react";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type AccountabilityStepProps = {
  form: any;
};

export default function AccountabilityStep({ form }: AccountabilityStepProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="accountabilityType"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <motion.label
              whileHover={{ scale: 1.01 }}
              className={`flex cursor-pointer items-start rounded-lg border p-4 transition-all ${
                field.value === "visual_proof"
                  ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                  : "border-cool-gray hover:border-primary-blue dark:border-gray-600"
              }`}
            >
              <FormControl>
                <input
                  type="radio"
                  name="accountability"
                  checked={field.value === "visual_proof"}
                  onChange={() => field.onChange("visual_proof")}
                  className="sr-only"
                />
              </FormControl>
              <div
                className={`mr-3 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  field.value === "visual_proof" ? "border-primary-blue" : "border-cool-gray dark:border-gray-600"
                }`}
              >
                {field.value === "visual_proof" && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-2 w-2 rounded-full bg-primary-blue" />
                )}
              </div>
              <div>
                <div className="mb-1 flex items-center space-x-2">
                  <Camera className="h-5 w-5 text-primary-blue" />
                  <span className="font-semibold text-charcoal dark:text-gray-100">Visual Proof (Recommended)</span>
                </div>
                <p className="text-sm text-stone-gray dark:text-gray-400">Upload a picture to confirm task completion</p>
              </div>
            </motion.label>

            <motion.label
              whileHover={{ scale: 1.01 }}
              className={`flex cursor-pointer items-start rounded-lg border p-4 transition-all ${
                field.value === "time_bound_action"
                  ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                  : "border-cool-gray hover:border-primary-blue dark:border-gray-600"
              }`}
            >
              <FormControl>
                <input
                  type="radio"
                  name="accountability"
                  checked={field.value === "time_bound_action"}
                  onChange={() => field.onChange("time_bound_action")}
                  className="sr-only"
                />
              </FormControl>
              <div
                className={`mr-3 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  field.value === "time_bound_action" ? "border-primary-blue" : "border-cool-gray dark:border-gray-600"
                }`}
              >
                {field.value === "time_bound_action" && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-2 w-2 rounded-full bg-primary-blue" />
                )}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary-blue" />
                  <span className="font-semibold text-charcoal dark:text-gray-100">Time-Bound Action</span>
                </div>
                <p className="mb-3 text-sm text-stone-gray dark:text-gray-400">
                  Mark completed within a specific time window
                </p>
                {field.value === "time_bound_action" && (
                  <FormField
                    control={form.control}
                    name="timeWindow"
                    render={({ field: timeWindowField }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="e.g., 7:00 AM +/- 10 mins"
                            {...timeWindowField}
                            className="w-full rounded border border-cool-gray bg-white p-2 text-sm text-charcoal focus:border-primary-blue focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </motion.label>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

