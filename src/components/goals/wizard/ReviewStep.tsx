"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type ReviewStepProps = {
  finalGoalPlan: any | null;
  getPlanPending: boolean;
  planGenerationStage: number;
  recommendationReasons: string[];
  showRecommendationReasons: boolean;
  setShowRecommendationReasons: (value: boolean) => void;
};

const LOADING_MESSAGES = [
  "Analyzing your consistency windows...",
  "Designing partner accountability rhythm...",
  "Drafting picture-proof guidance for each task...",
];

const formatVerificationMode = (mode?: string) => {
  if (!mode) return "Photo";
  if (mode === "time-window") return "Time Window";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
};

export default function ReviewStep({
  finalGoalPlan,
  getPlanPending,
  planGenerationStage,
  recommendationReasons,
  showRecommendationReasons,
  setShowRecommendationReasons,
}: ReviewStepProps) {
  return (
    <AnimatePresence mode="wait">
      {getPlanPending || !finalGoalPlan ? (
        <motion.div key="loading" className="text-center">
          <Sparkles className="mx-auto h-16 w-16 animate-spin text-primary-blue" />
          <h3 className="mb-2 text-lg font-semibold text-charcoal dark:text-gray-100">
            Generating your hyper-personalized plan...
          </h3>
          <p className="text-stone-gray dark:text-gray-400">{LOADING_MESSAGES[planGenerationStage]}</p>
        </motion.div>
      ) : (
        <motion.div key="plan" className="space-y-6">
          <h3 className="text-xl font-bold text-charcoal dark:text-gray-100">{finalGoalPlan.title}</h3>
          <p className="text-stone-gray dark:text-gray-300">{finalGoalPlan.description}</p>

          {finalGoalPlan.schedule_impact && (
            <div className="rounded-lg border border-cool-gray bg-white p-3 text-sm dark:border-gray-600 dark:bg-gray-800">
              <p className="font-semibold text-charcoal dark:text-gray-100">Schedule impact</p>
              <p className="text-stone-gray dark:text-gray-300">
                Weekly load: {finalGoalPlan.schedule_impact.projected_load_minutes} /{" "}
                {finalGoalPlan.schedule_impact.capacity_minutes} mins
              </p>
              <p className="text-stone-gray dark:text-gray-300">
                Fit: {finalGoalPlan.schedule_impact.fit_band}
                {typeof finalGoalPlan.schedule_impact.overload_percent === "number" &&
                  ` · Overload ${finalGoalPlan.schedule_impact.overload_percent}%`}
              </p>
            </div>
          )}

          {recommendationReasons.length > 0 && (
            <div className="rounded-lg border border-primary-blue/30 bg-accent-light-blue p-3 dark:bg-primary-blue/10">
              <button
                type="button"
                onClick={() => setShowRecommendationReasons(!showRecommendationReasons)}
                className="w-full text-left text-sm font-semibold text-primary-blue"
              >
                Why this recommendation {showRecommendationReasons ? "▲" : "▼"}
              </button>
              {showRecommendationReasons && (
                <ul className="mt-2 space-y-1 text-sm text-stone-gray dark:text-gray-300">
                  {recommendationReasons.map((reason, reasonIndex) => (
                    <li key={`reason-${reasonIndex}`}>- {reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="space-y-4">
            {(finalGoalPlan.milestones || []).map((milestone: any, index: number) => (
              <div key={index} className="rounded-lg border bg-pearl-gray p-4 dark:bg-gray-700/50">
                <h4 className="font-semibold text-charcoal dark:text-gray-100">{milestone.title}</h4>
                <p className="mb-2 text-sm text-stone-gray dark:text-gray-400">{milestone.description}</p>
                <ul className="space-y-3">
                  {(milestone.tasks || []).map((task: any, taskIndex: number) => (
                    <li
                      key={taskIndex}
                      className="rounded-md border border-cool-gray bg-white p-3 text-sm text-charcoal dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <p>
                        <strong>{task.description}</strong>
                      </p>
                      <p className="mt-1 text-stone-gray dark:text-gray-400">{task.success_metric ?? task.successMetric}</p>
                      <p className="mt-2">
                        <strong>Cadence:</strong> {task.recommended_cadence ?? task.recommendedCadence}
                      </p>
                      <p>
                        <strong>Best windows:</strong>{" "}
                        {(task.recommended_time_windows ?? task.recommendedTimeWindows)?.join(", ") ||
                          "Flexible based on your schedule"}
                      </p>
                      <p>
                        <strong>Why this works:</strong> {task.consistency_rationale ?? task.consistencyRationale}
                      </p>
                      <p>
                        <strong>Verification mode:</strong> {formatVerificationMode(task.verification_mode ?? task.verificationMode)}
                        {typeof task.verification_confidence === "number"
                          ? ` (${Math.round(task.verification_confidence * 100)}% confidence)`
                          : ""}
                      </p>
                      <p>
                        <strong>Why this mode:</strong>{" "}
                        {(task.verification_mode_reason ?? task.verificationModeReason) ||
                          "Selected for reliable partner review."}
                      </p>
                      {(task.verification_mode ?? task.verificationMode) === "time-window" && (
                        <p>
                          <strong>Time-window rule:</strong> Complete between{" "}
                          {(task.time_window_start ?? task.timeWindowStart) || "configured start"} and{" "}
                          {(task.time_window_end ?? task.timeWindowEnd) || "configured end"} for high-confidence
                          verification.
                        </p>
                      )}
                      <div className="mt-2">
                        <p>
                          <strong>Partner touchpoint:</strong>{" "}
                          {task.partner_involvement?.daily_check_in_suggestion ??
                            task.partnerInvolvement?.dailyCheckInSuggestion}
                        </p>
                        <p>
                          <strong>Weekly anchor:</strong>{" "}
                          {task.partner_involvement?.weekly_anchor_review ??
                            task.partnerInvolvement?.weeklyAnchorReview}
                        </p>
                      </div>
                      <div className="mt-2">
                        <p>
                          <strong>Suggested proof guidance:</strong>
                        </p>
                        <ul className="list-inside list-disc text-stone-gray dark:text-gray-400">
                          {(task.proof_guidance?.what_counts ?? task.proofGuidance?.whatCounts ?? []).map(
                            (item: string, proofIdx: number) => (
                              <li key={`count-${proofIdx}`}>{item}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

