"use client"

import type React from "react"

import { motion, type Variants } from "framer-motion"
import { Target, Users, User, Clock, Camera, AlertCircle, TrendingUp } from "lucide-react"
import MouseGlowEffect from "./mouse-glow-effect"

interface Goal {
  id: string
  name: string
  type: "personal" | "shared"
  progress: number
  total: number
  status: "on-track" | "ahead" | "needs-attention" | "completed"
  priority: "high" | "medium" | "low"
  accountabilityType: "visual" | "time-bound"
  pendingVerifications?: number
  color: string
  icon: React.ComponentType<any>
}

interface GoalsHighlightsProps {
  goals?: Goal[]
}

export default function GoalsHighlights({
  goals = [
    {
      id: "1",
      name: "Morning Fitness Duo",
      type: "shared",
      progress: 8,
      total: 14,
      status: "on-track",
      priority: "high",
      accountabilityType: "visual",
      pendingVerifications: 2,
      color: "#10B981",
      icon: TrendingUp,
    },
    {
      id: "2",
      name: "Daily Meditation",
      type: "personal",
      progress: 5,
      total: 10,
      status: "needs-attention",
      priority: "medium",
      accountabilityType: "visual",
      color: "#F59E0B",
      icon: Target,
    },
    {
      id: "3",
      name: "Learn Spanish Together",
      type: "shared",
      progress: 15,
      total: 20,
      status: "ahead",
      priority: "low",
      accountabilityType: "time-bound",
      color: "#8B5CF6",
      icon: Target,
    },
  ],
}: GoalsHighlightsProps) {
  // Sort goals by priority and status
  const sortedGoals = [...goals].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const statusOrder = { "needs-attention": 4, "on-track": 3, ahead: 2, completed: 1 }

    if (a.priority !== b.priority) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return statusOrder[b.status] - statusOrder[a.status]
  })

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "on-track":
        return "🎉"
      case "ahead":
        return "🚀"
      case "needs-attention":
        return "⏳"
      case "completed":
        return "✅"
      default:
        return "🎯"
    }
  }

  const getStatusText = (goal: Goal) => {
    if (goal.pendingVerifications && goal.pendingVerifications > 0) {
      return `${goal.pendingVerifications} pending verification${goal.pendingVerifications > 1 ? "s" : ""}`
    }

    switch (goal.status) {
      case "on-track":
        return goal.type === "shared" ? "Duo On Track!" : "On Track"
      case "ahead":
        return goal.type === "shared" ? "Duo Ahead!" : "Ahead of Schedule"
      case "needs-attention":
        return goal.type === "shared" ? "Duo Needs Attention" : "Needs Attention"
      case "completed":
        return goal.type === "shared" ? "Together, You Did It!" : "Completed"
      default:
        return "In Progress"
    }
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
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut" as const,
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-cool-gray bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700 sm:p-6"
    >
      <motion.h2 variants={itemVariants} className="mb-4 text-lg font-bold text-charcoal dark:text-gray-100 sm:mb-6 sm:text-xl">
        Goals Highlights
      </motion.h2>

      <div className="space-y-4">
        {sortedGoals.slice(0, 3).map((goal, index) => {
          const Icon = goal.icon
          const progressPercentage = (goal.progress / goal.total) * 100

          return (
            <MouseGlowEffect key={goal.id} glowColor={goal.color} intensity="medium">
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.005 }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${goal.pendingVerifications && goal.pendingVerifications > 0
                    ? "border-primary-blue/30 bg-accent-light-blue dark:bg-primary-blue/10"
                    : goal.status === "needs-attention"
                      ? "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20"
                      : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                  }`}
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  {/* Goal Icon */}
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10"
                    style={{ backgroundColor: `${goal.color}20` }}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: goal.color }} />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    {/* Goal Header */}
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-charcoal dark:text-gray-100">{goal.name}</h3>
                        <div className="flex items-center space-x-1">
                          {goal.type === "shared" ? (
                            <Users className="w-3 h-3 text-primary-blue" />
                          ) : (
                            <User className="w-3 h-3 text-stone-gray dark:text-gray-400" />
                          )}
                          <span className="text-xs text-stone-gray dark:text-gray-400 capitalize">{goal.type}</span>
                        </div>
                      </div>

                      {/* Priority Indicator */}
                      {goal.priority === "high" && (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        >
                          <AlertCircle className="w-4 h-4 text-error-red" />
                        </motion.div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-stone-gray dark:text-gray-400">Progress</span>
                        <span className="text-xs font-medium text-charcoal dark:text-gray-100">
                          {goal.progress}/{goal.total}
                        </span>
                      </div>
                      <div className="relative h-2 bg-cool-gray dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
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
                    </div>

                    {/* Status and Accountability */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs font-medium ${goal.pendingVerifications && goal.pendingVerifications > 0
                              ? "text-primary-blue"
                              : goal.status === "on-track"
                                ? "text-green-600 dark:text-green-400"
                                : goal.status === "ahead"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : goal.status === "needs-attention"
                                    ? "text-orange-600 dark:text-orange-400"
                                    : "text-stone-gray dark:text-gray-400"
                            }`}
                        >
                          {getStatusText(goal)} {getStatusEmoji(goal.status)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        {goal.accountabilityType === "visual" ? (
                          <Camera className="w-3 h-3 text-stone-gray dark:text-gray-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-stone-gray dark:text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </MouseGlowEffect>
          )
        })}
      </div>

      {goals.length === 0 && (
        <motion.div variants={itemVariants} className="text-center py-8 text-stone-gray dark:text-gray-400">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active goals to highlight</p>
        </motion.div>
      )}
    </motion.div>
  )
}
