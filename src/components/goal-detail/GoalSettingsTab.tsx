"use client";

import { motion } from "framer-motion";

const inputBase =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-taupe/40";

export default function GoalSettingsTab({
  archetype,
  profileDraft,
  onProfileDraftChange,
  isSavingProfile,
  onSave,
}: {
  archetype: string;
  profileDraft: Record<string, string>;
  onProfileDraftChange: (next: Record<string, string>) => void;
  isSavingProfile: boolean;
  onSave: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border bg-card"
    >
      <div className="border-b border-border p-4 sm:px-5 sm:py-4">
        <h2 className="text-sm font-bold text-foreground">Goal Profile</h2>
      </div>
      <div className="p-4 sm:p-5">
        {archetype === "savings" ||
        archetype === "marathon" ||
        archetype === "daily_habit" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {archetype === "savings" ? (
              <>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    Currency
                  </span>
                  <input
                    className={inputBase}
                    placeholder="USD"
                    value={profileDraft.currency}
                    onChange={(e) =>
                      onProfileDraftChange({
                        ...profileDraft,
                        currency: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    Target Amount
                  </span>
                  <input
                    className={inputBase}
                    type="number"
                    value={profileDraft.targetAmount}
                    onChange={(e) =>
                      onProfileDraftChange({
                        ...profileDraft,
                        targetAmount: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    Current Amount
                  </span>
                  <input
                    className={inputBase}
                    type="number"
                    value={profileDraft.currentAmount}
                    onChange={(e) =>
                      onProfileDraftChange({
                        ...profileDraft,
                        currentAmount: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    Weekly Contribution
                  </span>
                  <input
                    className={inputBase}
                    type="number"
                    value={profileDraft.weeklyContribution}
                    onChange={(e) =>
                      onProfileDraftChange({
                        ...profileDraft,
                        weeklyContribution: e.target.value,
                      })
                    }
                  />
                </label>
              </>
            ) : null}

            {archetype === "marathon" ? (
              <>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    Current Long Run (km)
                  </span>
                  <input
                    className={inputBase}
                    type="number"
                    value={profileDraft.currentLongRunKm}
                    onChange={(e) =>
                      onProfileDraftChange({
                        ...profileDraft,
                        currentLongRunKm: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    Target Long Run (km)
                  </span>
                  <input
                    className={inputBase}
                    type="number"
                    value={profileDraft.targetLongRunKm}
                    onChange={(e) =>
                      onProfileDraftChange({
                        ...profileDraft,
                        targetLongRunKm: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    Total Weeks
                  </span>
                  <input
                    className={inputBase}
                    type="number"
                    value={profileDraft.totalWeeks}
                    onChange={(e) =>
                      onProfileDraftChange({
                        ...profileDraft,
                        totalWeeks: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    Completed Weeks
                  </span>
                  <input
                    className={inputBase}
                    type="number"
                    value={profileDraft.completedWeeks}
                    onChange={(e) =>
                      onProfileDraftChange({
                        ...profileDraft,
                        completedWeeks: e.target.value,
                      })
                    }
                  />
                </label>
              </>
            ) : null}

            {archetype === "daily_habit" ? (
              <>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    Target Streak
                  </span>
                  <input
                    className={inputBase}
                    type="number"
                    value={profileDraft.targetStreak}
                    onChange={(e) =>
                      onProfileDraftChange({
                        ...profileDraft,
                        targetStreak: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    Current Streak
                  </span>
                  <input
                    className={inputBase}
                    type="number"
                    value={profileDraft.currentStreak}
                    onChange={(e) =>
                      onProfileDraftChange({
                        ...profileDraft,
                        currentStreak: e.target.value,
                      })
                    }
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    Daily Target
                  </span>
                  <input
                    className={inputBase}
                    type="number"
                    value={profileDraft.dailyTarget}
                    onChange={(e) =>
                      onProfileDraftChange({
                        ...profileDraft,
                        dailyTarget: e.target.value,
                      })
                    }
                  />
                </label>
              </>
            ) : null}
          </div>
        ) : null}
        <div className="mt-5 flex justify-end border-t border-border pt-4">
          <button
            type="button"
            onClick={onSave}
            disabled={isSavingProfile}
            className="w-full rounded-lg bg-espresso px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-espresso/90 disabled:opacity-60 sm:w-auto"
          >
            {isSavingProfile ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
