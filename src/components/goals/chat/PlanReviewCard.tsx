"use client";

import { motion } from "framer-motion";
import {
    Target,
    Clock,
    CheckCircle2,
    ListChecks,
    Calendar,
    ArrowLeft,
    Loader2,
    Trophy,
    Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GeneratedPlan } from "@/lib/api/goal-chat";

const ACCOUNTABILITY_LABELS: Record<string, string> = {
    photo: "📸 Photo Proof",
    video: "🎥 Video Proof",
    voice: "🎙️ Voice Reflection",
    check_in: "⏰ Check-in",
    task_completion: "✅ Task Completion",
};

const FREQ_LABELS: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Every 2 weeks",
    monthly: "Monthly",
};

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function PlanReviewCard({
    plan,
    isLoading,
    onBack,
    onApprove,
    isCreating,
}: {
    plan: GeneratedPlan | null;
    isLoading: boolean;
    onBack: () => void;
    onApprove: () => void;
    isCreating: boolean;
}) {
    if (isLoading || !plan) {
        return (
            <motion.div
                className="rounded-2xl border border-border bg-card p-8"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex flex-col items-center gap-4 py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-taupe" />
                    <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Generating your plan...</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Our AI is creating milestones, tasks, and schedules tailored to your goal.
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    const totalWeight = plan.milestones.reduce((sum, m) => sum + m.progress_weight, 0);

    return (
        <motion.div
            className="rounded-2xl border border-border bg-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* Header */}
            <div className="border-b border-border p-5">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sand">
                        <ListChecks className="h-4.5 w-4.5 text-espresso" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-foreground">{plan.title}</h2>
                        <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                </div>

                {/* Meta badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium text-espresso">
                        <Target className="h-3 w-3" />
                        {capitalize(plan.intent.replace("-", " "))}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium text-espresso">
                        {ACCOUNTABILITY_LABELS[plan.accountability_type] || plan.accountability_type}
                    </span>
                    {plan.deadline && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium text-espresso">
                            <Calendar className="h-3 w-3" />
                            {plan.deadline}
                        </span>
                    )}
                </div>
            </div>

            {/* Progress bar preview */}
            <div className="border-b border-border px-5 py-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">Progress Preview</span>
                    <span>{plan.milestones.length} milestones</span>
                </div>
                <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-sand">
                    {plan.milestones.map((milestone, i) => {
                        const colors = [
                            "bg-amber-400",
                            "bg-orange-400",
                            "bg-rose-400",
                            "bg-emerald-400",
                            "bg-sky-400",
                        ];
                        return (
                            <div
                                key={i}
                                className={`${colors[i % colors.length]} transition-all`}
                                style={{ width: `${(milestone.progress_weight / totalWeight) * 100}%` }}
                                title={`${milestone.name} (${milestone.progress_weight}%)`}
                            />
                        );
                    })}
                </div>
                <div className="mt-1.5 flex justify-between">
                    {plan.milestones.map((m, i) => (
                        <span key={i} className="text-[10px] text-muted-foreground">
                            {m.progress_weight}%
                        </span>
                    ))}
                </div>
            </div>

            {/* Milestones */}
            <div className="space-y-0">
                {plan.milestones.map((milestone, mIdx) => (
                    <motion.div
                        key={mIdx}
                        className="border-b border-border last:border-b-0"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: mIdx * 0.08, duration: 0.3 }}
                    >
                        {/* Milestone header */}
                        <div className="flex items-start gap-3 px-5 pt-4 pb-2">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand">
                                <Trophy className="h-3.5 w-3.5 text-espresso" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-foreground">{milestone.name}</h3>
                                    <span className="text-xs text-muted-foreground">
                                        Week {milestone.target_week}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-xs text-muted-foreground">{milestone.description}</p>
                            </div>
                        </div>

                        {/* Tasks */}
                        <div className="px-5 pb-4 pl-14">
                            <div className="space-y-2">
                                {milestone.tasks.map((task, tIdx) => (
                                    <div
                                        key={tIdx}
                                        className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2">
                                                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-taupe" />
                                                <div>
                                                    <p className="text-xs font-semibold text-foreground">{task.name}</p>
                                                    {task.description && (
                                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                            {task.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-1.5 pl-5">
                                            <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] text-espresso">
                                                <Repeat className="h-2.5 w-2.5" />
                                                {FREQ_LABELS[task.frequency] || task.frequency}
                                            </span>
                                            {task.days.length > 0 && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] text-espresso">
                                                    <Calendar className="h-2.5 w-2.5" />
                                                    {task.days.map(capitalize).join(", ")}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] text-espresso">
                                                <Clock className="h-2.5 w-2.5" />
                                                {task.duration_minutes}min
                                            </span>
                                            <span className="inline-flex items-center rounded-full bg-sand/60 px-2 py-0.5 text-[10px] text-espresso">
                                                {ACCOUNTABILITY_LABELS[task.accountability_type] || task.accountability_type}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-border p-4">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Chat
                </Button>
                <Button
                    size="sm"
                    onClick={onApprove}
                    disabled={isCreating}
                    className="gap-1.5 bg-espresso text-white hover:bg-espresso/90"
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Create Goal
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
