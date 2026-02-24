"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type TemplatePickerStepProps = {
  form: any;
  filteredSuggestions: any[];
  templatesLoading: boolean;
  selectedTemplate: any | null;
  applySuggestedGoal: (template: any) => void;
  clearSelectedTemplate: () => void;
  loadStarterTemplates: () => void;
  continueStepOneManual: () => void;
  continueStepOneAi: () => void;
  continuePending: boolean;
};

export default function TemplatePickerStep({
  form,
  filteredSuggestions,
  templatesLoading,
  selectedTemplate,
  applySuggestedGoal,
  clearSelectedTemplate,
  loadStarterTemplates,
  continueStepOneManual,
  continueStepOneAi,
  continuePending,
}: TemplatePickerStepProps) {
  const [path, setPath] = useState<"template" | "scratch" | null>(selectedTemplate ? "template" : null);
  const [screen, setScreen] = useState<"start" | "pickTemplate" | "name">(selectedTemplate ? "name" : "start");
  const topTemplates = useMemo(() => filteredSuggestions.slice(0, 6), [filteredSuggestions]);

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait" initial={false}>
        {screen === "start" && (
          <motion.div
            key="screen-start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-cool-gray p-4 dark:border-gray-600"
          >
            <p className="text-sm font-semibold text-charcoal dark:text-gray-100">A. How do you want to start?</p>
            <p className="mt-1 text-xs text-stone-gray dark:text-gray-400">Pick one path to continue.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                data-testid="start-with-template"
                onClick={() => {
                  setPath("template");
                  setScreen("pickTemplate");
                }}
                className="rounded-lg border border-cool-gray px-3 py-3 text-left text-sm text-charcoal dark:border-gray-600 dark:text-gray-100"
              >
                <p className="font-semibold">Use a Template</p>
                <p className="mt-1 text-xs opacity-80">Pick one starter, then continue.</p>
              </button>
              <button
                type="button"
                data-testid="start-from-scratch"
                onClick={() => {
                  setPath("scratch");
                  clearSelectedTemplate();
                  setScreen("name");
                }}
                className="rounded-lg border border-cool-gray px-3 py-3 text-left text-sm text-charcoal dark:border-gray-600 dark:text-gray-100"
              >
                <p className="font-semibold">Start from Scratch</p>
                <p className="mt-1 text-xs opacity-80">Create your goal from zero.</p>
              </button>
            </div>
          </motion.div>
        )}

        {screen === "pickTemplate" && (
          <motion.div
            key="screen-template"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-cool-gray p-4 dark:border-gray-600"
          >
            <p className="text-sm font-semibold text-charcoal dark:text-gray-100">B. Pick one template</p>
            <p className="mt-1 text-xs text-stone-gray dark:text-gray-400">Tap one template to continue.</p>

            <div className="mt-3 grid gap-3">
              {topTemplates.map((template: any) => (
                <button
                  key={String(template._id)}
                  type="button"
                  onClick={() => {
                    applySuggestedGoal(template);
                    setScreen("name");
                  }}
                  data-testid="goal-suggestion-card"
                  className="rounded-lg border border-cool-gray p-3 text-left transition hover:border-primary-blue hover:bg-accent-light-blue dark:border-gray-600 dark:hover:bg-primary-blue/10"
                >
                  <p className="font-semibold text-charcoal dark:text-gray-100">{template.title}</p>
                  <p className="mt-1 text-sm text-stone-gray dark:text-gray-400">{template.description}</p>
                </button>
              ))}

              {!templatesLoading && topTemplates.length === 0 && (
                <div className="rounded-lg border border-dashed border-cool-gray p-4">
                  <p className="text-sm text-stone-gray dark:text-gray-300">No published templates yet.</p>
                  <button
                    type="button"
                    onClick={loadStarterTemplates}
                    className="mt-2 rounded-lg border border-cool-gray px-3 py-2 text-sm text-charcoal dark:border-gray-600 dark:text-gray-100"
                  >
                    Load starter templates
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setPath(null);
                setScreen("start");
                clearSelectedTemplate();
              }}
              className="mt-3 rounded-lg border border-cool-gray px-3 py-2 text-xs text-charcoal dark:border-gray-600 dark:text-gray-100"
            >
              Back
            </button>
          </motion.div>
        )}

        {screen === "name" && (
          <motion.div
            key="screen-name"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-cool-gray p-4 dark:border-gray-600"
          >
            <p className="text-sm font-semibold text-charcoal dark:text-gray-100">C. Name your goal</p>
            <p className="mt-1 text-xs text-stone-gray dark:text-gray-400">Give it a clear, specific name.</p>

            {path === "template" && selectedTemplate && (
              <p className="mt-3 rounded-lg bg-accent-light-blue px-3 py-2 text-xs text-charcoal dark:bg-primary-blue/10 dark:text-gray-100">
                Template: <span className="font-semibold">{selectedTemplate.title}</span>
              </p>
            )}

            <FormField
              control={form.control}
              name="goalName"
              render={({ field }) => (
                <FormItem className="mt-3">
                  <FormControl>
                    <Input
                      placeholder="e.g., Run a 5K, Meditate daily for 15 mins, Learn Python"
                      {...field}
                      className="w-full rounded-lg border border-cool-gray bg-white p-4 text-charcoal focus:border-primary-blue focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={continueStepOneManual}
                disabled={continuePending}
                className="rounded-lg bg-primary-blue px-4 py-2 text-sm font-medium text-white hover:bg-primary-blue-hover disabled:opacity-60"
              >
                {continuePending ? "Continuing..." : "Continue"}
              </button>
              {path === "template" && (
                <button
                  type="button"
                  onClick={continueStepOneAi}
                  disabled={continuePending}
                  className="rounded-lg border border-cool-gray px-4 py-2 text-sm text-charcoal dark:border-gray-600 dark:text-gray-100 disabled:opacity-60"
                >
                  Continue with AI
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
