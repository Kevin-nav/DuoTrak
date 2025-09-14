"use client"

import { motion } from "framer-motion"
import { Flame } from "lucide-react"
import QuickActions from "./quick-actions"
import DuoStreakHero from "./duo-streak-hero"
import MouseGlowEffect from "./mouse-glow-effect"
import ProgressViewerCard from "./progress-viewer-card"
import VerificationQueue from "./verification-queue"
import TodaysTasks from "./todays-tasks"
import GoalsHighlights from "./goals-highlights"
import { useState } from "react"

interface DashboardContentProps {
  userName?: string
  streak?: number
  hasPartner?: boolean
  partnerName?: string
  partnerInitials?: string
  pendingVerifications?: number
  userProgress?: boolean
  partnerProgress?: boolean
}

export default function DashboardContent({
  userName = "Sarah",
  streak = 7,
  hasPartner = true,
  partnerName = "John",
  partnerInitials = "JD",
  pendingVerifications = 2,
  userProgress = true,
  partnerProgress = false,
}: DashboardContentProps) {
  const [goalStates, setGoalStates] = useState({
    1: false,
    2: true,
    3: false,
  })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  const handleGoalToggle = (goalId: number, checked: boolean) => {
    setGoalStates((prev) => ({ ...prev, [goalId]: checked }))
  }

  const handleTaskComplete = (taskId: string) => {
    console.log("Task completed:", taskId)
    // Handle task completion logic
  }

  const handleTaskVerificationSubmit = (taskId: string, imageFile?: File) => {
    console.log("Task verification submitted:", taskId, imageFile)
    // Handle verification submission logic
  }

  const handleVerify = (itemId: string) => {
    console.log("Verified item:", itemId)
    // Handle verification logic
  }

  const handleReject = (itemId: string, reason: string) => {
    console.log("Rejected item:", itemId, "Reason:", reason)
    // Handle rejection logic
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Hero Duo Streak Section */}
      <DuoStreakHero
        streakCount={streak}
        partnerName={partnerName}
        userProgress={userProgress}
        partnerProgress={partnerProgress}
        hasPartner={hasPartner}
      />

      {/* Section 1: Welcome & Motivation */}
      <MouseGlowEffect glowColor="#F0F3F4" intensity="low">
        <motion.section
          variants={itemVariants}
          whileHover={{ scale: 1.01 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
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

      {/* Section 2: Verification Queue (High Priority) */}
      {pendingVerifications > 0 && (
        <motion.section variants={itemVariants}>
          <VerificationQueue onVerify={handleVerify} onReject={handleReject} />
        </motion.section>
      )}

      {/* Section 3: Today's Tasks */}
      <motion.section variants={itemVariants}>
        <TodaysTasks onTaskComplete={handleTaskComplete} onTaskVerificationSubmit={handleTaskVerificationSubmit} />
      </motion.section>

      {/* Section 4: Goals Highlights */}
      <motion.section variants={itemVariants}>
        <GoalsHighlights />
      </motion.section>

      {/* Section 5: Progress Viewer (Replaces Invite Partner) */}
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
                  {partnerInitials}
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

      {/* Section 6: Quick Actions */}
      <QuickActions hasPartner={hasPartner} />
    </motion.div>
  )
}
