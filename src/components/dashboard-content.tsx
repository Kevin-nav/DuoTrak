'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { Flame, Loader2 } from 'lucide-react';
import QuickActions from './quick-actions';
import DuoStreakHero from './duo-streak-hero';
import MouseGlowEffect from './mouse-glow-effect';
import ProgressViewerCard from './progress-viewer-card';
import VerificationQueue from './verification-queue';
import TodaysTasks from './todays-tasks';
import GoalsHighlights from './goals-highlights';
import { useUser } from '@/contexts/UserContext';

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

  const handleTaskComplete = (taskId: string) => {
    console.log("Task completed:", taskId);
  };

  const handleTaskVerificationSubmit = (taskId: string, imageFile?: File) => {
    console.log("Task verification submitted:", taskId, imageFile);
  };

  const handleVerify = (itemId: string) => {
    console.log("Verified item:", itemId);
  };

  const handleReject = (itemId: string, reason: string) => {
    console.log("Rejected item:", itemId, "Reason:", reason);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
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
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border-cool-gray dark:border-gray-700"
        >
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold text-charcoal dark:text-gray-100">
              Welcome back, {userName}!
            </h1>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <Flame className="w-6 h-6 text-orange-500" />
                </motion.div>
                <div>
                  <span className="text-lg font-semibold text-charcoal dark:text-gray-100">
                    Personal Streak: {streak}
                  </span>
                  <p className="text-stone-gray dark:text-gray-300 text-sm">Keep up the great work!</p>
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
        <TodaysTasks onTaskComplete={handleTaskComplete} onTaskVerificationSubmit={handleTaskVerificationSubmit} />
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
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
            >
              <div className="flex items-center space-x-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-12 h-12 bg-primary-blue rounded-full flex items-center justify-center text-white font-semibold cursor-pointer"
                >
                  {getInitials(partnerName)}
                </motion.div>
                <div>
                  <p className="text-stone-gray dark:text-gray-300 text-sm">Your Partner:</p>
                  <p className="text-charcoal dark:text-gray-100 font-semibold text-lg">{partnerName}</p>
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
