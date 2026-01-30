"use client"

import type React from "react"

import { motion, type Variants } from "framer-motion"
import { Eye, CheckCircle, UserCheck, Calendar, MessageSquare, Award, AlertCircle } from "lucide-react"

interface ActivityItem {
  id: string
  type: "completion" | "invitation" | "deadline" | "achievement" | "verification"
  message: string
  timestamp: string
  icon: React.ComponentType<any>
}

interface ActivityFeedProps {
  pendingVerifications?: number
  activities?: ActivityItem[]
}

export default function ActivityFeed({
  pendingVerifications = 1,
  activities = [
    {
      id: "1",
      type: "completion",
      message: 'John marked "Morning Workout" as complete',
      timestamp: "5 mins ago",
      icon: CheckCircle,
    },
    {
      id: "2",
      type: "invitation",
      message: "You accepted Sarah's partnership invitation!",
      timestamp: "2 hours ago",
      icon: UserCheck,
    },
    {
      id: "3",
      type: "deadline",
      message: 'Goal "Read 30 pages" due in 3 days',
      timestamp: "yesterday",
      icon: Calendar,
    },
    {
      id: "4",
      type: "achievement",
      message: 'You earned the "Week Warrior" badge!',
      timestamp: "2 days ago",
      icon: Award,
    },
    {
      id: "5",
      type: "verification",
      message: 'Partner completed "Daily Meditation"',
      timestamp: "3 days ago",
      icon: MessageSquare,
    },
  ],
}: ActivityFeedProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
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

  const activityItemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut" as const,
      },
    },
  }

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
    >
      <motion.h2 variants={itemVariants} className="text-xl font-bold text-charcoal dark:text-gray-100 mb-6">
        Recent Activity
      </motion.h2>

      <div className="space-y-4">
        {/* Verification Queue Highlight */}
        {pendingVerifications > 0 && (
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            className="bg-accent-light-blue dark:bg-primary-blue/10 border border-primary-blue/20 dark:border-primary-blue/30 rounded-lg p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                  <AlertCircle className="w-5 h-5 text-primary-blue" />
                </motion.div>
                <div>
                  <p className="text-charcoal dark:text-gray-100 font-medium">
                    Your partner has {pendingVerifications} task{pendingVerifications !== 1 ? "s" : ""} waiting for your
                    review
                  </p>
                  <p className="text-stone-gray dark:text-gray-300 text-sm">Review and verify completed tasks</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 bg-primary-blue hover:bg-primary-blue-hover text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                <Eye className="w-4 h-4" />
                <span>View Queue</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Activity List */}
        <motion.div variants={itemVariants} className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = activity.icon
            return (
              <motion.div
                key={activity.id}
                variants={activityItemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.01, backgroundColor: "rgba(240, 243, 244, 0.5)" }}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-pearl-gray dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <Icon
                    className={`w-4 h-4 ${activity.type === "completion"
                        ? "text-green-500"
                        : activity.type === "invitation"
                          ? "text-primary-blue"
                          : activity.type === "deadline"
                            ? "text-orange-500"
                            : activity.type === "achievement"
                              ? "text-yellow-500"
                              : "text-stone-gray dark:text-gray-400"
                      }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-charcoal dark:text-gray-100 text-sm font-medium leading-relaxed">
                    {activity.message}
                  </p>
                  <p className="text-stone-gray dark:text-gray-400 text-xs mt-1">{activity.timestamp}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* View All Activity Link */}
        <motion.div variants={itemVariants} className="pt-2 border-t border-cool-gray dark:border-gray-600">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-primary-blue hover:text-primary-blue-hover font-medium text-sm transition-colors"
          >
            View all activity →
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  )
}
