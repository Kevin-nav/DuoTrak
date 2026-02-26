"use client"

import { useMemo } from "react"
import { motion, type Variants } from "framer-motion"
import { Target, Users, User, Clock, Camera, AlertCircle, TrendingUp } from "lucide-react"
import MouseGlowEffect from "./mouse-glow-effect"

export interface GoalHighlightsItem {
  id: string
  name: string
  type: "personal" | "shared"
  progress: number
  total: number
  status: "on-track" | "ahead" | "needs-attention" | "completed"
  priority: "high" | "medium" | "low"
  accountabilityType: "visual" | "time-bound"
  pendingVerifications?: number
  color?: string
  recentActivityText?: string
}

interface GoalsHighlightsProps {
  goals?: GoalHighlightsItem[]
}

const DEFAULT_SHARED_COLOR = "#19A1E5"
const DEFAULT_PERSONAL_COLOR = "#10B981"

function getStatusText(goal: GoalHighlightsItem): string {
  if (goal.pendingVerifications && goal.pendingVerifications > 0) {
    return `${goal.pendingVerifications} pending verification${goal.pendingVerifications > 1 ? "s" : ""}`
  }

  if (goal.recentActivityText) {
    return goal.recentActivityText
  }

  switch (goal.status) {
    case "on-track":
      return goal.type === "shared" ? "Duo on track" : "On track"
    case "ahead":
      return goal.type === "shared" ? "Duo ahead" : "Ahead of schedule"
    case "needs-attention":
      return goal.type === "shared" ? "Duo needs attention" : "Needs attention"
    case "completed":
      return goal.type === "shared" ? "Completed together" : "Completed"
    default:
      return "In progress"
  }
}

export default function GoalsHighlights({ goals }: GoalsHighlightsProps) {
  const sortedGoals = useMemo(() => {
    if (!goals) return []

    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const statusOrder = { "needs-attention": 4, "on-track": 3, ahead: 2, completed: 1 }

    return [...goals].sort((a, b) => {
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
      return statusOrder[b.status] - statusOrder[a.status]
    })
  }, [goals])

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

  if (goals === undefined) {
    return (
      <div className="rounded-xl border border-cool-gray bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <h2 className="mb-4 text-lg font-bold text-charcoal dark:text-gray-100 sm:mb-6 sm:text-xl">Goals Highlights</h2>
        <p className="text-sm text-stone-gray dark:text-gray-300">Loading goals...</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-cool-gray bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6"
    >
      <motion.h2 variants={itemVariants} className="mb-4 text-lg font-bold text-charcoal dark:text-gray-100 sm:mb-6 sm:text-xl">
        Goals Highlights
      </motion.h2>

      <div className="space-y-4">
        {sortedGoals.slice(0, 3).map((goal, index) => {
          const color = goal.color || (goal.type === "shared" ? DEFAULT_SHARED_COLOR : DEFAULT_PERSONAL_COLOR)
          const Icon = goal.type === "shared" ? TrendingUp : Target
          const progressPercentage = goal.total > 0 ? Math.min(100, Math.round((goal.progress / goal.total) * 100)) : 0

          return (
            <MouseGlowEffect key={goal.id} glowColor={color} intensity="medium">
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.005 }}
                className={`rounded-lg border p-4 transition-all ${goal.pendingVerifications && goal.pendingVerifications > 0
                  ? "border-primary-blue/30 bg-accent-light-blue dark:bg-primary-blue/10"
                  : goal.status === "needs-attention"
                    ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
                    : "border-cool-gray hover:border-primary-blue dark:border-gray-600"
                  }`}
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} />
                  </motion.div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-charcoal dark:text-gray-100">{goal.name}</h3>
                        <div className="flex items-center space-x-1">
                          {goal.type === "shared" ? (
                            <Users className="h-3 w-3 text-primary-blue" />
                          ) : (
                            <User className="h-3 w-3 text-stone-gray dark:text-gray-400" />
                          )}
                          <span className="text-xs capitalize text-stone-gray dark:text-gray-400">{goal.type}</span>
                        </div>
                      </div>

                      {goal.priority === "high" && (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        >
                          <AlertCircle className="h-4 w-4 text-error-red" />
                        </motion.div>
                      )}
                    </div>

                    <div className="mb-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-stone-gray dark:text-gray-400">Progress</span>
                        <span className="text-xs font-medium text-charcoal dark:text-gray-100">
                          {goal.progress}/{goal.total}
                        </span>
                      </div>
                      <div className="relative h-2 overflow-hidden rounded-full bg-cool-gray dark:bg-gray-700">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                          className="relative h-full rounded-full"
                          style={{ backgroundColor: color }}
                        >
                          <motion.div
                            animate={{ x: [-100, 200] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="absolute inset-0 skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          />
                        </motion.div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
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
                        {getStatusText(goal)}
                      </span>

                      <div className="flex items-center space-x-1">
                        {goal.accountabilityType === "visual" ? (
                          <Camera className="h-3 w-3 text-stone-gray dark:text-gray-400" />
                        ) : (
                          <Clock className="h-3 w-3 text-stone-gray dark:text-gray-400" />
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

      {sortedGoals.length === 0 && (
        <motion.div variants={itemVariants} className="py-8 text-center text-stone-gray dark:text-gray-400">
          <Target className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>No active goals to highlight</p>
        </motion.div>
      )}
    </motion.div>
  )
}
