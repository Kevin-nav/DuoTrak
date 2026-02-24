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
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Do this with your partner?</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Shared goals keep both of you accountable
                </p>
            </div>

            {/* Toggle: shared or personal */}
            <div className="grid grid-cols-2 gap-3">
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSharedGoalChange(false)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${!isSharedGoal
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium text-sm">Just Me</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Personal goal — {partnerName} can still cheer you on
                    </p>
                </motion.button>

                <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSharedGoalChange(true)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${isSharedGoal
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-primary" />
                        <span className="font-medium text-sm">With {partnerName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Both work on the same goal — double the accountability
                    </p>
                </motion.button>
            </div>

            {/* Shared goal mode selector */}
            {isSharedGoal && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                >
                    <p className="text-sm font-medium text-muted-foreground">
                        How will you do this together?
                    </p>

                    <div className="space-y-3">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => onModeChange("independent")}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${sharedGoalMode === "independent"
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground/30"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                                    <ArrowLeftRight className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Independent</p>
                                    <p className="text-xs text-muted-foreground">
                                        Same goal, each at your own pace & timezone
                                    </p>
                                </div>
                            </div>

                            {sharedGoalMode === "independent" && partnerTimezone && partnerTimezone !== userTimezone && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-3 p-3 rounded-lg bg-muted/50 flex items-center gap-2"
                                >
                                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <p className="text-xs text-muted-foreground">
                                        Tasks will be adjusted: You at{" "}
                                        <span className="font-medium text-foreground">{userTimezone}</span>
                                        {" → "}
                                        {partnerName} at{" "}
                                        <span className="font-medium text-foreground">{partnerTimezone}</span>
                                    </p>
                                </motion.div>
                            )}
                        </motion.button>

                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => onModeChange("together")}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${sharedGoalMode === "together"
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-muted-foreground/30"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">Together</p>
                                    <p className="text-xs text-muted-foreground">
                                        Synchronized schedule — do it at the same time
                                    </p>
                                </div>
                            </div>
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
