"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Target, Clock, Camera, TrendingUp } from "lucide-react"
import MouseGlowEffect from "./mouse-glow-effect"

interface Goal {
  id: string
  name: string
  category: string
  icon: React.ComponentType<any>
  progress: number
  total: number
  status: "on-track" | "ahead" | "needs-attention" | "completed"
  priority: "high" | "medium" | "low"
  accountabilityType: "visual" | "time-bound"
  pendingVerifications?: number
  color: string
}

interface GoalsHighlightsProps {
  goals?: Goal[]
}

export default function GoalsHighlights({
  goals = [
    {
      id: "1",
      name: "Morning Fitness Duo",
      category: "Fitness",
      icon: TrendingUp,
      progress: 8,
      total: 14,
      status: "on-track",
      priority: "high",
      accountabilityType: "visual",
      pendingVerifications: 2,
      color: "#10B981",
    },
    {
      id: "2",
      name: "Daily Meditation",
      category: "Wellness",
      icon: Target,
      progress: 5,
      total: 10,
      status: "needs-attention",
      priority: "medium",
      accountabilityType: "visual",
      color: "#F59E0B",
    },
    {
      id: "3",
      name: "Learn Spanish Together",
      category: "Education",
      icon: Target,
      progress: 15,
      total: 20,
      status: "ahead",
      priority: "low",
      accountabilityType: "time-bound",
      color: "#8B5CF6",
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
        return "On Track"
      case "ahead":
        return "Ahead of Schedule"
      case "needs-attention":
        return "Needs Attention"
      case "completed":
        return "Completed"
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
        duration: 0.4,
        ease: "easeOut",
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-card rounded-xl p-6 shadow-sm border border-border"
    >
      <motion.h2 variants={itemVariants} className="text-xl font-bold text-foreground mb-6">
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
                whileHover={{ scale: 1.01, x: 5 }}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  goal.pendingVerifications && goal.pendingVerifications > 0
                    ? "border-primary/30 bg-primary/10"
                    : goal.status === "needs-attention"
                      ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
                      : "border-border hover:border-primary"
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Goal Icon */}
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${goal.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: goal.color }} />
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    {/* Goal Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{goal.name}</h3>
                        <p className="text-sm text-muted-foreground">{goal.category}</p>
                      </div>

                      {/* Status Badge */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          goal.status === "on-track"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : goal.status === "ahead"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                              : goal.status === "needs-attention"
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {getStatusText(goal)} {getStatusEmoji(goal.status)}
                      </motion.div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm font-semibold text-foreground">
                          {goal.progress}/{goal.total}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
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

                      {/* Status and Accountability */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-xs font-medium ${
                              goal.pendingVerifications && goal.pendingVerifications > 0
                                ? "text-primary"
                                : goal.status === "on-track"
                                  ? "text-green-600"
                                  : goal.status === "ahead"
                                    ? "text-blue-600"
                                    : goal.status === "needs-attention"
                                      ? "text-orange-600"
                                      : "text-muted-foreground"
                            }`}
                          >
                            {getStatusText(goal)} {getStatusEmoji(goal.status)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          {goal.accountabilityType === "visual" ? (
                            <Camera className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <Clock className="w-3 h-3 text-muted-foreground" />
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

      {goals.length === 0 && (
        <motion.div variants={itemVariants} className="text-center py-8 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active goals to highlight</p>
        </motion.div>
      )}
    </motion.div>
  )
}
