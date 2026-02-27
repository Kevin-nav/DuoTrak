'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { Flame, Loader2 } from 'lucide-react';
import { useQuery as useConvexQuery, useMutation as useConvexMutation, useAction as useConvexAction } from 'convex/react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import QuickActions from './quick-actions';
import DuoStreakHero from './duo-streak-hero';
import MouseGlowEffect from './mouse-glow-effect';
import ProgressViewerCard from './progress-viewer-card';
import VerificationQueue from './verification-queue';
import TodaysTasks from './todays-tasks';
import GoalsHighlights, { type GoalHighlightsItem } from './goals-highlights';
import { useUser } from '@/contexts/UserContext';
import BirthdayLaunchWelcome from '@/components/dashboard/BirthdayLaunchWelcome';
import { useDashboardJournalPulse } from '@/hooks/useJournal';
import JournalEntryInteractions from '@/components/journal/JournalEntryInteractions';
import { fileToBase64 } from '@/lib/files/base64';
import { TaskVerificationSubmission, VerificationMode } from '@/components/task-verification-modal';

interface DashboardContentProps {
  userName?: string;
  streak?: number;
  hasPartner?: boolean;
  partnerName?: string;
  pendingVerifications?: number;
  userProgress?: boolean;
  partnerProgress?: boolean;
}

const getInitials = (name: string = "") => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

const formatRelativeTime = (timestamp?: number): string => {
  if (!timestamp) return "Just now";
  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3_600_000) return `${Math.max(1, Math.floor(diffMs / 60_000))} min ago`;
  if (diffMs < 86_400_000) return `${Math.max(1, Math.floor(diffMs / 3_600_000))}h ago`;
  return `${Math.max(1, Math.floor(diffMs / 86_400_000))}d ago`;
};

const getProofTypeLabel = (mode?: string): string => {
  if (mode === "photo") return "Photo";
  if (mode === "video") return "Video";
  if (mode === "voice") return "Audio";
  if (mode === "time-window") return "Timer";
  return "Proof";
};

const SPECIAL_BIRTHDAY_EMAIL = "charlenelaar26@gmail.com";
const SPECIAL_BIRTHDAY_WELCOME_STORAGE_PREFIX = "duotrak:birthday-welcome:seen:v1";
const DAILY_STREAK_WHATS_NEW_KEY = "duotrak:dashboard:daily-streak-whats-new:v1";

export default function DashboardContent({
  userName,
  streak,
  hasPartner,
  partnerName,
  pendingVerifications = 0,
  userProgress,
  partnerProgress,
}: DashboardContentProps) {
  const { userDetails } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showBirthdayWelcome, setShowBirthdayWelcome] = useState(false);
  const [showDailyStreakWhatsNew, setShowDailyStreakWhatsNew] = useState(false);

  useEffect(() => {
    if (userDetails) {
      if (userDetails.account_status === 'ONBOARDING_PARTNERED') {
        router.push('/onboarding/start');
      } else {
        setIsLoading(false);
      }
    }
  }, [userDetails, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const normalizedEmail = userDetails?.email?.trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail !== SPECIAL_BIRTHDAY_EMAIL) {
      setShowBirthdayWelcome(false);
      return;
    }

    const storageKey = `${SPECIAL_BIRTHDAY_WELCOME_STORAGE_PREFIX}:${normalizedEmail}`;
    const hasSeenWelcome = window.localStorage.getItem(storageKey);
    if (hasSeenWelcome) return;

    window.localStorage.setItem(storageKey, new Date().toISOString());
    setShowBirthdayWelcome(true);
  }, [userDetails?.email]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!userDetails?._id) return;

    const storageKey = `${DAILY_STREAK_WHATS_NEW_KEY}:${String(userDetails._id)}`;
    const hasSeen = window.localStorage.getItem(storageKey);
    if (!hasSeen) {
      setShowDailyStreakWhatsNew(true);
    }
  }, [userDetails?._id]);

  // ── Real task instance data ──
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const rawInstances = useConvexQuery(api.taskInstances.listForDate, { date: todayStart });
  const dashboardGoals = useConvexQuery(api.goals.list);
  const partnerPendingVerificationInstances = useConvexQuery(
    (api as any).taskInstances.listPartnerPendingVerification,
    hasPartner ? { limit: 25 } : "skip"
  );
  const markComplete = useConvexMutation(api.taskInstances.markComplete);
  const submitVerification = useConvexMutation(api.taskInstances.submitVerification);
  const reviewInstanceVerification = useConvexMutation((api as any).taskInstances.partnerReviewVerification);
  const reviewLegacyTaskVerification = useConvexMutation((api as any).tasks.partnerReviewVerificationByPartner);
  const uploadVerificationAttachment = useConvexAction((api as any).taskInstances.uploadVerificationAttachment);
  const { data: journalPulse, isLoading: isJournalPulseLoading } = useDashboardJournalPulse();

  const normalizeVerificationMode = (mode?: string): VerificationMode => {
    if (mode === "photo" || mode === "video" || mode === "voice" || mode === "time-window") return mode;
    if (mode === "check_in" || mode === "task_completion") return mode;
    return "photo";
  };

  // Map Convex instances to the Task interface expected by TodaysTasks
  const taskItems = useMemo(() => {
    if (!rawInstances) return undefined;
    return rawInstances.map((inst: any) => {
      const timeWindow =
        inst.task_time_window_start && inst.task_time_window_end
          ? `${inst.task_time_window_start} - ${inst.task_time_window_end}`
          : undefined;

      const verificationMode = inst.task_verification_mode;
      const accountabilityType: "visual" | "time-bound" =
        verificationMode === "time-window" ? "time-bound" : "visual";

      const status = (() => {
        switch (inst.status) {
          case "completed": return "completed" as const;
          case "pending-verification": return "pending-verification" as const;
          case "pending_verification": return "pending-verification" as const;
          case "missed": return "failed" as const;
          case "skipped": return "failed" as const;
          case "rejected": return "rejected" as const;
          default: return "pending" as const;
        }
      })();

      return {
        id: inst._id,
        name: inst.task_name,
        goalName: inst.goal_name,
        goalArchetype: inst.goal_archetype,
        goalProfileJson: inst.goal_profile_json,
        goalType: inst.is_shared ? ("shared" as const) : ("personal" as const),
        accountabilityType,
        verificationMode: normalizeVerificationMode(verificationMode),
        status,
        timeWindow,
        canComplete: status === "pending" || status === "rejected",
      };
    });
  }, [rawInstances]);

  const goalTodayStats = useMemo(() => {
    const stats = new Map<string, { completed: number; total: number; pendingVerification: number }>();
    if (!rawInstances) return stats;

    for (const instance of rawInstances as any[]) {
      const key = String(instance.goal_id);
      const current = stats.get(key) || { completed: 0, total: 0, pendingVerification: 0 };
      const normalizedStatus = String(instance.status || "");

      current.total += 1;
      if (normalizedStatus === "completed" || normalizedStatus === "verified") {
        current.completed += 1;
      }
      if (normalizedStatus === "pending-verification" || normalizedStatus === "pending_verification") {
        current.pendingVerification += 1;
      }

      stats.set(key, current);
    }

    return stats;
  }, [rawInstances]);

  const goalHighlights = useMemo<GoalHighlightsItem[] | undefined>(() => {
    if (!dashboardGoals) return undefined;

    return (dashboardGoals as any[]).map((goal) => {
      const total = typeof goal.total === "number" ? goal.total : Array.isArray(goal.tasks) ? goal.tasks.length : 0;
      const progress = typeof goal.progress === "number" ? goal.progress : 0;
      const normalizedTotal = Math.max(0, total);
      const normalizedProgress = normalizedTotal > 0 ? Math.max(0, Math.min(progress, normalizedTotal)) : 0;
      const progressRatio = normalizedTotal > 0 ? normalizedProgress / normalizedTotal : 0;

      const isShared = !!goal.shared_goal_group_id;
      const today = goalTodayStats.get(String(goal._id)) || { completed: 0, total: 0, pendingVerification: 0 };
      const pendingVerifications = today.pendingVerification > 0 ? today.pendingVerification : undefined;
      const recentActivityText = today.total > 0 ? `${today.completed}/${today.total} done today` : undefined;

      const status: GoalHighlightsItem["status"] =
        normalizedTotal === 0
          ? "on-track"
          : normalizedProgress >= normalizedTotal
          ? "completed"
          : progressRatio >= 0.8
            ? "ahead"
            : progressRatio >= 0.45
              ? "on-track"
              : "needs-attention";

      const hasTimeBoundTask = Array.isArray(goal.tasks)
        ? goal.tasks.some(
          (task: any) =>
            task?.verification_mode === "time-window" || task?.accountability_type === "time_bound_action"
        )
        : false;

      const priority: GoalHighlightsItem["priority"] =
        pendingVerifications || status === "needs-attention"
          ? "high"
          : status === "on-track"
            ? "medium"
            : "low";

      const color =
        typeof goal.color === "string" && goal.color.trim().length > 0
          ? goal.color
          : isShared
            ? "#19A1E5"
            : "#10B981";

      return {
        id: String(goal._id),
        name: typeof goal.name === "string" ? goal.name : "Untitled Goal",
        type: isShared ? "shared" : "personal",
        progress: normalizedProgress,
        total: normalizedTotal,
        status,
        priority,
        accountabilityType: hasTimeBoundTask || goal.accountability_type === "time_bound_action" ? "time-bound" : "visual",
        pendingVerifications,
        color,
        recentActivityText,
      };
    });
  }, [dashboardGoals, goalTodayStats]);

  const verificationQueueItems = useMemo(() => {
    if (!partnerPendingVerificationInstances) return [];
    return partnerPendingVerificationInstances.map((inst: any) => {
      const resolvedPartnerName = inst.partner_display_name || partnerName || "Partner";
      const proofType = getProofTypeLabel(inst.task_verification_mode || undefined);
      const evidenceUrl = typeof inst.verification_evidence_url === "string" ? inst.verification_evidence_url : undefined;
      return {
        id: String(inst._id),
        sourceType: inst.source_type === "task" ? "task" : "task_instance",
        taskName: inst.task_name || "Task",
        partnerName: resolvedPartnerName,
        partnerInitials: getInitials(resolvedPartnerName),
        evidenceUrl,
        verificationMode: inst.task_verification_mode || undefined,
        submittedAt: formatRelativeTime(inst.verification_submitted_at ?? inst.updated_at),
        goalName: inst.goal_name || "Goal",
        goalType: inst.goal_type === "shared" ? "shared" : "personal",
        proofType,
      };
    });
  }, [partnerPendingVerificationInstances, partnerName]);

  const isPartnerQueueLoading = !!hasPartner && partnerPendingVerificationInstances === undefined;

  const handleTaskComplete = async (taskId: string) => {
    try {
      await markComplete({ instance_id: taskId as any });
    } catch (error) {
      console.error("Failed to mark task complete:", error);
    }
  };

  const handleTaskVerificationSubmit = async (taskId: string, submission: TaskVerificationSubmission) => {
    try {
      if (!submission.file) {
        throw new Error("Missing proof file for verification upload.");
      }
      const base64Data = await fileToBase64(submission.file);
      const uploadResult = await uploadVerificationAttachment({
        instance_id: taskId as any,
        file_name: submission.file.name,
        content_type: submission.file.type || "application/octet-stream",
        base64_data: base64Data,
      });
      await submitVerification({
        instance_id: taskId as any,
        evidence_url: uploadResult?.url,
      });
    } catch (error) {
      console.error("Failed to submit verification:", error);
      throw error;
    }
  };

  const handleVerify = (itemId: string) => {
    const item = verificationQueueItems.find((row: any) => row.id === itemId);
    if (!item) return;

    (async () => {
      try {
        if (item.sourceType === "task") {
          await reviewLegacyTaskVerification({
            id: itemId as any,
            decision: "approved",
          });
        } else {
          await reviewInstanceVerification({
            instance_id: itemId as any,
            decision: "approved",
          });
        }
        toast.success("Task approved.");
      } catch (error: any) {
        toast.error(error?.message || "Failed to approve task.");
      }
    })();
  };

  const handleReject = (itemId: string, reason: string) => {
    const item = verificationQueueItems.find((row: any) => row.id === itemId);
    if (!item) return;

    (async () => {
      try {
        if (item.sourceType === "task") {
          await reviewLegacyTaskVerification({
            id: itemId as any,
            decision: "rejected",
            rejection_reason: reason,
          });
        } else {
          await reviewInstanceVerification({
            instance_id: itemId as any,
            decision: "rejected",
            rejection_reason: reason,
          });
        }
        toast.success("Task rejected. Feedback sent.");
      } catch (error: any) {
        toast.error(error?.message || "Failed to reject task.");
      }
    })();
  };

  const dismissDailyStreakWhatsNew = () => {
    if (typeof window !== "undefined" && userDetails?._id) {
      const storageKey = `${DAILY_STREAK_WHATS_NEW_KEY}:${String(userDetails._id)}`;
      window.localStorage.setItem(storageKey, new Date().toISOString());
    }
    setShowDailyStreakWhatsNew(false);
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
  };

  return (
    <>
      <BirthdayLaunchWelcome open={showBirthdayWelcome} onClose={() => setShowBirthdayWelcome(false)} />

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-6">
      {showDailyStreakWhatsNew ? (
        <motion.section
          variants={itemVariants}
          className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-pink-50 to-sky-50 p-4 shadow-sm sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">What&apos;s New</p>
              <h2 className="text-lg font-bold text-charcoal sm:text-xl">Daily streaks are now timezone-smart</h2>
              <p className="text-sm text-stone-gray">
                Your streak now updates once per day in your own timezone when you do a real DuoTrak action:
                complete a task, journal, update goals, or collaborate with your partner.
              </p>
              <p className="text-sm font-medium text-primary-blue">
                Tiny daily action, big relationship momentum. Keep the flame alive together.
              </p>
            </div>
            <button
              type="button"
              onClick={dismissDailyStreakWhatsNew}
              className="rounded-md bg-charcoal px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Got it
            </button>
          </div>
        </motion.section>
      ) : null}

      <DuoStreakHero
        streakCount={streak}
        partnerName={partnerName}
        userProgress={userProgress}
        partnerProgress={partnerProgress}
        hasPartner={hasPartner}
      />

      <MouseGlowEffect glowColor="#F0F3F4" intensity="low">
        <motion.section
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          className="rounded-xl border-cool-gray bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700 sm:p-6"
        >
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-xl font-bold text-charcoal dark:text-gray-100 sm:text-2xl md:text-3xl">
              Welcome back, {userName}!
            </h1>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <Flame className="h-5 w-5 text-orange-500 sm:h-6 sm:w-6" />
                </motion.div>
                <div className="min-w-0">
                  <span className="text-base font-semibold text-charcoal dark:text-gray-100 sm:text-lg">
                    Shared Streak: {streak}
                  </span>
                  <p className="text-xs text-stone-gray dark:text-gray-300 sm:text-sm">Built together with your partner.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </MouseGlowEffect>

      {hasPartner && (
        <motion.section variants={itemVariants}>
          {isPartnerQueueLoading ? (
            <div className="rounded-xl border border-cool-gray bg-white p-4 text-sm text-stone-gray shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 sm:p-6">
              Loading verification queue...
            </div>
          ) : (
            <VerificationQueue items={verificationQueueItems} onVerify={handleVerify} onReject={handleReject} />
          )}
        </motion.section>
      )}

      <motion.section variants={itemVariants}>
        <TodaysTasks
          tasks={taskItems}
          onTaskComplete={handleTaskComplete}
          onTaskVerificationSubmit={handleTaskVerificationSubmit}
        />
      </motion.section>

      <motion.section variants={itemVariants} className="space-y-3 rounded-xl border-cool-gray bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700 sm:space-y-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-charcoal dark:text-gray-100 sm:text-xl">Journal Pulse</h2>
          <button
            type="button"
            onClick={() => router.push("/journal")}
            className="text-xs font-semibold text-primary-blue hover:underline"
          >
            Open Journal
          </button>
        </div>
        {isJournalPulseLoading ? (
          <p className="text-sm text-stone-gray dark:text-gray-300">Loading journal insights...</p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
            <div className="rounded-lg border border-cool-gray px-2.5 py-2 sm:px-3">
              <p className="text-xs text-stone-gray dark:text-gray-300">Private streak</p>
              <p className="text-base font-semibold text-charcoal dark:text-gray-100">{journalPulse.privateStreakDays} days</p>
            </div>
            <div className="rounded-lg border border-cool-gray px-2.5 py-2 sm:px-3">
              <p className="text-xs text-stone-gray dark:text-gray-300">Shared this week</p>
              <p className="text-base font-semibold text-charcoal dark:text-gray-100">{journalPulse.sharedThisWeek}</p>
            </div>
            <div className="rounded-lg border border-cool-gray px-2.5 py-2 sm:px-3">
              <p className="text-xs text-stone-gray dark:text-gray-300">Waiting on your response</p>
              <p className="text-base font-semibold text-charcoal dark:text-gray-100">{journalPulse.pendingResponseCount}</p>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <h3 className="text-sm font-semibold text-charcoal dark:text-gray-100">Partner Reflections</h3>
          {!isJournalPulseLoading && journalPulse.partnerReflections.length === 0 ? (
            <p className="text-xs text-stone-gray dark:text-gray-300">No partner reflections yet.</p>
          ) : null}
          {journalPulse.partnerReflections.map((entry: any) => (
            <article key={entry._id} className="rounded-xl border border-cool-gray bg-gray-50 p-2.5 dark:bg-gray-900 sm:p-3">
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-charcoal dark:text-gray-100">{entry.title}</p>
                  <p className="line-clamp-2 text-xs text-stone-gray dark:text-gray-300">{entry.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/journal")}
                  className="text-[11px] font-semibold text-primary-blue hover:underline"
                >
                  View
                </button>
              </div>
              <JournalEntryInteractions entryId={entry._id} />
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section variants={itemVariants}>
        <GoalsHighlights goals={goalHighlights} />
      </motion.section>

      <motion.section variants={itemVariants}>
        {!hasPartner ? (
          <ProgressViewerCard userName={userName} />
        ) : (
          <MouseGlowEffect glowColor="#19A1E5" intensity="medium">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="rounded-xl border border-cool-gray bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700 sm:p-6"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary-blue text-sm font-semibold text-white sm:h-12 sm:w-12"
                >
                  {getInitials(partnerName)}
                </motion.div>
                <div>
                  <p className="text-xs text-stone-gray dark:text-gray-300 sm:text-sm">Your Partner:</p>
                  <p className="text-base font-semibold text-charcoal dark:text-gray-100 sm:text-lg">{partnerName}</p>
                </div>
              </div>
            </motion.div>
          </MouseGlowEffect>
        )}
      </motion.section>

      <QuickActions hasPartner={!!hasPartner} />
      </motion.div>
    </>
  );
}
