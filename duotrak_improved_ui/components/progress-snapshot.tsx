"use client"

import { motion } from "framer-motion"
import { Trophy, Target, Award, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import MouseGlowEffect from "./mouse-glow-effect"

interface Badge {
  id: string
  name: string
  icon: string
  description: string
  earned: string
}

interface ProgressSnapshotProps {
  longestStreak: number
  totalTasksCompleted: number
  goalsConquered: number
  badges: Badge[]
}

export default function ProgressSnapshot({
  longestStreak,
  totalTasksCompleted,
  goalsConquered,
  badges,
}: ProgressSnapshotProps) {
  const handleViewAllBadges = () => {
    // Navigate to Progress & Stats page, achievements section
    window.location.href = "/progress#achievements"
  }

  const metrics = [
    {
      label: "Longest Streak",
      value: `${longestStreak} Days`,
      icon: Trophy,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      label: "Tasks Completed",
      value: totalTasksCompleted.toLocaleString(),
      icon: Target,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Goals Conquered",
      value: goalsConquered.toString(),
      icon: Award,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-charcoal dark:text-gray-100 mb-2">Your Progress</h2>
        <p className="text-stone-gray dark:text-gray-300">A quick look at your achievements</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <MouseGlowEffect key={metric.label} glowColor="#19A1E5" intensity="low">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`${metric.bgColor} rounded-xl p-6 border border-cool-gray dark:border-gray-600 transition-all duration-200`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-charcoal dark:text-gray-100">{metric.value}</p>
                    <p className="text-sm text-stone-gray dark:text-gray-300">{metric.label}</p>
                  </div>
                </div>
              </motion.div>
            </MouseGlowEffect>
          )
        })}
      </div>

      {/* Badges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-charcoal dark:text-gray-100">Your Badges</h3>
          <Button
            onClick={handleViewAllBadges}
            variant="outline"
            size="sm"
            className="text-primary-blue border-primary-blue hover:bg-primary-blue hover:text-white bg-transparent"
          >
            View All Badges
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {badges.map((badge, index) => (
            <MouseGlowEffect key={badge.id} glowColor="#19A1E5" intensity="low">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.05, y: -2 }}
                className="bg-pearl-gray dark:bg-gray-700 rounded-xl p-4 text-center border border-cool-gray dark:border-gray-600 hover:border-primary-blue dark:hover:border-primary-blue transition-all duration-200 cursor-pointer group"
                title={badge.description}
              >
                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
                  {badge.icon}
                </div>
                <p className="text-xs font-medium text-charcoal dark:text-gray-100 line-clamp-2">{badge.name}</p>
              </motion.div>
            </MouseGlowEffect>
          ))}
        </div>

        {badges.length === 0 && (
          <div className="text-center py-8">
            <Award className="w-12 h-12 text-stone-gray dark:text-gray-400 mx-auto mb-3 opacity-50" />
            <p className="text-stone-gray dark:text-gray-400">No badges earned yet</p>
            <p className="text-sm text-stone-gray dark:text-gray-400 mt-1">
              Complete tasks and goals to earn your first badge!
            </p>
          </div>
        )}
      </motion.div>
    </motion.section>
  )
}
