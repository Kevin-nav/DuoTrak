"use client"

import { motion } from "framer-motion"
import { Flame, Clock, Dumbbell, Book } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import ActivityFeed from "./activity-feed"
import QuickActions from "./quick-actions"
import DuoStreakHero from "./duo-streak-hero"
import EnhancedCheckbox from "./enhanced-checkbox"
import ProgressViewerCard from "./progress-viewer-card"

interface DashboardClientProps {
  userName?: string
  streak?: number
  hasPartner?: boolean
  partnerName?: string
  partnerInitials?: string
  pendingVerifications?: number
  userProgress?: boolean
  partnerProgress?: boolean
}

export default function DashboardClient({
  userName,
  streak,
  hasPartner,
  partnerName,
  partnerInitials,
  pendingVerifications,
  userProgress,
  partnerProgress,
}: DashboardClientProps) {
  const router = useRouter()

  useEffect(() => {
    // If the user's partner status is confirmed to be false, redirect them.
    if (hasPartner === false) {
      // NOTE: This path should point to your partner invitation page.
      router.push("/invite-partner")
    }
  }, [hasPartner, router])

  // While waiting for the redirect or for props to load, show a loader.
  // This prevents a flash of the dashboard content for users without a partner.
  if (hasPartner === undefined || hasPartner === false) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="text-center">
          <p className="text-lg font-semibold">Checking your partner status...</p>
          <p className="text-sm text-gray-500">Please wait a moment.</p>
        </div>
      </div>
    )
  }

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

  const sharedGoals = [
    {
      id: 1,
      name: "Wake up by 7 AM",
      category: "Morning Routine",
      icon: Clock,
      completed: goalStates[1],
    },
    {
      id: 2,
      name: "30-minute workout",
      category: "Fitness",
      icon: Dumbbell,
      completed: goalStates[2],
    },
    {
      id: 3,
      name: "Read for 20 minutes",
      category: "Learning",
      icon: Book,
      completed: goalStates[3],
    },
  ]

  const handleGoalToggle = (goalId: number, checked: boolean) => {
    setGoalStates((prev) => ({ ...prev, [goalId]: checked }))
  }

  // Since we redirect if hasPartner is false, we can now assume it's true.
  // The UI is simplified to only show the partnered state.
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

      {/* Section 2: Progress Viewer */}
      <motion.section variants={itemVariants}>
        <ProgressViewerCard
          userName={userName}
          completedToday={3} // DUMMY DATA
          totalToday={5} // DUMMY DATA
          weeklyStreak={streak}
          monthlyGoals={12} // DUMMY DATA
        />
      </motion.section>

      {/* Section 3: Enhanced Shared Goals */}
      <motion.section
        variants={itemVariants}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
      >
        <h2 className="text-xl font-bold text-charcoal dark:text-gray-100 mb-4">Shared Goals Highlights</h2>

        <div className="space-y-3">
          {sharedGoals.map((goal, index) => {
            const Icon = goal.icon
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.01, x: 5 }}
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-pearl-gray dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex-shrink-0">
                  <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                    <Icon className="w-5 h-5 text-primary-blue group-hover:text-primary-blue-hover transition-colors" />
                  </motion.div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-charcoal dark:text-gray-100 font-medium truncate">{goal.name}</p>
                  <p className="text-stone-gray dark:text-gray-300 text-sm">{goal.category}</p>
                </div>

                <div className="flex-shrink-0">
                  <EnhancedCheckbox
                    checked={goal.completed}
                    onChange={(checked) => handleGoalToggle(goal.id, checked)}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* Section 4: Enhanced Activity Feed */}
      <ActivityFeed pendingVerifications={pendingVerifications} />

      {/* Section 5: Quick Actions */}
      <QuickActions hasPartner={hasPartner} />
    </motion.div>
  )
}
