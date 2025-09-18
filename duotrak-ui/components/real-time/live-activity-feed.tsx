"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Trophy, Flame, Activity, Heart, Zap, Clock, X, RefreshCw } from "lucide-react"
import { useState } from "react"
import { useRealTimePartner } from "@/hooks/use-real-time-partner"

interface LiveActivityFeedProps {
  partnerId: string
  partnerName: string
  partnerAvatar: string
  maxItems?: number
  autoHide?: boolean
  className?: string
}

export function LiveActivityFeed({
  partnerId,
  partnerName,
  partnerAvatar,
  maxItems = 5,
  autoHide = true,
  className = "",
}: LiveActivityFeedProps) {
  const { recentUpdates, isConnected, clearRecentUpdates, syncWithPartner } = useRealTimePartner({
    partnerId,
    partnerName,
    enableNotifications: true,
    enableMascotInteractions: true,
  })

  const [isVisible, setIsVisible] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncWithPartner()
    } finally {
      setIsSyncing(false)
    }
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case "task_completed":
        return CheckCircle2
      case "goal_achieved":
        return Trophy
      case "streak_milestone":
        return Flame
      case "activity_started":
        return Activity
      case "mood_change":
        return Heart
      default:
        return Zap
    }
  }

  const getUpdateColor = (type: string) => {
    switch (type) {
      case "task_completed":
        return "text-green-500 bg-green-100 dark:bg-green-900/30"
      case "goal_achieved":
        return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30"
      case "streak_milestone":
        return "text-orange-500 bg-orange-100 dark:bg-orange-900/30"
      case "activity_started":
        return "text-blue-500 bg-blue-100 dark:bg-blue-900/30"
      case "mood_change":
        return "text-pink-500 bg-pink-100 dark:bg-pink-900/30"
      default:
        return "text-primary bg-primary/10"
    }
  }

  const getUpdateMessage = (update: any) => {
    switch (update.type) {
      case "task_completed":
        return `Completed "${update.data.taskName}"`
      case "goal_achieved":
        return `Achieved: ${update.data.goalName}`
      case "streak_milestone":
        return `Hit a ${update.data.streakCount}-day streak!`
      case "activity_started":
        return `Started ${update.data.activity}`
      case "mood_change":
        return `Feeling ${update.data.mood}`
      default:
        return "New activity"
    }
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    return `${Math.floor(diffInHours / 24)}d ago`
  }

  if (!isVisible || recentUpdates.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-card border border-border rounded-xl p-4 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}>
            <Zap className="w-4 h-4 text-primary" />
          </motion.div>
          <h3 className="text-sm font-medium text-foreground">Live Updates</h3>
          {!isConnected && <span className="text-xs text-destructive">(Offline)</span>}
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSync}
            disabled={isSyncing}
            className="p-1 hover:bg-muted rounded-full transition-colors"
            title="Sync updates"
          >
            <motion.div
              animate={isSyncing ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: isSyncing ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}
            >
              <RefreshCw className="w-3 h-3 text-muted-foreground" />
            </motion.div>
          </motion.button>

          {autoHide && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-muted rounded-full transition-colors"
              title="Hide updates"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Updates List */}
      <div className="space-y-3">
        <AnimatePresence>
          {recentUpdates.slice(0, maxItems).map((update, index) => {
            const Icon = getUpdateIcon(update.type)
            const colorClasses = getUpdateColor(update.type)

            return (
              <motion.div
                key={update.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                {/* Avatar */}
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src={partnerAvatar}
                  alt={partnerName}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                />

                {/* Update Icon */}
                <div className={`p-1 rounded-full ${colorClasses} flex-shrink-0`}>
                  <Icon className="w-3 h-3" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-relaxed">{getUpdateMessage(update)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{formatTimestamp(update.timestamp)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {recentUpdates.length > maxItems && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">+{recentUpdates.length - maxItems} more updates</p>
        </div>
      )}

      {recentUpdates.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearRecentUpdates}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
          >
            Clear all updates
          </motion.button>
        </div>
      )}
    </motion.div>
  )
}
