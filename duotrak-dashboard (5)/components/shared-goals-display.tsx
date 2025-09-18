"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Users, Clock, Camera, Star, TrendingUp } from "lucide-react"
import MouseGlowEffect from "./mouse-glow-effect"

interface SharedGoal {
  id: string
  name: string
  category: string
  icon: React.ComponentType<any>
  duoProgress: number
  duoTotal: number
  userProgress: number
  partnerProgress: number
  status: "duo-on-track" | "duo-ahead" | "duo-needs-attention" | "duo-completed"
  color: string
  accountabilityType: "visual" | "time-bound"
  partnerName: string
  partnerInitials: string
}

interface SharedGoalsDisplayProps {
  sharedGoals?: SharedGoal[]
  pendingGoals?: Array<{
    id: string
    name: string
    status: "pending-partner" | "pending-you"
    partnerName: string
  }>
}

export default function SharedGoalsDisplay({
  sharedGoals = [
    {
      id: "1",
      name: "Morning Running Duo",
      category: "Fitness",
      icon: TrendingUp,
      duoProgress: 8,
      duoTotal: 14,
      userProgress: 4,
      partnerProgress: 4,
      status: "duo-on-track",
      color: "#10B981",
      accountabilityType: "visual",
      partnerName: "John",
      partnerInitials: "JD",
    },
    {
      id: "2",
      name: "Learn Spanish Together",
      category: "Education",
      icon: Star,
      duoProgress: 12,
      duoTotal: 20,
      status: "duo-ahead",
      userProgress: 7,
      partnerProgress: 5,
      color: "#F59E0B",
      accountabilityType: "time-bound",
      partnerName: "John",
      partnerInitials: "JD",
    },
  ],
  pendingGoals = [
    {
      id: "pending-1",
      name: "Daily Meditation Practice",
      status: "pending-partner",
      partnerName: "John",
    },
  ],
}: SharedGoalsDisplayProps) {
  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "duo-on-track":
        return "🎉"
      case "duo-ahead":
        return "🚀"
      case "duo-needs-attention":
        return "⏳"
      case "duo-completed":
        return "✅"
      default:
        return "🎯"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "duo-on-track":
        return "Duo On Track!"
      case "duo-ahead":
        return "Duo Ahead!"
      case "duo-needs-attention":
        return "Needs Duo Attention"
      case "duo-completed":
        return "Together, You Did It!"
      default:
        return "In Progress"
    }
  }

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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
      {/* Pending Goals */}
      {pendingGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100">Pending Approval</h3>
          {pendingGoals.map((goal) => (
            <motion.div
              key={goal.id}
              variants={itemVariants}
              className="bg-accent-light-blue dark:bg-primary-blue/10 border border-primary-blue/20 dark:border-primary-blue/30 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Clock className="w-5 h-5 text-primary-blue" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-charcoal dark:text-gray-100">{goal.name}</h4>
                    <p className="text-sm text-stone-gray dark:text-gray-300">
                      {goal.status === "pending-partner"
                        ? `Awaiting ${goal.partnerName}'s acceptance`
                        : "Waiting for your review"}
                    </p>
                  </div>
                </div>
                {goal.status === "pending-you" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    Review
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Active Shared Goals */}
      {sharedGoals.length > 0 && (
        <div className="space-y-3">
          {pendingGoals.length > 0 && (
            <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100 mt-6">Active Goals</h3>
          )}
          {sharedGoals.map((goal) => {
            const Icon = goal.icon
            const duoProgressPercentage = (goal.duoProgress / goal.duoTotal) * 100
            const userProgressPercentage = goal.duoTotal > 0 ? (goal.userProgress / goal.duoTotal) * 100 : 0
            const partnerProgressPercentage = goal.duoTotal > 0 ? (goal.partnerProgress / goal.duoTotal) * 100 : 0

            return (
              <MouseGlowEffect key={goal.id} glowColor={goal.color} intensity="medium">
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    {/* Goal Icon */}
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${goal.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: goal.color }} />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      {/* Goal Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-charcoal dark:text-gray-100 mb-1">{goal.name}</h3>
                          <p className="text-sm text-stone-gray dark:text-gray-400">{goal.category}</p>
                        </div>

                        {/* Status Badge */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            goal.status === "duo-on-track"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : goal.status === "duo-ahead"
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : goal.status === "duo-needs-attention"
                                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {getStatusText(goal.status)} {getStatusEmoji(goal.status)}
                        </motion.div>
                      </div>

                      {/* Duo Progress Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-stone-gray dark:text-gray-400">Duo Progress</span>
                          <span className="text-sm font-semibold text-charcoal dark:text-gray-100">
                            {goal.duoProgress}/{goal.duoTotal}
                          </span>
                        </div>

                        {/* Overall Duo Progress Bar */}
                        <div className="relative h-3 bg-cool-gray dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${duoProgressPercentage}%` }}
                            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                            className="h-full rounded-full relative"
                            style={{ backgroundColor: goal.color }}
                          >
                            {/* Shimmer effect */}
                            <motion.div
                              animate={{ x: [-100, 200] }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                            />
                          </motion.div>
                        </div>

                        {/* Partner Contribution Indicators */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* User Progress */}
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                Y
                              </div>
                              <div className="flex-1">
                                <div className="w-16 h-1.5 bg-cool-gray dark:bg-gray-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${userProgressPercentage}%` }}
                                    transition={{ duration: 0.8, delay: 0.7 }}
                                    className="h-full bg-primary-blue rounded-full"
                                  />
                                </div>
                                <span className="text-xs text-stone-gray dark:text-gray-400">{goal.userProgress}</span>
                              </div>
                            </div>

                            {/* Partner Progress */}
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                                style={{ backgroundColor: goal.color }}
                              >
                                {goal.partnerInitials}
                              </div>
                              <div className="flex-1">
                                <div className="w-16 h-1.5 bg-cool-gray dark:bg-gray-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${partnerProgressPercentage}%` }}
                                    transition={{ duration: 0.8, delay: 0.9 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: goal.color }}
                                  />
                                </div>
                                <span className="text-xs text-stone-gray dark:text-gray-400">
                                  {goal.partnerProgress}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Accountability Info */}
                          <div className="flex items-center space-x-1 text-xs text-stone-gray dark:text-gray-400">
                            {goal.accountabilityType === "visual" ? (
                              <Camera className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </MouseGlowEffect>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {sharedGoals.length === 0 && pendingGoals.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-cool-gray dark:border-gray-700"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className="mb-6"
          >
            <Users className="w-16 h-16 text-primary-blue mx-auto mb-4" />
          </motion.div>
          <h3 className="text-xl font-bold text-charcoal dark:text-gray-100 mb-2">No shared goals yet</h3>
          <p className="text-stone-gray dark:text-gray-300 mb-6">
            Create your first shared goal and start achieving together!
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
