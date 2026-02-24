"use client";

import { motion } from "framer-motion";
import {
    CheckCircle2,
    Calendar,
    Flame,
    Target,
    Clock,
    Users,
    Sparkles,
} from "lucide-react";
import type { DuotrakGoalPlan } from "@/schemas/goal";

interface ConfirmationStepProps {
    goalName: string;
    goalType: "habit" | "target-date" | "milestone";
    goalPlan: DuotrakGoalPlan | null;
    isSharedGoal: boolean;
    sharedGoalMode?: "independent" | "together";
    partnerName?: string;
    planningMode: "ai" | "manual";
}

export default function ConfirmationStep({
    goalName,
    goalType,
    goalPlan,
    isSharedGoal,
    sharedGoalMode,
    partnerName,
    planningMode,
}: ConfirmationStepProps) {
    const goalTypeIcon = {
        habit: Flame,
        "target-date": Calendar,
        milestone: Target,
    }[goalType];

    const GoalIcon = goalTypeIcon;

    // Get first day actions from AI plan or build defaults
    const firstDayActions = goalPlan?.first_day_actions || [];
    const weekPreview = goalPlan?.this_week_preview;

    // Goal-type specific rendering
    const typeLabel = {
        habit: "Habit",
        "target-date": "Target Date",
        milestone: "Milestone",
    }[goalType];

    return (
        <div className="space-y-6">
            {/* Success header */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
            >
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/30 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold">You&apos;re all set!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Your plan for <span className="font-medium text-foreground">{goalName}</span> starts today
                </p>
            </motion.div>

            {/* Goal type badge */}
            <div className="flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-xs font-medium">
                    <GoalIcon className="h-3.5 w-3.5" />
                    {typeLabel}
                </span>
                {planningMode === "ai" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <Sparkles className="h-3.5 w-3.5" />
                        AI-Personalized
                    </span>
                )}
                {isSharedGoal && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                        <Users className="h-3.5 w-3.5" />
                        Shared
                    </span>
                )}
            </div>

            {/* First day actions */}
            {firstDayActions.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-4 rounded-xl border bg-card"
                >
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-primary" />
                        Today&apos;s Tasks
                    </h4>
                    <div className="space-y-2">
                        {firstDayActions.map((action, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-muted-foreground">{action}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Week preview */}
            {weekPreview && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 rounded-xl border bg-card"
                >
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        This Week
                    </h4>
                    <p className="text-sm text-muted-foreground">{weekPreview}</p>
                </motion.div>
            )}

            {/* Goal-type specific preview */}
            {goalPlan && goalType === "habit" && goalPlan.habit_config && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 rounded-xl border bg-card"
                >
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        Streak Milestones
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {goalPlan.habit_config.streak_milestones.map((day) => (
                            <span key={day} className="px-2 py-1 rounded-full bg-orange-50 dark:bg-orange-950/20 text-xs font-medium text-orange-700 dark:text-orange-300">
                                Day {day}
                            </span>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Start easy: {goalPlan.habit_config.minimum_viable_start}
                    </p>
                </motion.div>
            )}

            {goalPlan && goalType === "milestone" && goalPlan.milestone_config && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 rounded-xl border bg-card"
                >
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-emerald-500" />
                        Checkpoints
                    </h4>
                    <div className="space-y-2">
                        {goalPlan.milestone_config.checkpoints.map((cp, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{cp.target_label}</span>
                                <span className="text-xs font-medium">{cp.deadline_description}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {goalPlan && goalType === "target-date" && goalPlan.target_date_config && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 rounded-xl border bg-card"
                >
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        Training Phases
                    </h4>
                    <div className="space-y-2">
                        {goalPlan.target_date_config.phases.map((phase, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="font-medium">{phase.name}</span>
                                <span className="text-xs text-muted-foreground">Weeks {phase.week_range}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Shared goal info */}
            {isSharedGoal && partnerName && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
                >
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            {partnerName} will be notified
                        </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                        {sharedGoalMode === "independent"
                            ? `${partnerName} will get the same goal adjusted for their timezone.`
                            : `You'll work on this together on the same schedule.`
                        }
                        {" "}They'll need to accept first.
                    </p>
                </motion.div>
            )}
        </div>
    );
}
