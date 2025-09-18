"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Award,
  MessageSquare,
  Target,
  Zap,
  Heart,
  File as Fire,
  Sparkles,
  MessageCircle,
  Clock,
  TrendingUp,
  BookOpen,
  Dumbbell,
  Coffee,
} from "lucide-react"
import { useState } from "react"
import MouseGlowEffect from "./mouse-glow-effect"

interface ActivityItem {
  id: string
  type:
    | "task-completion"
    | "reflection"
    | "system-update"
    | "achievement"
    | "duo-challenge"
    | "streak-milestone"
    | "goal-progress"
  timestamp: Date
  summary: string
  details?: {
    taskName?: string
    goalName?: string
    notes?: string
    photo?: string
    badgeName?: string
    challengeText?: string
    streakCount?: number
    progressPercentage?: number
    category?: string
  }
  reactions?: {
    userId: string
    emoji: string
    timestamp: Date
  }[]
  comments?: {
    userId: string
    text: string
    timestamp: Date
  }[]
  partner: {
    name: string
    avatar: string
    mood?: "excited" | "focused" | "accomplished" | "motivated" | "tired"
  }
}

interface RichActivityCardProps {
  activity: ActivityItem
  onReaction: (activityId: string, emoji: string) => void
  onComment: (activityId: string) => void
  onDoubleClick: (activityId: string) => void
}

const QUICK_REACTIONS = ["❤️", "🔥", "💪", "🎉", "👏", "✨", "🚀", "😍"]

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "fitness":
      return Dumbbell
    case "learning":
      return BookOpen
    case "work":
      return Coffee
    case "health":
      return Heart
    case "personal":
      return Sparkles
    default:
      return Target
  }
}

const getCategoryGradient = (category: string) => {
  switch (category) {
    case "fitness":
      return "from-red-400 to-pink-500"
    case "learning":
      return "from-blue-400 to-indigo-500"
    case "work":
      return "from-purple-400 to-violet-500"
    case "health":
      return "from-green-400 to-emerald-500"
    case "personal":
      return "from-yellow-400 to-orange-500"
    default:
      return "from-primary to-secondary"
  }
}

const getMoodEmoji = (mood: string) => {
  switch (mood) {
    case "excited":
      return "🤩"
    case "focused":
      return "😤"
    case "accomplished":
      return "😌"
    case "motivated":
      return "💪"
    case "tired":
      return "😴"
    default:
      return "😊"
  }
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  return date.toLocaleDateString()
}

export default function RichActivityCard({ activity, onReaction, onComment, onDoubleClick }: RichActivityCardProps) {
  const [showReactions, setShowReactions] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [showFullNotes, setShowFullNotes] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleDoubleClick = () => {
    setIsLiked(true)
    onReaction(activity.id, "❤️")
    onDoubleClick(activity.id)

    // Reset like animation after delay
    setTimeout(() => setIsLiked(false), 1000)
  }

  const getActivityIcon = () => {
    switch (activity.type) {
      case "achievement":
        return (
          <div
            className={`w-12 h-12 bg-gradient-to-r ${getCategoryGradient("personal")} rounded-full flex items-center justify-center shadow-lg`}
          >
            <Award className="h-6 w-6 text-white" />
          </div>
        )
      case "task-completion":
        const category = activity.details?.category || "personal"
        const IconComponent = getCategoryIcon(category)
        return (
          <div
            className={`w-12 h-12 bg-gradient-to-r ${getCategoryGradient(category)} rounded-full flex items-center justify-center shadow-lg`}
          >
            <IconComponent className="h-6 w-6 text-white" />
          </div>
        )
      case "duo-challenge":
        return (
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
        )
      case "streak-milestone":
        return (
          <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
            <Fire className="h-6 w-6 text-white" />
          </div>
        )
      case "goal-progress":
        return (
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
        )
      case "reflection":
        return (
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
        )
      default:
        return (
          <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
            <Target className="h-6 w-6 text-white" />
          </div>
        )
    }
  }

  const getCardBackground = () => {
    switch (activity.type) {
      case "achievement":
        return "bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 border-yellow-200 dark:border-yellow-800"
      case "duo-challenge":
        return "bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-rose-900/20 border-purple-200 dark:border-purple-800"
      case "streak-milestone":
        return "bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-orange-900/20 dark:via-red-900/20 dark:to-pink-900/20 border-orange-200 dark:border-orange-800"
      case "goal-progress":
        return "bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 border-green-200 dark:border-green-800"
      default:
        return "bg-card border-border hover:border-primary/30"
    }
  }

  return (
    <MouseGlowEffect glowColor="hsl(var(--primary))" intensity="medium">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -4 }}
        onDoubleClick={handleDoubleClick}
        className={`relative overflow-hidden rounded-2xl border p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer ${getCardBackground()}`}
      >
        {/* Double-click heart animation */}
        <AnimatePresence>
          {isLiked && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
            >
              <Heart className="w-16 h-16 text-red-500 fill-current" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Activity Icon */}
          <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }} className="flex-shrink-0">
            {getActivityIcon()}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  src={activity.partner.avatar}
                  alt={activity.partner.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-background shadow-sm"
                />
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{activity.partner.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(activity.timestamp)}</span>
                    {activity.partner.mood && <span className="text-sm">{getMoodEmoji(activity.partner.mood)}</span>}
                  </div>
                </div>
              </div>

              {/* Activity type badge */}
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  activity.type === "achievement"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : activity.type === "duo-challenge"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                      : activity.type === "streak-milestone"
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                        : "bg-primary/10 text-primary"
                }`}
              >
                {activity.type.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </motion.span>
            </div>

            {/* Summary */}
            <p className="text-foreground font-medium mb-3 leading-relaxed">{activity.summary}</p>

            {/* Special content based on activity type */}
            {activity.type === "achievement" && activity.details?.badgeName && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl p-4 mb-4 border border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-yellow-800 dark:text-yellow-200">{activity.details.badgeName}</h4>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">New achievement unlocked!</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activity.type === "streak-milestone" && activity.details?.streakCount && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-xl p-4 mb-4 border border-orange-200 dark:border-orange-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <Fire className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-800 dark:text-orange-200">
                      {activity.details.streakCount} Day Streak!
                    </h4>
                    <p className="text-orange-700 dark:text-orange-300 text-sm">Consistency is key! 🔥</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activity.type === "duo-challenge" && activity.details?.challengeText && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl p-4 mb-4 border border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Duo Challenge</h4>
                    <p className="text-purple-700 dark:text-purple-300 text-sm mb-3">
                      {activity.details.challengeText}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-sm"
                    >
                      Accept Challenge ⚡
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {activity.type === "goal-progress" && activity.details?.progressPercentage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-xl p-4 mb-4 border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Goal Progress</h4>
                  <span className="text-green-700 dark:text-green-300 font-bold">
                    {activity.details.progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${activity.details.progressPercentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                  />
                </div>
              </motion.div>
            )}

            {/* Notes */}
            {activity.details?.notes && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card/80 backdrop-blur-sm rounded-xl p-4 mb-4 border border-border"
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p
                      className={`text-foreground text-sm leading-relaxed ${
                        !showFullNotes && activity.details.notes.length > 150 ? "line-clamp-3" : ""
                      }`}
                    >
                      {activity.details.notes}
                    </p>
                    {activity.details.notes.length > 150 && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setShowFullNotes(!showFullNotes)}
                        className="text-primary hover:text-primary/80 text-sm font-medium mt-1"
                      >
                        {showFullNotes ? "Show less" : "Read more"}
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Photo */}
            {activity.details?.photo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: imageLoaded ? 1 : 0.5, scale: imageLoaded ? 1 : 0.9 }}
                className="mb-4"
              >
                <img
                  src={activity.details.photo || "/placeholder.svg"}
                  alt="Activity photo"
                  className="w-full max-w-sm h-48 object-cover rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onLoad={() => setImageLoaded(true)}
                  onClick={() => {
                    // Handle image expansion
                  }}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Reactions and Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            {/* Existing reactions */}
            {activity.reactions && activity.reactions.length > 0 && (
              <div className="flex items-center gap-1">
                {activity.reactions.slice(0, 3).map((reaction, index) => (
                  <motion.span
                    key={index}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-lg"
                  >
                    {reaction.emoji}
                  </motion.span>
                ))}
                {activity.reactions.length > 3 && (
                  <span className="text-sm text-muted-foreground ml-1">+{activity.reactions.length - 3}</span>
                )}
              </div>
            )}

            {/* Quick reactions */}
            <div className="flex items-center gap-1">
              {QUICK_REACTIONS.slice(0, 4).map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onReaction(activity.id, emoji)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <span className="text-base">{emoji}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Comment button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onComment(activity.id)}
            className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors text-sm font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            Comment
          </motion.button>
        </div>

        {/* Comments preview */}
        {activity.comments && activity.comments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 pt-4 border-t border-border"
          >
            <div className="space-y-2">
              {activity.comments.slice(0, 2).map((comment, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-muted rounded-lg p-3"
                >
                  <p className="text-sm text-foreground">{comment.text}</p>
                  <span className="text-xs text-muted-foreground mt-1">{formatTimeAgo(comment.timestamp)}</span>
                </motion.div>
              ))}
              {activity.comments.length > 2 && (
                <button className="text-sm text-primary hover:text-primary/80 font-medium">
                  View all {activity.comments.length} comments
                </button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </MouseGlowEffect>
  )
}
