"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  Check,
  X,
  Users,
  AlertTriangle,
  Eye,
  MessageSquare,
  Award,
  Archive,
  Settings,
  Search,
  Clock,
  CheckCheck,
  Target,
  TrendingUp,
  Zap,
  Star,
} from "lucide-react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
    | "daily-reminder"
    | "overdue-task"
    | "streak-milestone"
    | "goal-completion"
    | "weekly-summary"
    | "shared-goal-update"
    | "partner-achievement"
    | "verification-reminder"
  category: "task" | "partner" | "progress" | "system"
  title: string
  message: string
  timestamp: string
  read: boolean
  archived: boolean
  snoozedUntil?: string
  actionable?: boolean
  partnerName?: string
  goalName?: string
  taskName?: string
  rejectionReason?: string
  nudgeMessage?: string
  proofRequestReason?: string
  priority: "low" | "medium" | "high"
  relatedData?: any
}

interface NotificationCenterProps {
  onMarkAsRead: (notificationId: string) => void
  onMarkAllAsRead: () => void
  onArchive: (notificationId: string) => void
  onSnooze: (notificationId: string, duration: string) => void
  onNotificationAction: (notificationId: string, action: string) => void
  onBulkAction: (notificationIds: string[], action: string) => void
}

export default function NotificationCenter({
  onMarkAsRead,
  onMarkAllAsRead,
  onArchive,
  onSnooze,
  onNotificationAction,
  onBulkAction,
}: NotificationCenterProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [showArchived, setShowArchived] = useState(false)

  // Mock notifications data - in real app this would come from props or API
  const [notifications] = useState<Notification[]>([
    {
      id: "1",
      type: "task-verified",
      category: "task",
      title: "Task Verified ✅",
      message: "Your partner verified your completion of Morning Workout",
      timestamp: "2024-01-15T09:30:00Z",
      read: false,
      archived: false,
      priority: "medium",
      partnerName: "John",
      taskName: "Morning Workout",
    },
    {
      id: "2",
      type: "task-proof-requested",
      category: "task",
      title: "More Proof Requested",
      message: "Your partner requested more proof for your completion of Healthy Breakfast",
      timestamp: "2024-01-15T08:00:00Z",
      read: false,
      archived: false,
      priority: "high",
      actionable: true,
      partnerName: "John",
      taskName: "Healthy Breakfast",
      proofRequestReason: "Image is unclear, could you take another photo?",
    },
    {
      id: "3",
      type: "goal-invitation",
      category: "partner",
      title: "New Shared Goal Invitation",
      message: "Sarah has invited you to a new shared goal: Morning Running Duo",
      timestamp: "2024-01-15T07:00:00Z",
      read: false,
      archived: false,
      priority: "high",
      actionable: true,
      partnerName: "Sarah",
      goalName: "Morning Running Duo",
    },
    {
      id: "4",
      type: "streak-milestone",
      category: "progress",
      title: "7-Day Streak Achieved! 🔥",
      message: "Congratulations! You've maintained your meditation streak for 7 days straight!",
      timestamp: "2024-01-14T20:00:00Z",
      read: false,
      archived: false,
      priority: "medium",
      goalName: "Daily Meditation",
    },
    {
      id: "5",
      type: "partner-nudge",
      category: "partner",
      title: "Partner Nudge",
      message: "John sent you a nudge: 'Hey! Don't forget about your evening meditation 🧘‍♀️'",
      timestamp: "2024-01-14T18:30:00Z",
      read: true,
      archived: false,
      priority: "low",
      partnerName: "John",
      nudgeMessage: "Hey! Don't forget about your evening meditation 🧘‍♀️",
    },
    {
      id: "6",
      type: "daily-reminder",
      category: "system",
      title: "Daily Reminder",
      message: "Time for your afternoon reading session! 📚",
      timestamp: "2024-01-14T15:00:00Z",
      read: true,
      archived: false,
      priority: "low",
      taskName: "Daily Reading",
    },
    {
      id: "7",
      type: "goal-completion",
      category: "progress",
      title: "Goal Completed! 🎉",
      message: "Amazing! You've successfully completed your 30-Day Fitness Challenge!",
      timestamp: "2024-01-13T22:00:00Z",
      read: true,
      archived: false,
      priority: "high",
      goalName: "30-Day Fitness Challenge",
    },
    {
      id: "8",
      type: "overdue-task",
      category: "task",
      title: "Gentle Reminder",
      message: "Your morning journaling is overdue, but it's never too late to start! ✨",
      timestamp: "2024-01-13T12:00:00Z",
      read: true,
      archived: false,
      priority: "medium",
      taskName: "Morning Journaling",
    },
  ])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task-verified":
        return <Check className="w-5 h-5 text-green-500" />
      case "task-proof-requested":
        return <Eye className="w-5 h-5 text-orange-500" />
      case "task-rejected":
        return <X className="w-5 h-5 text-red-500" />
      case "task-resubmitted":
        return <Eye className="w-5 h-5 text-blue-500" />
      case "task-skipped-after-request":
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case "goal-invitation":
      case "goal-accepted":
      case "goal-rejected":
        return <Users className="w-5 h-5 text-blue-500" />
      case "goal-milestone":
      case "goal-completion":
        return <Award className="w-5 h-5 text-yellow-500" />
      case "partner-nudge":
        return <MessageSquare className="w-5 h-5 text-purple-500" />
      case "daily-reminder":
      case "overdue-task":
        return <Clock className="w-5 h-5 text-blue-500" />
      case "streak-milestone":
        return <Zap className="w-5 h-5 text-orange-500" />
      case "weekly-summary":
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case "shared-goal-update":
        return <Target className="w-5 h-5 text-blue-500" />
      case "partner-achievement":
        return <Star className="w-5 h-5 text-yellow-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "high") {
      return "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
    }

    switch (type) {
      case "task-verified":
      case "goal-accepted":
      case "goal-milestone":
      case "goal-completion":
      case "streak-milestone":
        return "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
      case "task-proof-requested":
      case "task-skipped-after-request":
      case "overdue-task":
        return "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20"
      case "task-rejected":
      case "goal-rejected":
        return "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
      case "goal-invitation":
      case "task-resubmitted":
      case "shared-goal-update":
        return "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
      case "partner-nudge":
      case "partner-achievement":
        return "border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20"
      default:
        return "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/20"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return "Yesterday"
    return date.toLocaleDateString()
  }

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (notification.archived && !showArchived) return false

      if (selectedCategory !== "all" && notification.category !== selectedCategory) return false

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query) ||
          notification.partnerName?.toLowerCase().includes(query) ||
          notification.goalName?.toLowerCase().includes(query) ||
          notification.taskName?.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [notifications, selectedCategory, searchQuery, showArchived])

  const unreadCount = filteredNotifications.filter((n) => !n.read).length
  const categoryStats = {
    all: notifications.filter((n) => !n.archived).length,
    task: notifications.filter((n) => n.category === "task" && !n.archived).length,
    partner: notifications.filter((n) => n.category === "partner" && !n.archived).length,
    progress: notifications.filter((n) => n.category === "progress" && !n.archived).length,
    system: notifications.filter((n) => n.category === "system" && !n.archived).length,
  }

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId) ? prev.filter((id) => id !== notificationId) : [...prev, notificationId],
    )
  }

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id))
    }
  }

  const handleBulkAction = (action: string) => {
    onBulkAction(selectedNotifications, action)
    setSelectedNotifications([])
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Stay updated with your accountability journey</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                /* Open notification settings */
              }}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={showArchived ? "default" : "outline"}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                {showArchived ? "Hide Archived" : "Show Archived"}
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedNotifications.length} notification{selectedNotifications.length !== 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("mark-read")}>
                    <Check className="w-4 h-4 mr-1" />
                    Mark Read
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction("archive")}>
                    <Archive className="w-4 h-4 mr-1" />
                    Archive
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedNotifications([])}>
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              <Badge variant="secondary" className="text-xs">
                {categoryStats.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="task" className="flex items-center gap-2">
              Tasks
              <Badge variant="secondary" className="text-xs">
                {categoryStats.task}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="partner" className="flex items-center gap-2">
              Partner
              <Badge variant="secondary" className="text-xs">
                {categoryStats.partner}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              Progress
              <Badge variant="secondary" className="text-xs">
                {categoryStats.progress}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              System
              <Badge variant="secondary" className="text-xs">
                {categoryStats.system}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-4">
            {/* Select All Checkbox */}
            {filteredNotifications.length > 0 && (
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Checkbox
                  checked={selectedNotifications.length === filteredNotifications.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Select all notifications</span>
                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onMarkAllAsRead}
                    className="ml-auto text-blue-600 hover:text-blue-700"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Mark all as read
                  </Button>
                )}
              </div>
            )}

            {/* Notifications List */}
            <AnimatePresence>
              {filteredNotifications.length > 0 ? (
                <div className="space-y-3">
                  {filteredNotifications.map((notification, index) => (
                    <MouseGlowEffect
                      key={notification.id}
                      glowColor={notification.priority === "high" ? "#EF4444" : "#6B7280"}
                      intensity={notification.priority === "high" ? "medium" : "low"}
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          !notification.read
                            ? getNotificationColor(notification.type, notification.priority)
                            : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 opacity-75"
                        } ${
                          notification.priority === "high" && !notification.read
                            ? "ring-2 ring-red-200 dark:ring-red-800"
                            : ""
                        } ${
                          selectedNotifications.includes(notification.id)
                            ? "ring-2 ring-blue-500 dark:ring-blue-400"
                            : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Selection Checkbox */}
                          <Checkbox
                            checked={selectedNotifications.includes(notification.id)}
                            onCheckedChange={() => handleSelectNotification(notification.id)}
                            onClick={(e) => e.stopPropagation()}
                          />

                          {/* Icon */}
                          <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                  {notification.title}
                                </h4>
                                {notification.priority === "high" && (
                                  <Badge variant="destructive" className="text-xs">
                                    High Priority
                                  </Badge>
                                )}
                                {notification.archived && (
                                  <Badge variant="outline" className="text-xs">
                                    Archived
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                )}
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                              {notification.message}
                            </p>

                            {/* Additional Details */}
                            {notification.rejectionReason && (
                              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs">
                                <span className="font-medium text-red-700 dark:text-red-300">Reason:</span>{" "}
                                <span className="text-red-600 dark:text-red-400">{notification.rejectionReason}</span>
                              </div>
                            )}

                            {notification.proofRequestReason && (
                              <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-xs">
                                <span className="font-medium text-orange-700 dark:text-orange-300">Reason:</span>{" "}
                                <span className="text-orange-600 dark:text-orange-400">
                                  {notification.proofRequestReason}
                                </span>
                              </div>
                            )}

                            {notification.nudgeMessage && (
                              <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded text-xs">
                                <span className="font-medium text-purple-700 dark:text-purple-300">Message:</span>{" "}
                                <span className="text-purple-600 dark:text-purple-400">
                                  "{notification.nudgeMessage}"
                                </span>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex gap-2">
                                {notification.actionable && notification.type === "goal-invitation" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onNotificationAction(notification.id, "accept")
                                      }}
                                      className="bg-green-500 hover:bg-green-600 text-white"
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onNotificationAction(notification.id, "reject")
                                      }}
                                      className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                    >
                                      Reject
                                    </Button>
                                  </>
                                )}

                                {notification.type === "task-proof-requested" && (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onNotificationAction(notification.id, "resubmit")
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                  >
                                    Resubmit Proof
                                  </Button>
                                )}
                              </div>

                              {/* Quick Actions */}
                              <div className="flex gap-1">
                                {!notification.read && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onMarkAsRead(notification.id)
                                    }}
                                    className="p-1 h-auto"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onArchive(notification.id)
                                  }}
                                  className="p-1 h-auto"
                                >
                                  <Archive className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </MouseGlowEffect>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      {searchQuery ? "No matching notifications" : "No notifications"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchQuery
                        ? "Try adjusting your search terms or filters"
                        : selectedCategory === "all"
                          ? "You're all caught up! New notifications will appear here."
                          : `No ${selectedCategory} notifications at the moment.`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
