"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Bell, Check, X, Users, AlertTriangle, Eye, MessageSquare, Award, ExternalLink } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import MouseGlowEffect from "./mouse-glow-effect"

interface Notification {
  id: string
  type:
    | "task-verified"
    | "task-proof-requested"
    | "task-rejected"
    | "task-resubmitted"
    | "task-skipped-after-request"
    | "goal-invitation"
    | "goal-accepted"
    | "goal-rejected"
    | "goal-milestone"
    | "partner-nudge"
  title: string
  message: string
  timestamp: string
  read: boolean
  actionable?: boolean
  partnerName?: string
  goalName?: string
  taskName?: string
  rejectionReason?: string
  nudgeMessage?: string
  proofRequestReason?: string
}

interface NotificationSystemProps {
  notifications?: Notification[]
  onMarkAsRead: (notificationId: string) => void
  onMarkAllAsRead: () => void
  onNotificationAction: (notificationId: string, action: string) => void
  onArchive: (notificationId: string) => void
  onSnooze: (notificationId: string, duration: string) => void
  onBulkAction: (notificationIds: string[], action: string) => void
}

export default function NotificationSystem({
  notifications = [
    {
      id: "1",
      type: "task-verified",
      title: "Task Verified ✅",
      message: "Your partner verified your completion of Morning Workout",
      timestamp: "5 minutes ago",
      read: false,
      partnerName: "John",
      taskName: "Morning Workout",
    },
    {
      id: "2",
      type: "task-proof-requested",
      title: "More Proof Requested",
      message: "Your partner requested more proof for your completion of Healthy Breakfast",
      timestamp: "1 hour ago",
      read: false,
      partnerName: "John",
      taskName: "Healthy Breakfast",
      proofRequestReason: "Image is unclear, could you take another photo?",
    },
    {
      id: "3",
      type: "goal-invitation",
      title: "New Shared Goal Invitation",
      message: "Sarah has invited you to a new shared goal: Morning Running Duo",
      timestamp: "2 hours ago",
      read: false,
      actionable: true,
      partnerName: "Sarah",
      goalName: "Morning Running Duo",
    },
    {
      id: "4",
      type: "goal-milestone",
      title: "Milestone Achieved! 🎉",
      message: "You and John achieved a major milestone for Learn Spanish Together!",
      timestamp: "3 hours ago",
      read: false,
      partnerName: "John",
      goalName: "Learn Spanish Together",
    },
    {
      id: "5",
      type: "partner-nudge",
      title: "Partner Nudge",
      message: "John sent you a nudge: 'Hey! Don't forget about your evening meditation 🧘‍♀️'",
      timestamp: "Yesterday",
      read: true,
      partnerName: "John",
      nudgeMessage: "Hey! Don't forget about your evening meditation 🧘‍♀️",
    },
  ],
  onMarkAsRead,
  onMarkAllAsRead,
  onNotificationAction,
  onArchive,
  onSnooze,
  onBulkAction,
}: NotificationSystemProps) {
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length
  const recentNotifications = notifications.slice(0, 5) // Show only 5 most recent in dropdown

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task-verified":
        return <Check className="w-5 h-5 text-green-500" />
      case "task-proof-requested":
        return <Eye className="w-5 h-5 text-orange-500" />
      case "task-rejected":
        return <X className="w-5 h-5 text-error-red" />
      case "task-resubmitted":
        return <Eye className="w-5 h-5 text-primary-blue" />
      case "task-skipped-after-request":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case "goal-invitation":
      case "goal-accepted":
      case "goal-rejected":
        return <Users className="w-5 h-5 text-primary-blue" />
      case "goal-milestone":
        return <Award className="w-5 h-5 text-yellow-500" />
      case "partner-nudge":
        return <MessageSquare className="w-5 h-5 text-purple-500" />
      default:
        return <Bell className="w-5 h-5 text-stone-gray dark:text-gray-400" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "task-verified":
      case "goal-accepted":
      case "goal-milestone":
        return "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
      case "task-proof-requested":
      case "task-skipped-after-request":
        return "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20"
      case "task-rejected":
      case "goal-rejected":
        return "border-error-red/20 bg-error-red/5 dark:bg-error-red/10"
      case "goal-invitation":
      case "task-resubmitted":
        return "border-primary-blue/20 bg-accent-light-blue dark:bg-primary-blue/10"
      case "partner-nudge":
        return "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20"
      default:
        return "border-cool-gray dark:border-gray-600"
    }
  }

  const getNotificationPriority = (type: string) => {
    // High priority notifications appear with special styling
    const highPriority = ["goal-invitation", "task-proof-requested", "partner-nudge", "goal-milestone"]
    return highPriority.includes(type)
  }

  const handleViewAllNotifications = () => {
    // Navigate to notification center
    window.location.href = "/notifications"
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-pearl-gray dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-6 h-6 text-stone-gray dark:text-gray-300" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-error-red text-white rounded-full flex items-center justify-center text-xs font-bold"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-cool-gray dark:border-gray-700 z-50 max-h-[32rem] overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-cool-gray dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-charcoal dark:text-gray-100">Recent Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={onMarkAllAsRead}
                        className="text-sm text-primary-blue hover:text-primary-blue-hover transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleViewAllNotifications}
                      className="text-primary-blue hover:text-primary-blue-hover"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View All
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {recentNotifications.length > 0 ? (
                  <div className="p-2">
                    {recentNotifications.map((notification, index) => (
                      <MouseGlowEffect
                        key={notification.id}
                        glowColor={
                          !notification.read && getNotificationPriority(notification.type) ? "#19A1E5" : "#9CA3AF"
                        }
                        intensity={!notification.read && getNotificationPriority(notification.type) ? "medium" : "low"}
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-lg border mb-2 cursor-pointer transition-all ${
                            !notification.read
                              ? getNotificationColor(notification.type)
                              : "border-cool-gray dark:border-gray-600 opacity-75"
                          } ${getNotificationPriority(notification.type) && !notification.read ? "ring-2 ring-primary-blue/20" : ""}`}
                          onClick={() => {
                            if (!notification.read) {
                              onMarkAsRead(notification.id)
                            }
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            {/* Icon */}
                            <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className="font-medium text-charcoal dark:text-gray-100 text-sm">
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-primary-blue rounded-full flex-shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-sm text-stone-gray dark:text-gray-300 mt-1 leading-relaxed line-clamp-2">
                                {notification.message}
                              </p>

                              <p className="text-xs text-stone-gray dark:text-gray-400 mt-2">
                                {notification.timestamp}
                              </p>

                              {/* Action Buttons */}
                              {notification.actionable && notification.type === "goal-invitation" && (
                                <div className="flex space-x-2 mt-3">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onNotificationAction(notification.id, "accept")
                                    }}
                                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors"
                                  >
                                    Accept
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onNotificationAction(notification.id, "reject")
                                    }}
                                    className="px-3 py-1 border border-error-red text-error-red hover:bg-error-red hover:text-white rounded text-xs font-medium transition-colors"
                                  >
                                    Reject
                                  </motion.button>
                                </div>
                              )}

                              {notification.type === "task-proof-requested" && (
                                <div className="flex space-x-2 mt-3">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onNotificationAction(notification.id, "resubmit")
                                    }}
                                    className="px-3 py-1 bg-primary-blue hover:bg-primary-blue-hover text-white rounded text-xs font-medium transition-colors"
                                  >
                                    Resubmit Proof
                                  </motion.button>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </MouseGlowEffect>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-stone-gray dark:text-gray-400">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No notifications yet</p>
                    <p className="text-sm mt-1">Partner activities will appear here</p>
                  </div>
                )}
              </div>

              {/* Footer with View All Link */}
              {notifications.length > 5 && (
                <div className="p-3 border-t border-cool-gray dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleViewAllNotifications}
                    className="w-full text-primary-blue hover:text-primary-blue-hover hover:bg-primary-blue/10"
                  >
                    View All {notifications.length} Notifications
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
