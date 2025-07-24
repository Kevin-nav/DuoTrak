"use client"

import { motion } from "framer-motion"
import { Calendar, Target, Award, ChevronRight } from "lucide-react"
import MouseGlowEffect from "./mouse-glow-effect"

interface ProgressViewerCardProps {
  userName?: string
  completedToday?: number
  totalToday?: number
  weeklyStreak?: number
  monthlyGoals?: number
}

export default function ProgressViewerCard({
  userName = "Sarah",
  completedToday = 3,
  totalToday = 5,
  weeklyStreak = 4,
  monthlyGoals = 12,
}: ProgressViewerCardProps) {
  const progressPercentage = (completedToday / totalToday) * 100

  return (
    <MouseGlowEffect glowColor="#19A1E5" intensity="medium">
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 cursor-pointer"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-charcoal dark:text-gray-100">Your Progress</h3>
            <motion.div whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="w-5 h-5 text-stone-gray dark:text-gray-400" />
            </motion.div>
          </div>

          {/* Today's Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-gray dark:text-gray-300">Today's Tasks</span>
              <span className="text-sm font-semibold text-charcoal dark:text-gray-100">
                {completedToday}/{totalToday}
              </span>
            </div>

            <div className="relative h-2 bg-cool-gray dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary-blue to-accent-light-blue rounded-full relative"
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

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center p-2 rounded-lg bg-pearl-gray dark:bg-gray-700"
            >
              <Calendar className="w-4 h-4 text-primary-blue mx-auto mb-1" />
              <p className="text-xs text-stone-gray dark:text-gray-400">Week Streak</p>
              <p className="text-sm font-bold text-charcoal dark:text-gray-100">{weeklyStreak}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center p-2 rounded-lg bg-pearl-gray dark:bg-gray-700"
            >
              <Target className="w-4 h-4 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-stone-gray dark:text-gray-400">Month Goals</p>
              <p className="text-sm font-bold text-charcoal dark:text-gray-100">{monthlyGoals}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-center p-2 rounded-lg bg-pearl-gray dark:bg-gray-700"
            >
              <Award className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
              <p className="text-xs text-stone-gray dark:text-gray-400">Badges</p>
              <p className="text-sm font-bold text-charcoal dark:text-gray-100">8</p>
            </motion.div>
          </div>

          {/* Motivational message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center"
          >
            <p className="text-xs text-stone-gray dark:text-gray-400">
              {progressPercentage >= 80
                ? "Amazing progress today! 🔥"
                : progressPercentage >= 50
                  ? "You're doing great! Keep going! 💪"
                  : "Every step counts! You've got this! ⭐"}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </MouseGlowEffect>
  )
}
