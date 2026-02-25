'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { Flame, Loader2 } from 'lucide-react';
import { useQuery as useConvexQuery, useMutation as useConvexMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import QuickActions from './quick-actions';
import DuoStreakHero from './duo-streak-hero';
import MouseGlowEffect from './mouse-glow-effect';
import ProgressViewerCard from './progress-viewer-card';
import VerificationQueue from './verification-queue';
import TodaysTasks from './todays-tasks';
import GoalsHighlights from './goals-highlights';
import { useUser } from '@/contexts/UserContext';
import { useDashboardJournalPulse } from '@/hooks/useJournal';
import JournalEntryInteractions from '@/components/journal/JournalEntryInteractions';

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

export default function DashboardContent({
  userName,
  streak,
  hasPartner,
  partnerName,
  pendingVerifications = 2,
  userProgress,
  partnerProgress,
}: DashboardContentProps) {
  const { userDetails } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userDetails) {
      if (userDetails.account_status === 'ONBOARDING_PARTNERED') {
        router.push('/onboarding/start');
      } else {
        setIsLoading(false);
      }
    }
  }, [userDetails, router]);

  // ── Real task instance data ──
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const rawInstances = useConvexQuery(api.taskInstances.listForDate, { date: todayStart });
  const markComplete = useConvexMutation(api.taskInstances.markComplete);
  const submitVerification = useConvexMutation(api.taskInstances.submitVerification);
  const { data: journalPulse, isLoading: isJournalPulseLoading } = useDashboardJournalPulse();

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
        status,
        timeWindow,
        canComplete: status === "pending" || status === "rejected",
      };
    });
  }, [rawInstances]);

  const handleTaskComplete = async (taskId: string) => {
    try {
      await markComplete({ instance_id: taskId as any });
    } catch (error) {
      console.error("Failed to mark task complete:", error);
    }
  };

  const handleTaskVerificationSubmit = async (taskId: string, _imageFile?: File) => {
    try {
      await submitVerification({ instance_id: taskId as any });
    } catch (error) {
      console.error("Failed to submit verification:", error);
    }
  };

  const handleVerify = (itemId: string) => {
    console.log("Verified item:", itemId);
  };

  const handleReject = (itemId: string, reason: string) => {
    console.log("Rejected item:", itemId, "Reason:", reason);
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4 sm:space-y-6">
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
                    Personal Streak: {streak}
                  </span>
                  <p className="text-xs text-stone-gray dark:text-gray-300 sm:text-sm">Keep up the great work!</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </MouseGlowEffect>

      {pendingVerifications > 0 && (
        <motion.section variants={itemVariants}>
          <VerificationQueue onVerify={handleVerify} onReject={handleReject} />
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
        <GoalsHighlights />
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
  );
}
