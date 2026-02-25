"use client";

import { motion } from "framer-motion";
import { Users, Globe, Clock, ArrowLeftRight } from "lucide-react";

interface SharedGoalStepProps {
  isSharedGoal: boolean;
  sharedGoalMode: "independent" | "together" | undefined;
  partnerName: string;
  userTimezone: string;
  partnerTimezone?: string;
  onSharedGoalChange: (isShared: boolean) => void;
  onModeChange: (mode: "independent" | "together") => void;
}

export default function SharedGoalStep({
  isSharedGoal,
  sharedGoalMode,
  partnerName,
  userTimezone,
  partnerTimezone,
  onSharedGoalChange,
  onModeChange,
}: SharedGoalStepProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6 text-center">
        <h3 className="text-lg font-semibold">Do this with your partner?</h3>
        <p className="mt-1 text-sm text-muted-foreground">Shared goals keep both of you accountable</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSharedGoalChange(false)}
          className={`rounded-xl border-2 p-4 text-left transition-all ${
            !isSharedGoal ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
          }`}
        >
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Just Me</span>
          </div>
          <p className="break-words text-xs text-muted-foreground">Personal goal - {partnerName} can still cheer you on</p>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSharedGoalChange(true)}
          className={`rounded-xl border-2 p-4 text-left transition-all ${
            isSharedGoal ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
          }`}
        >
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">With {partnerName}</span>
          </div>
          <p className="break-words text-xs text-muted-foreground">Both work on the same goal - double the accountability</p>
        </motion.button>
      </div>

      {isSharedGoal && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          <p className="text-sm font-medium text-muted-foreground">How will you do this together?</p>

          <div className="space-y-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onModeChange("independent")}
              className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${
                sharedGoalMode === "independent"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/30">
                  <ArrowLeftRight className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Independent</p>
                  <p className="text-xs text-muted-foreground">Same goal, each at your own pace and timezone</p>
                </div>
              </div>

              {sharedGoalMode === "independent" && partnerTimezone && partnerTimezone !== userTimezone && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 p-3"
                >
                  <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Tasks will be adjusted: You at <span className="font-medium text-foreground">{userTimezone}</span>{" "}
                    {"->"} {partnerName} at <span className="font-medium text-foreground">{partnerTimezone}</span>
                  </p>
                </motion.div>
              )}
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onModeChange("together")}
              className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${
                sharedGoalMode === "together"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-950/30">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Together</p>
                  <p className="text-xs text-muted-foreground">Synchronized schedule - do it at the same time</p>
                </div>
              </div>
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
