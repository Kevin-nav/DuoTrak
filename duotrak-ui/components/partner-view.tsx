"use client"

import { motion, AnimatePresence } from "framer-motion"
import React from "react"
import {
  MessageCircle,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  FileText,
  X,
  Send,
  Target,
  MessageSquare,
  Smile,
  Plus,
  File,
  Check,
  CheckCheck,
  Download,
  Play,
  ImageIcon,
  Reply,
  Hand,
  WifiOff,
  RefreshCw,
  AlertCircle,
  Loader2,
  Heart,
  Sparkles,
  Coffee,
  Sun,
  Moon,
  Utensils,
  Dumbbell,
  Book,
  Activity,
  Zap,
  Bell,
  BellOff,
} from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import MouseGlowEffect from "./mouse-glow-effect"
import DashboardLayout from "./dashboard-layout"
import RichActivityCard from "./rich-activity-card"
import ConversationStarters from "./conversation-starters"
import CelebrationAnimation from "./celebration-animation"
import QuickReplySuggestions from "./quick-reply-suggestions"
import { useMascot } from "@/contexts/mascot-context"

interface Task {
  id: string
  description: string
  scheduledTime?: string
  status: "todo" | "completed" | "skipped" | "awaiting-verification"
  timeScheduled?: Date
  progress?: {
    current: number
    total: number
    unit: string
  }
  attachments?: {
    photos?: string[]
    notes?: string
  }
  systemType?: "habit" | "goal" | "routine"
  category?: "fitness" | "learning" | "work" | "health" | "personal"
  difficulty?: "easy" | "medium" | "hard"
  mood?: "excited" | "neutral" | "stressed" | "motivated"
}

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

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  status: "sending" | "sent" | "delivered" | "read" | "failed"
  attachments?: {
    type: "image" | "video" | "document"
    url: string
    name: string
    size?: number
    thumbnail?: string
  }[]
  replyTo?: {
    messageId: string
    content: string
    senderName: string
  }
  reactions?: {
    userId: string
    emoji: string
  }[]
  isNudge?: boolean
  mood?: "happy" | "excited" | "stressed" | "motivated" | "tired"
}

interface PartnerInfo {
  id: string
  username: string
  profilePicture: string
  timezone: string
  localTime: string
  initials: string
  lastActive?: Date
  currentMood?: "energetic" | "focused" | "relaxed" | "motivated" | "tired"
  todayProgress?: number
  isOnline?: boolean
  currentActivity?: string
  streakCount?: number
  completedToday?: number
}

interface PartnerViewProps {
  partner?: PartnerInfo
  tasks?: Task[]
  activities?: ActivityItem[]
  messages?: ChatMessage[]
  unreadMessages?: number
  isPartnerTyping?: boolean
  isOnline?: boolean
  isLoading?: boolean
  error?: string | null
  lastUpdated?: Date
}

const NUDGE_MESSAGES = [
  "You're crushing it today! 🔥",
  "Thinking of you! 💭✨",
  "How's that goal going? 🎯",
  "Sending good vibes your way! ⚡",
  "You've got this, champion! 💪",
  "Just checking in! 👋😊",
  "Remember: progress over perfection! 🌟",
  "Your consistency is inspiring! 🚀",
]

const QUICK_REACTIONS = ["👍", "❤️", "🔥", "💪", "🎉", "✨", "👏", "🚀"]

const QUICK_REPLIES = [
  "Amazing work! 🎉",
  "You're on fire! 🔥",
  "So proud of you! ❤️",
  "Keep it up! 💪",
  "That's incredible! ✨",
  "You inspire me! 🌟",
]

const CONVERSATION_STARTERS = [
  "How are you feeling about today's goals?",
  "What's motivating you most right now?",
  "Any challenges I can help you with?",
  "What's been your biggest win this week?",
  "How can I support you better?",
]

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "fitness":
      return Dumbbell
    case "learning":
      return Book
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

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "easy":
      return "bg-green-500"
    case "medium":
      return "bg-yellow-500"
    case "hard":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

const getMoodEmoji = (mood: string) => {
  switch (mood) {
    case "excited":
      return "🤩"
    case "motivated":
      return "💪"
    case "stressed":
      return "😤"
    case "tired":
      return "😴"
    case "happy":
      return "😊"
    case "focused":
      return "🎯"
    case "energetic":
      return "⚡"
    case "relaxed":
      return "😌"
    default:
      return "😊"
  }
}

const getTimeIcon = (time: string) => {
  const hour = Number.parseInt(time.split(":")[0])
  if (hour >= 5 && hour < 12) return Sun
  if (hour >= 12 && hour < 17) return Coffee
  if (hour >= 17 && hour < 21) return Utensils
  return Moon
}

// Real-time connection status
const useRealTimeConnection = () => {
  const [isConnected, setIsConnected] = useState(true)
  const [lastHeartbeat, setLastHeartbeat] = useState(Date.now())

  useEffect(() => {
    // Simulate real-time connection with heartbeat
    const interval = setInterval(() => {
      // Simulate occasional connection issues
      if (Math.random() < 0.05) {
        setIsConnected(false)
        setTimeout(() => setIsConnected(true), 2000)
      }
      setLastHeartbeat(Date.now())
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return { isConnected, lastHeartbeat }
}

// Real-time partner activity simulation
const usePartnerActivity = (partnerId: string) => {
  const [recentActivity, setRecentActivity] = useState<string | null>(null)
  const [activityTimestamp, setActivityTimestamp] = useState<Date | null>(null)

  useEffect(() => {
    // Simulate partner activity updates
    const activities = [
      "just completed a task",
      "is working on a goal",
      "started a workout",
      "finished reading session",
      "completed meditation",
      "hit a new milestone",
    ]

    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        const activity = activities[Math.floor(Math.random() * activities.length)]
        setRecentActivity(activity)
        setActivityTimestamp(new Date())
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [partnerId])

  return { recentActivity, activityTimestamp }
}

export default function PartnerView({
  partner = {
    id: "partner-1",
    username: "John",
    profilePicture: "/placeholder.svg?height=60&width=60",
    timezone: "GMT-7",
    localTime: "4:15 PM",
    initials: "JD",
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    currentMood: "motivated",
    todayProgress: 75,
    isOnline: true,
    currentActivity: "Working on goals",
    streakCount: 7,
    completedToday: 3,
  },
  tasks = [
    {
      id: "task-1",
      description: "Morning Run (5km)",
      scheduledTime: "7:00 AM",
      status: "completed",
      timeScheduled: new Date(Date.now() - 8 * 60 * 60 * 1000),
      attachments: {
        photos: ["/placeholder.svg?height=200&width=300"],
        notes: "Perfect weather for running! Hit a new personal best.",
      },
      systemType: "habit",
      category: "fitness",
      difficulty: "medium",
      mood: "excited",
    },
    {
      id: "task-2",
      description: "Work Session: Project X",
      scheduledTime: "9:00 AM",
      status: "completed",
      progress: {
        current: 2,
        total: 2,
        unit: "hours",
      },
      systemType: "routine",
      category: "work",
      difficulty: "hard",
      mood: "focused",
    },
    {
      id: "task-3",
      description: "Language Learning - Spanish",
      scheduledTime: "2:00 PM",
      status: "awaiting-verification",
      progress: {
        current: 3,
        total: 5,
        unit: "lessons",
      },
      systemType: "habit",
      category: "learning",
      difficulty: "easy",
      mood: "motivated",
    },
    {
      id: "task-4",
      description: "Read 20 pages",
      scheduledTime: "8:00 PM",
      status: "todo",
      timeScheduled: new Date(Date.now() + 3 * 60 * 60 * 1000),
      systemType: "habit",
      category: "personal",
      difficulty: "easy",
    },
  ],
  activities = [
    {
      id: "activity-1",
      type: "achievement",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      summary: "Achievement Unlocked! John earned the 'Streak Starter: Gold' badge!",
      details: {
        badgeName: "Streak Starter: Gold",
      },
      reactions: [
        { userId: "current-user", emoji: "🔥" },
        { userId: "other-user", emoji: "👏" },
      ],
      partner: {
        name: "John",
        avatar: "/placeholder.svg?height=60&width=60",
        mood: "accomplished",
      },
    },
    {
      id: "activity-2",
      type: "task-completion",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      summary: "John completed 'Morning Run (5km)' for 'Daily Fitness'",
      details: {
        taskName: "Morning Run (5km)",
        goalName: "Daily Fitness",
        notes: "Perfect weather for running today! Hit a new personal best on the last kilometer.",
        photo: "/placeholder.svg?height=200&width=300",
        category: "fitness",
      },
      reactions: [{ userId: "current-user", emoji: "💪" }],
      comments: [
        {
          userId: "current-user",
          text: "Amazing work! That's dedication right there 🏃‍♂️",
          timestamp: new Date(Date.now() - 90 * 60 * 1000),
        },
      ],
      partner: {
        name: "John",
        avatar: "/placeholder.svg?height=60&width=60",
        mood: "excited",
      },
    },
  ],
  messages = [
    {
      id: "msg-1",
      senderId: "partner-1",
      senderName: "John",
      content: "Hey! Just finished my morning run. Feeling amazing! 🏃‍♂️",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: "read",
      attachments: [
        {
          type: "image",
          url: "/placeholder.svg?height=300&width=400",
          name: "morning-run.jpg",
          thumbnail: "/placeholder.svg?height=150&width=200",
        },
      ],
      reactions: [{ userId: "current-user", emoji: "🔥" }],
      mood: "excited",
    },
    {
      id: "msg-2",
      senderId: "current-user",
      senderName: "You",
      content: "That's awesome! I can see you're really committed to this routine. Keep it up! 💪",
      timestamp: new Date(Date.now() - 90 * 60 * 60 * 1000),
      status: "read",
      replyTo: {
        messageId: "msg-1",
        content: "Hey! Just finished my morning run. Feeling amazing! 🏃‍♂️",
        senderName: "John",
      },
      mood: "motivated",
    },
  ],
  unreadMessages = 3,
  isPartnerTyping = false,
  isOnline = true,
  isLoading = false,
  error = null,
  lastUpdated = new Date(),
}: PartnerViewProps) {
  const { showInteraction } = useMascot()
  const { isConnected } = useRealTimeConnection()
  const { recentActivity, activityTimestamp } = usePartnerActivity(partner.id)

  const [activeTab, setActiveTab] = useState<"day" | "activity" | "chat">("day")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [showNudgeModal, setShowNudgeModal] = useState(false)
  const [showConversationStarters, setShowConversationStarters] = useState(messages.length === 0)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [celebrationType, setCelebrationType] = useState<
    "task-complete" | "achievement" | "streak" | "goal-reached" | null
  >(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [replyContext, setReplyContext] = useState<
    "task-completion" | "achievement" | "check-in" | "motivation" | "general"
  >("general")
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [messageContextMenu, setMessageContextMenu] = useState<{
    messageId: string
    x: number
    y: number
  } | null>(null)
  const [hoveredMessage, setHoveredMessage] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [inputHeight, setInputHeight] = useState(44)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [celebratingTask, setCelebratingTask] = useState<string | null>(null)
  const [timelineView, setTimelineView] = useState(true)
  const [currentTimeSlot, setCurrentTimeSlot] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [partnerPresence, setPartnerPresence] = useState({
    isOnline: partner.isOnline ?? isOnline,
    lastSeen: partner.lastActive || new Date(),
    currentActivity: partner.currentActivity || null,
  })

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive with smooth animation
  useEffect(() => {
    if (chatEndRef.current && activeTab === "chat") {
      chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [messages, activeTab])

  // Real-time partner activity notifications
  useEffect(() => {
    if (recentActivity && activityTimestamp && notificationsEnabled) {
      showInteraction({
        id: `partner-activity-${Date.now()}`,
        context: "teamwork",
        message: `${partner.username} ${recentActivity}`,
        priority: "medium",
        duration: 5000,
        frequency: "unlimited",
        position: "top-right",
      })
    }
  }, [recentActivity, activityTimestamp, partner.username, showInteraction, notificationsEnabled])

  // Update partner presence
  useEffect(() => {
    setPartnerPresence({
      isOnline: isConnected && (partner.isOnline ?? isOnline),
      lastSeen: partner.lastActive || new Date(),
      currentActivity: recentActivity || partner.currentActivity || null,
    })
  }, [isConnected, partner.isOnline, partner.lastActive, partner.currentActivity, recentActivity, isOnline])

  // Handle keyboard appearance on mobile
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        const viewportHeight = window.visualViewport?.height || window.innerHeight
        const windowHeight = window.innerHeight
        const keyboardHeight = Math.max(0, windowHeight - viewportHeight)
        setKeyboardHeight(keyboardHeight)
      }
    }

    if (typeof window !== "undefined" && window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize)
      return () => window.visualViewport.removeEventListener("resize", handleResize)
    }
  }, [])

  // Auto-resize textarea with proper constraints
  const adjustTextareaHeight = useCallback(() => {
    if (messageInputRef.current) {
      const textarea = messageInputRef.current
      const maxHeight = Math.min(120, window.innerHeight * 0.25)

      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      const newHeight = Math.min(scrollHeight, maxHeight)

      textarea.style.height = `${newHeight}px`
      setInputHeight(newHeight)
    }
  }, [])

  useEffect(() => {
    adjustTextareaHeight()
  }, [newMessage, adjustTextareaHeight])

  // Close context menu and popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element

      if (messageContextMenu && !target.closest(".context-menu")) {
        setMessageContextMenu(null)
      }
      if (showEmojiPicker && !target.closest(".emoji-picker") && !target.closest(".emoji-button")) {
        setShowEmojiPicker(false)
      }
      if (showAttachmentMenu && !target.closest(".attachment-menu") && !target.closest(".attachment-button")) {
        setShowAttachmentMenu(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [messageContextMenu, showEmojiPicker, showAttachmentMenu])

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 48) {
      return "Yesterday " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return (
        date.toLocaleDateString([], { month: "short", day: "numeric" }) +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      )
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleSendMessage = async (messageText?: string) => {
    const messageToSend = messageText || newMessage
    if (!messageToSend.trim() && !replyingTo) return

    setIsSending(true)
    setShowQuickReplies(false)
    setShowConversationStarters(false)

    // Create new message with enhanced properties
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: "current-user",
      senderName: "You",
      content: messageToSend,
      timestamp: new Date(),
      status: "sending",
      replyTo: replyingTo
        ? {
            messageId: replyingTo.id,
            content: replyingTo.content,
            senderName: replyingTo.senderName,
          }
        : undefined,
      mood: "happy",
    }

    // Clear input immediately for better UX
    setNewMessage("")
    setReplyingTo(null)
    setShowEmojiPicker(false)
    setShowQuickReplies(false)
    setShowConversationStarters(false)

    try {
      // Simulate sending message with enhanced animation
      await new Promise((resolve) => setTimeout(resolve, 1200))

      // Update message status to sent with celebration
      const sentMessage = { ...newMsg, status: "sent" as const }
      console.log("Message sent:", messageToSend)

      // Show mascot interaction for message sent
      showInteraction({
        id: `message-sent-${Date.now()}`,
        context: "teamwork",
        message: "Message sent! Great communication! 💬",
        priority: "low",
        duration: 3000,
        frequency: "unlimited",
        position: "bottom-right",
      })

      // Simulate delivery after a short delay
      setTimeout(() => {
        const deliveredMessage = { ...sentMessage, status: "delivered" as const }
        console.log("Message delivered:", deliveredMessage)
      }, 1500)
    } catch (error) {
      console.error("Failed to send message:", error)
      const failedMessage = { ...newMsg, status: "failed" as const }
      console.log("Message failed:", failedMessage)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply)
  }

  const handleConversationStarter = (starter: string) => {
    setNewMessage(starter)
    setShowConversationStarters(false)
    messageInputRef.current?.focus()
  }

  const handleTaskCelebration = (taskId: string) => {
    setCelebratingTask(taskId)
    setTimeout(() => setCelebratingTask(null), 3000)

    // Show mascot celebration
    showInteraction({
      id: `task-celebration-${taskId}`,
      context: "celebration",
      message: "Awesome teamwork! Your partner is crushing it! 🎉",
      priority: "high",
      duration: 6000,
      frequency: "unlimited",
      position: "center",
    })
  }

  const handleQuickEncouragement = (taskId: string, type: "cheer" | "question" | "highfive") => {
    const encouragements = {
      cheer: "You're absolutely crushing it! 🎉",
      question: "How did that feel? Tell me more!",
      highfive: "High five! That was amazing! 🙌",
    }

    setActiveTab("chat")
    setNewMessage(encouragements[type])
    messageInputRef.current?.focus()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      setFileError("Unsupported file type. Please upload images, videos, or PDFs.")
      return
    }

    const maxSize = 25 * 1024 * 1024
    if (file.size > maxSize) {
      setFileError("File size too large. Max 25MB.")
      return
    }

    setFileError(null)
    setUploadingFile(true)

    setTimeout(() => {
      setUploadingFile(false)
      console.log("File uploaded:", file.name)
    }, 2000)
  }

  const handleReaction = (messageId: string, emoji: string) => {
    console.log("Adding reaction:", emoji, "to message:", messageId)
  }

  const handleDoubleTabReaction = (messageId: string) => {
    handleReaction(messageId, "❤️")
  }

  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyingTo(message)
    setMessageContextMenu(null)
    messageInputRef.current?.focus()
  }

  const handleNudgeSend = (message: string) => {
    console.log("Sending nudge:", message)
    setShowNudgeModal(false)
    handleSendMessage(message)

    // Show mascot interaction for nudge
    showInteraction({
      id: `nudge-sent-${Date.now()}`,
      context: "motivation",
      message: "Nudge sent! Sometimes a little encouragement goes a long way! 💪",
      priority: "medium",
      duration: 4000,
      frequency: "unlimited",
      position: "top-right",
    })
  }

  const handleRetry = () => {
    setIsRetrying(true)
    setTimeout(() => {
      setIsRetrying(false)
    }, 1000)
  }

  const getStatusIcon = (status: ChatMessage["status"]) => {
    switch (status) {
      case "sending":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Loader2 className="h-3 w-3 text-primary" />
          </motion.div>
        )
      case "sent":
        return <Check className="h-3 w-3 text-muted-foreground" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-primary" />
      case "failed":
        return <AlertCircle className="h-3 w-3 text-destructive cursor-pointer" onClick={handleRetry} />
      default:
        return null
    }
  }

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {}

    messages.forEach((message) => {
      const date = message.timestamp.toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })

    return groups
  }

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString([], { month: "long", day: "numeric" })
    }
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 6; hour <= 23; hour++) {
      const timeString = `${hour}:00`
      const displayTime = new Date(`2024-01-01 ${timeString}`).toLocaleTimeString([], {
        hour: "numeric",
        hour12: true,
      })
      slots.push({
        time: timeString,
        displayTime,
        tasks: tasks.filter((task) => {
          if (!task.scheduledTime) return false
          const taskHour = Number.parseInt(task.scheduledTime.split(":")[0])
          return taskHour === hour
        }),
      })
    }
    return slots
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return "morning"
    if (hour >= 12 && hour < 17) return "afternoon"
    if (hour >= 17 && hour < 21) return "evening"
    return "night"
  }

  const handleCelebration = (type: "task-complete" | "achievement" | "streak" | "goal-reached") => {
    setCelebrationType(type)
    setShowCelebration(true)
  }

  const handleActivityReaction = (activityId: string, emoji: string) => {
    console.log("Adding reaction:", emoji, "to activity:", activityId)
    // Add celebration for certain reactions
    if (emoji === "🎉" || emoji === "🔥") {
      handleCelebration("task-complete")
    }
  }

  const handleActivityComment = (activityId: string) => {
    setActiveTab("chat")
    setReplyContext("task-completion")
    setShowQuickReplies(true)
    setNewMessage("")
  }

  const handleActivityDoubleClick = (activityId: string) => {
    handleActivityReaction(activityId, "❤️")
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-sm w-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <Loader2 className="h-8 w-8 mx-auto mb-4 text-primary" />
            </motion.div>
            <p className="text-muted-foreground text-sm">Loading partner information...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-md w-full">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Couldn't load partner information</h3>
            <p className="text-muted-foreground mb-4 text-sm">Please check your connection and try again.</p>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 mx-auto text-sm"
            >
              {isRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-secondary/5">
        {/* Enhanced Partner Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <motion.img
                  whileHover={{ scale: 1.05 }}
                  src={partner.profilePicture || "/placeholder.svg"}
                  alt={partner.username}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-primary/20"
                />
                <motion.div
                  animate={partnerPresence.isOnline ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-background ${
                    partnerPresence.isOnline ? "bg-green-500" : "bg-muted-foreground"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{partner.username}</h1>
                  {partner.currentMood && (
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      className="text-lg"
                    >
                      {getMoodEmoji(partner.currentMood)}
                    </motion.span>
                  )}
                  {!isConnected && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <WifiOff className="h-4 w-4 text-destructive" />
                    </motion.div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">
                      {partner.localTime} ({partner.timezone})
                    </span>
                  </div>
                  {partnerPresence.isOnline && partnerPresence.currentActivity && (
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <span className="text-primary font-medium truncate">{partnerPresence.currentActivity}</span>
                    </div>
                  )}
                  {!partnerPresence.isOnline && (
                    <span className="text-xs">Last seen {formatTime(partnerPresence.lastSeen)}</span>
                  )}
                  {partner.todayProgress !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${partner.todayProgress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-primary to-secondary"
                        />
                      </div>
                      <span className="text-xs font-medium">{partner.todayProgress}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  notificationsEnabled ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"
                }`}
                aria-label="Toggle notifications"
              >
                {notificationsEnabled ? (
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <BellOff className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                aria-label="Compare progress"
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.button>
            </div>
          </div>

          {/* Real-time Activity Indicator */}
          <AnimatePresence>
            {recentActivity && activityTimestamp && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 flex items-center gap-2 text-xs text-primary bg-primary/10 rounded-lg px-3 py-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Zap className="h-3 w-3" />
                </motion.div>
                <span>
                  {partner.username} {recentActivity}
                </span>
                <span className="text-muted-foreground">• {formatTime(activityTimestamp)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-card border-b border-border px-4 sm:px-6 flex-shrink-0">
          <div className="flex">
            {[
              { id: "day", label: "Day", fullLabel: "Partner's Day", icon: Calendar },
              { id: "activity", label: "Activity", fullLabel: "Activity Feed", icon: Target, badge: unreadMessages },
              { id: "chat", label: "Chat", fullLabel: "Chat", icon: MessageSquare, badge: unreadMessages },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className={`flex items-center gap-2 py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 relative min-w-0 ${
                  activeTab === tab.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.fullLabel}</span>
                <span className="sm:hidden truncate">{tab.label}</span>
                {tab.badge && tab.badge > 0 && tab.id === "chat" && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center flex-shrink-0"
                  >
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Enhanced Tab Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "day" && (
              <motion.div
                key="day"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full overflow-y-auto"
              >
                <div className="p-4 sm:p-6">
                  <div className="max-w-4xl mx-auto">
                    <div className="mb-4 sm:mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{partner.username}'s Day</h2>
                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setTimelineView(!timelineView)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              timelineView
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {timelineView ? "List View" : "Timeline"}
                          </motion.button>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        Track your partner's progress and offer support
                      </p>
                    </div>

                    {tasks.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-8 sm:py-12"
                      >
                        <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No tasks scheduled</h3>
                        <p className="text-muted-foreground mb-4 text-sm sm:text-base px-4">
                          Looks like {partner.username} hasn't scheduled any tasks for today.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab("chat")}
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base"
                        >
                          Send encouragement
                        </motion.button>
                      </motion.div>
                    ) : timelineView ? (
                      // Timeline View with proper theming
                      <div className="space-y-6">
                        {generateTimeSlots().map((slot, index) => (
                          <motion.div
                            key={slot.time}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex gap-4"
                          >
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                {React.createElement(getTimeIcon(slot.time), {
                                  className: "w-5 h-5 text-primary",
                                })}
                              </div>
                              <div className="text-xs font-medium text-muted-foreground mt-1">{slot.displayTime}</div>
                              {index < generateTimeSlots().length - 1 && <div className="w-px h-16 bg-border mt-2" />}
                            </div>

                            <div className="flex-1 pb-8">
                              {slot.tasks.length > 0 ? (
                                <div className="space-y-3">
                                  {slot.tasks.map((task) => (
                                    <motion.div
                                      key={task.id}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      whileHover={{ scale: 1.02, y: -2 }}
                                      className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden"
                                    >
                                      {/* Celebration overlay */}
                                      <AnimatePresence>
                                        {celebratingTask === task.id && (
                                          <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 pointer-events-none"
                                          >
                                            <motion.div
                                              animate={{
                                                scale: [1, 1.2, 1],
                                                rotate: [0, 180, 360],
                                              }}
                                              transition={{
                                                duration: 2,
                                                repeat: Number.POSITIVE_INFINITY,
                                              }}
                                              className="absolute top-2 right-2"
                                            >
                                              <Sparkles className="w-6 h-6 text-primary" />
                                            </motion.div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>

                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2">
                                            {/* Category icon */}
                                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                              {React.createElement(getCategoryIcon(task.category || ""), {
                                                className: "w-4 h-4",
                                              })}
                                            </div>

                                            {/* Task name */}
                                            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                                              {task.description}
                                            </h3>

                                            {/* Difficulty indicator */}
                                            {task.difficulty && (
                                              <div className="flex gap-1">
                                                {[1, 2, 3].map((level) => (
                                                  <div
                                                    key={level}
                                                    className={`w-2 h-2 rounded-full ${
                                                      level <=
                                                      (
                                                        task.difficulty === "easy"
                                                          ? 1
                                                          : task.difficulty === "medium"
                                                            ? 2
                                                            : 3
                                                      )
                                                        ? getDifficultyColor(task.difficulty)
                                                        : "bg-muted"
                                                    }`}
                                                  />
                                                ))}
                                              </div>
                                            )}
                                          </div>

                                          {/* Status badge */}
                                          <div className="flex items-center gap-2 mb-2">
                                            <motion.span
                                              animate={task.status === "completed" ? { scale: [1, 1.1, 1] } : {}}
                                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                task.status === "completed"
                                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                  : task.status === "awaiting-verification"
                                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                    : task.status === "skipped"
                                                      ? "bg-muted text-muted-foreground"
                                                      : "bg-primary/10 text-primary"
                                              }`}
                                            >
                                              {task.status === "awaiting-verification"
                                                ? "Needs Verification"
                                                : task.status === "completed"
                                                  ? "Completed ✨"
                                                  : task.status === "skipped"
                                                    ? "Skipped"
                                                    : "To Do"}
                                            </motion.span>

                                            {task.mood && <span className="text-lg">{getMoodEmoji(task.mood)}</span>}
                                          </div>

                                          {/* Progress bar */}
                                          {task.progress && (
                                            <div className="mb-3">
                                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                                <span>Progress</span>
                                                <span>
                                                  {task.progress.current}/{task.progress.total} {task.progress.unit}
                                                </span>
                                              </div>
                                              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                  initial={{ width: 0 }}
                                                  animate={{
                                                    width: `${(task.progress.current / task.progress.total) * 100}%`,
                                                  }}
                                                  transition={{ duration: 1, ease: "easeOut" }}
                                                  className="h-full bg-gradient-to-r from-primary to-secondary"
                                                />
                                              </div>
                                            </div>
                                          )}

                                          {/* Notes */}
                                          {task.attachments?.notes && (
                                            <div className="bg-muted/50 rounded-lg p-3 mb-3">
                                              <p className="text-xs sm:text-sm text-foreground break-words">
                                                {task.attachments.notes}
                                              </p>
                                            </div>
                                          )}

                                          {/* Photos */}
                                          {task.attachments?.photos && (
                                            <div className="flex gap-2 mb-3 overflow-x-auto">
                                              {task.attachments.photos.map((photo, photoIndex) => (
                                                <motion.img
                                                  key={photoIndex}
                                                  whileHover={{ scale: 1.05 }}
                                                  src={photo || "/placeholder.svg"}
                                                  alt="Task attachment"
                                                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                                                  onClick={() => setExpandedImage(photo)}
                                                />
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-col gap-2 flex-shrink-0">
                                          {task.status === "awaiting-verification" && (
                                            <motion.button
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                              onClick={() => {
                                                setSelectedTask(task)
                                                setShowTaskDetail(true)
                                              }}
                                              className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-xs hover:bg-primary/90 transition-colors"
                                            >
                                              Review
                                            </motion.button>
                                          )}

                                          {task.status === "completed" && (
                                            <div className="flex gap-1">
                                              <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleQuickEncouragement(task.id, "cheer")}
                                                className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
                                                title="Cheer"
                                              >
                                                🎉
                                              </motion.button>
                                              <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleQuickEncouragement(task.id, "highfive")}
                                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                title="High Five"
                                              >
                                                🙌
                                              </motion.button>
                                            </div>
                                          )}

                                          <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleQuickEncouragement(task.id, "question")}
                                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            title="Ask about this task"
                                          >
                                            <MessageCircle className="h-4 w-4" />
                                          </motion.button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-sm italic">
                                  No tasks scheduled for this time
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      // List View (existing implementation with theming fixes)
                      <div className="space-y-3 sm:space-y-4">
                        {tasks.map((task, index) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.01, x: 5 }}
                            className="bg-card rounded-xl border border-border p-4 sm:p-6 hover:shadow-md transition-all"
                          >
                            {/* Existing task card content with proper theming */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                  <div
                                    className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                      task.status === "completed"
                                        ? "bg-green-500"
                                        : task.status === "awaiting-verification"
                                          ? "bg-yellow-500"
                                          : task.status === "skipped"
                                            ? "bg-muted-foreground"
                                            : "bg-primary"
                                    }`}
                                  />
                                  <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                                    {task.description}
                                  </h3>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "activity" && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full overflow-y-auto"
              >
                <div className="p-4 sm:p-6">
                  <div className="max-w-4xl mx-auto">
                    <div className="mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Activity Feed</h2>
                      <p className="text-muted-foreground text-sm sm:text-base">
                        Stay updated on {partner.username}'s progress and achievements
                      </p>
                    </div>

                    {activities.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-8 sm:py-12"
                      >
                        <Target className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No recent activity</h3>
                        <p className="text-muted-foreground mb-4 text-sm sm:text-base px-4">
                          When {partner.username} completes tasks, writes reflections, or achieves milestones, they will
                          appear here.
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab("chat")}
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base"
                        >
                          Encourage them in chat!
                        </motion.button>
                      </motion.div>
                    ) : (
                      <div className="space-y-6">
                        {activities.map((activity, index) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <RichActivityCard
                              activity={activity}
                              onReaction={handleActivityReaction}
                              onComment={handleActivityComment}
                              onDoubleClick={handleActivityDoubleClick}
                            />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full"
                style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight}px` : "0" }}
              >
                {/* Enhanced Chat Messages */}
                <div className="flex-1 overflow-y-auto" ref={chatContainerRef}>
                  <div className="p-4 sm:p-6">
                    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                      {/* Conversation Starters */}
                      <AnimatePresence>
                        {showConversationStarters && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 border border-primary/20"
                          >
                            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary" />
                              Start a conversation with {partner.username}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {CONVERSATION_STARTERS.map((starter, index) => (
                                <motion.button
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.1 }}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleConversationStarter(starter)}
                                  className="bg-card text-foreground px-3 py-2 rounded-lg text-xs hover:bg-primary/10 hover:text-primary transition-colors border border-border hover:border-primary/30"
                                >
                                  {starter}
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {Object.entries(groupMessagesByDate(messages)).map(([dateString, dayMessages]) => (
                        <div key={dateString}>
                          {/* Enhanced Date Header */}
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-center mb-3 sm:mb-4"
                          >
                            <span className="bg-muted text-muted-foreground text-xs sm:text-sm px-4 py-2 rounded-full shadow-sm">
                              {getDateLabel(dateString)}
                            </span>
                          </motion.div>

                          {/* Enhanced Messages */}
                          <div className="space-y-3 sm:space-y-4">
                            {dayMessages.map((message, messageIndex) => (
                              <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: messageIndex * 0.1 }}
                                className={`flex ${message.senderId === "current-user" ? "justify-end" : "justify-start"}`}
                                onMouseEnter={() => setHoveredMessage(message.id)}
                                onMouseLeave={() => setHoveredMessage(null)}
                                onDoubleClick={() => handleDoubleTabReaction(message.id)}
                              >
                                <div
                                  className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${
                                    message.senderId === "current-user" ? "flex-row-reverse" : "flex-row"
                                  }`}
                                >
                                  {/* Enhanced Avatar */}
                                  {message.senderId !== "current-user" && (
                                    <motion.img
                                      whileHover={{ scale: 1.1 }}
                                      src={partner.profilePicture || "/placeholder.svg"}
                                      alt={partner.username}
                                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20"
                                    />
                                  )}

                                  <div className="relative">
                                    {/* Enhanced Reply indicator */}
                                    {message.replyTo && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={`mb-2 p-2 rounded-lg border-l-4 text-xs sm:text-sm ${
                                          message.senderId === "current-user"
                                            ? "bg-primary/10 border-primary text-primary"
                                            : "bg-muted border-muted-foreground text-muted-foreground"
                                        }`}
                                      >
                                        <div className="font-medium text-xs mb-1">{message.replyTo.senderName}</div>
                                        <div className="truncate">{message.replyTo.content}</div>
                                      </motion.div>
                                    )}

                                    {/* Enhanced Message bubble */}
                                    <motion.div
                                      initial={{ scale: 0.8, opacity: 0 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      whileHover={{ scale: 1.02 }}
                                      className={`relative px-3 sm:px-4 py-2 rounded-2xl break-words shadow-sm ${
                                        message.senderId === "current-user"
                                          ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
                                          : "bg-card text-foreground border border-border"
                                      } ${message.isNudge ? "ring-2 ring-yellow-400 ring-opacity-50" : ""}`}
                                      onContextMenu={(e) => {
                                        e.preventDefault()
                                        const rect = e.currentTarget.getBoundingClientRect()
                                        const x = Math.min(e.clientX, window.innerWidth - 200)
                                        const y = Math.min(e.clientY, window.innerHeight - 150)
                                        setMessageContextMenu({
                                          messageId: message.id,
                                          x,
                                          y,
                                        })
                                      }}
                                    >
                                      {message.isNudge && (
                                        <motion.div
                                          animate={{ rotate: [0, 10, -10, 0] }}
                                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                                          className="flex items-center gap-1 mb-1"
                                        >
                                          <Hand className="h-3 w-3" />
                                          <span className="text-xs font-medium">Nudge</span>
                                        </motion.div>
                                      )}

                                      <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>

                                      {/* Enhanced Attachments */}
                                      {message.attachments && message.attachments.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                          {message.attachments.map((attachment, index) => (
                                            <motion.div
                                              key={index}
                                              initial={{ opacity: 0, scale: 0.9 }}
                                              animate={{ opacity: 1, scale: 1 }}
                                              transition={{ delay: index * 0.1 }}
                                            >
                                              {attachment.type === "image" && (
                                                <motion.img
                                                  whileHover={{ scale: 1.05 }}
                                                  src={attachment.thumbnail || attachment.url}
                                                  alt={attachment.name}
                                                  className="max-w-full sm:max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                                                  onClick={() => setExpandedImage(attachment.url)}
                                                />
                                              )}
                                              {attachment.type === "video" && (
                                                <div className="relative max-w-full sm:max-w-xs">
                                                  <img
                                                    src={
                                                      attachment.thumbnail || "/placeholder.svg?height=200&width=300"
                                                    }
                                                    alt={attachment.name}
                                                    className="w-full rounded-lg"
                                                  />
                                                  <motion.div
                                                    whileHover={{ scale: 1.1 }}
                                                    className="absolute inset-0 flex items-center justify-center"
                                                  >
                                                    <div className="bg-black bg-opacity-60 rounded-full p-2 sm:p-3">
                                                      <Play className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                                                    </div>
                                                  </motion.div>
                                                </div>
                                              )}
                                              {attachment.type === "document" && (
                                                <motion.div
                                                  whileHover={{ scale: 1.02 }}
                                                  className="flex items-center gap-2 bg-white bg-opacity-20 rounded-lg p-2 max-w-full"
                                                >
                                                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                                                  <div className="flex-1 min-w-0">
                                                    <p className="text-xs sm:text-sm font-medium truncate">
                                                      {attachment.name}
                                                    </p>
                                                    {attachment.size && (
                                                      <p className="text-xs opacity-75">
                                                        {formatFileSize(attachment.size)}
                                                      </p>
                                                    )}
                                                  </div>
                                                  <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded flex-shrink-0"
                                                  >
                                                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                                  </motion.button>
                                                </motion.div>
                                              )}
                                            </motion.div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Enhanced Reactions */}
                                      {message.reactions && message.reactions.length > 0 && (
                                        <motion.div
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          className="flex gap-1 mt-2 flex-wrap"
                                        >
                                          {message.reactions.map((reaction, index) => (
                                            <motion.span
                                              key={index}
                                              initial={{ scale: 0 }}
                                              animate={{ scale: 1 }}
                                              whileHover={{ scale: 1.2 }}
                                              className="inline-flex items-center text-xs bg-white bg-opacity-20 rounded-full px-2 py-1 border border-white border-opacity-30 backdrop-blur-sm"
                                            >
                                              <span className="text-sm">{reaction.emoji}</span>
                                            </motion.span>
                                          ))}
                                        </motion.div>
                                      )}

                                      {/* Enhanced Hover actions */}
                                      <AnimatePresence>
                                        {hoveredMessage === message.id && window.innerWidth >= 640 && (
                                          <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            className={`absolute top-0 ${
                                              message.senderId === "current-user" ? "-left-20" : "-right-20"
                                            } flex gap-1`}
                                          >
                                            <motion.button
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                              onClick={() =>
                                                setMessageContextMenu({
                                                  messageId: message.id,
                                                  x: 0,
                                                  y: 0,
                                                })
                                              }
                                              className="p-2 bg-card rounded-full shadow-lg hover:bg-muted border border-border"
                                            >
                                              <Smile className="h-4 w-4 text-muted-foreground" />
                                            </motion.button>
                                            <motion.button
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                              onClick={() => handleReplyToMessage(message)}
                                              className="p-2 bg-card rounded-full shadow-lg hover:bg-muted border border-border"
                                            >
                                              <Reply className="h-4 w-4 text-muted-foreground" />
                                            </motion.button>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </motion.div>

                                    {/* Enhanced Message status and timestamp */}
                                    <div
                                      className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                                        message.senderId === "current-user" ? "justify-end" : "justify-start"
                                      }`}
                                    >
                                      <span>
                                        {message.timestamp.toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                      {message.senderId === "current-user" && getStatusIcon(message.status)}
                                      {message.mood && (
                                        <span className="ml-1 text-xs">{getMoodEmoji(message.mood)}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Enhanced Typing indicator */}
                      <AnimatePresence>
                        {isPartnerTyping && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex items-center gap-2 mb-4"
                          >
                            <motion.img
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                              src={partner.profilePicture || "/placeholder.svg"}
                              alt={partner.username}
                              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-primary/20"
                            />
                            <div className="bg-card rounded-2xl px-3 sm:px-4 py-2 shadow-sm border border-border">
                              <div className="flex gap-1">
                                <motion.div
                                  className="w-2 h-2 bg-muted-foreground rounded-full"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                                />
                                <motion.div
                                  className="w-2 h-2 bg-muted-foreground rounded-full"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
                                />
                                <motion.div
                                  className="w-2 h-2 bg-muted-foreground rounded-full"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.4 }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div ref={chatEndRef} />
                    </div>
                  </div>
                </div>

                {/* Conversation Starters */}
                <ConversationStarters
                  partnerName={partner.username}
                  partnerMood={partner.currentMood}
                  timeOfDay={getTimeOfDay()}
                  recentActivity={activities.length > 0 ? activities[0].type : undefined}
                  onStarterSelect={(starter) => {
                    setNewMessage(starter)
                    setShowConversationStarters(false)
                    messageInputRef.current?.focus()
                  }}
                  onDismiss={() => setShowConversationStarters(false)}
                  isVisible={showConversationStarters}
                />

                {/* Quick Reply Suggestions */}
                <QuickReplySuggestions
                  isVisible={showQuickReplies}
                  context={replyContext}
                  partnerName={partner.username}
                  onReplySelect={(reply) => {
                    if (reply) {
                      handleSendMessage(reply)
                    } else {
                      setShowQuickReplies(false)
                      messageInputRef.current?.focus()
                    }
                  }}
                  onDismiss={() => setShowQuickReplies(false)}
                />

                {/* Enhanced Message Input */}
                <div className="border-t border-border bg-card flex-shrink-0">
                  <div className="p-3 sm:p-4">
                    <div className="max-w-4xl mx-auto">
                      {/* Enhanced Reply indicator */}
                      <AnimatePresence>
                        {replyingTo && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-3 p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border-l-4 border-primary"
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="text-xs sm:text-sm font-medium text-primary flex items-center gap-1">
                                  <Reply className="w-3 h-3" />
                                  Replying to {replyingTo.senderName}
                                </div>
                                <div className="text-xs sm:text-sm text-primary/80 truncate">{replyingTo.content}</div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setReplyingTo(null)}
                                className="text-primary hover:text-primary/80 ml-2 flex-shrink-0 p-1 rounded-full hover:bg-primary/20"
                                aria-label="Cancel reply"
                              >
                                <X className="h-4 w-4" />
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Quick Replies */}
                      <AnimatePresence>
                        {showQuickReplies && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="mb-3 flex gap-2 overflow-x-auto pb-2"
                          >
                            {QUICK_REPLIES.map((reply, index) => (
                              <motion.button
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleQuickReply(reply)}
                                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-3 py-1 rounded-full text-xs hover:from-primary/90 hover:to-secondary/90 transition-all duration-200 flex-shrink-0 shadow-sm"
                              >
                                {reply}
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* File upload error */}
                      <AnimatePresence>
                        {fileError && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20"
                          >
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-destructive flex-1">{fileError}</span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setFileError(null)}
                                className="text-destructive hover:text-destructive/80 flex-shrink-0 p-1 rounded-full hover:bg-destructive/10"
                                aria-label="Dismiss error"
                              >
                                <X className="h-4 w-4" />
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Offline indicator */}
                      {!isConnected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                        >
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-yellow-700 dark:text-yellow-400">
                            <WifiOff className="h-4 w-4 flex-shrink-0" />
                            <span>You're offline. Messages will be sent when connection is restored.</span>
                          </div>
                        </motion.div>
                      )}

                      <div className="flex items-end gap-2 sm:gap-3">
                        {/* Enhanced Attachment button */}
                        <div className="relative">
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                            className="attachment-button p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0"
                            aria-label="Attach file"
                          >
                            <Plus className="h-5 w-5" />
                          </motion.button>

                          {/* Enhanced Attachment menu */}
                          <AnimatePresence>
                            {showAttachmentMenu && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="attachment-menu absolute bottom-full left-0 mb-2 bg-card rounded-lg shadow-lg border border-border py-2 min-w-48 z-50"
                              >
                                <motion.button
                                  whileHover={{ backgroundColor: "hsl(var(--muted))" }}
                                  onClick={() => {
                                    if (fileInputRef.current) {
                                      fileInputRef.current.accept = "image/*,video/*"
                                      fileInputRef.current.click()
                                    }
                                    setShowAttachmentMenu(false)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                                >
                                  <ImageIcon className="h-4 w-4 text-primary" />
                                  Attach Photo/Video
                                </motion.button>
                                <motion.button
                                  whileHover={{ backgroundColor: "hsl(var(--muted))" }}
                                  onClick={() => {
                                    if (fileInputRef.current) {
                                      fileInputRef.current.accept = ".pdf,.doc,.docx,.txt"
                                      fileInputRef.current.click()
                                    }
                                    setShowAttachmentMenu(false)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
                                >
                                  <File className="h-4 w-4 text-green-500" />
                                  Attach Document
                                </motion.button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Enhanced Message input */}
                        <div className="flex-1 relative">
                          <textarea
                            ref={messageInputRef}
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value)
                              if (e.target.value.length === 0) {
                                setShowQuickReplies(true)
                                setReplyContext("general")
                              } else {
                                setShowQuickReplies(false)
                              }
                            }}
                            onKeyDown={handleKeyPress}
                            onFocus={() => setShowQuickReplies(newMessage.length === 0)}
                            placeholder={`Message ${partner.username}...`}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-border rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base transition-all duration-200 bg-card text-foreground"
                            style={{ height: `${inputHeight}px` }}
                            rows={1}
                            disabled={uploadingFile}
                          />

                          {uploadingFile && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-card/75 rounded-2xl flex items-center justify-center backdrop-blur-sm"
                            >
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                >
                                  <Loader2 className="h-4 w-4" />
                                </motion.div>
                                Uploading...
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Enhanced Emoji button */}
                        <div className="relative">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="emoji-button p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex-shrink-0"
                            aria-label="Add emoji"
                          >
                            <Smile className="h-5 w-5" />
                          </motion.button>

                          {/* Enhanced Emoji picker */}
                          <AnimatePresence>
                            {showEmojiPicker && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="emoji-picker absolute bottom-full right-0 mb-2 bg-card rounded-lg shadow-lg border border-border p-3 z-50 max-w-xs"
                              >
                                <div className="text-xs text-muted-foreground mb-2 font-medium">Frequently Used</div>
                                <div className="grid grid-cols-8 gap-1 mb-3">
                                  {["😊", "😂", "❤️", "👍", "🔥", "🎉", "💪", "🙌"].map((emoji) => (
                                    <motion.button
                                      key={emoji}
                                      whileHover={{ scale: 1.2 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => {
                                        setNewMessage(newMessage + emoji)
                                        setShowEmojiPicker(false)
                                        messageInputRef.current?.focus()
                                      }}
                                      className="p-2 hover:bg-muted rounded text-base sm:text-lg transition-colors"
                                    >
                                      {emoji}
                                    </motion.button>
                                  ))}
                                </div>
                                <div className="text-xs text-muted-foreground mb-2 font-medium">All Emojis</div>
                                <div className="grid grid-cols-8 gap-1">
                                  {[
                                    "👏",
                                    "🚀",
                                    "⭐",
                                    "✨",
                                    "🎯",
                                    "💯",
                                    "🔥",
                                    "⚡",
                                    "🌟",
                                    "🎊",
                                    "🥳",
                                    "😍",
                                    "🤩",
                                    "😎",
                                    "🤔",
                                    "😴",
                                  ].map((emoji) => (
                                    <motion.button
                                      key={emoji}
                                      whileHover={{ scale: 1.2 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => {
                                        setNewMessage(newMessage + emoji)
                                        setShowEmojiPicker(false)
                                        messageInputRef.current?.focus()
                                      }}
                                      className="p-2 hover:bg-muted rounded text-base sm:text-lg transition-colors"
                                    >
                                      {emoji}
                                    </motion.button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Enhanced Send/Nudge buttons */}
                        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowNudgeModal(true)}
                            className="p-2 text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
                            aria-label="Send nudge"
                          >
                            <Hand className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSendMessage()}
                            disabled={(!newMessage.trim() && !replyingTo) || isSending || uploadingFile}
                            className={`send-button p-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg hover:from-primary/90 hover:to-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm ${
                              isSending ? "scale-95" : "scale-100"
                            }`}
                            aria-label="Send message"
                          >
                            {isSending ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              >
                                <Send className="h-5 w-5" />
                              </motion.div>
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />

        {/* Enhanced Context Menu */}
        <AnimatePresence>
          {messageContextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="context-menu fixed bg-card rounded-lg shadow-xl border border-border py-2 z-50"
              style={{
                left: Math.min(messageContextMenu.x, window.innerWidth - 220),
                top: Math.min(messageContextMenu.y, window.innerHeight - 120),
              }}
            >
              <div className="px-3 py-2 border-b border-border">
                <div className="text-xs text-muted-foreground mb-2">React with:</div>
                <div className="grid grid-cols-4 gap-1">
                  {QUICK_REACTIONS.map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        handleReaction(messageContextMenu.messageId, emoji)
                        setMessageContextMenu(null)
                      }}
                      className="p-2 hover:bg-muted rounded text-lg transition-colors flex items-center justify-center"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>
              <motion.button
                whileHover={{ backgroundColor: "hsl(var(--muted))" }}
                onClick={() => {
                  const message = messages.find((m) => m.id === messageContextMenu.messageId)
                  if (message) {
                    handleReplyToMessage(message)
                  }
                }}
                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2"
              >
                <Reply className="h-4 w-4" />
                Reply
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Nudge Modal */}
        <AnimatePresence>
          {showNudgeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowNudgeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[80vh] overflow-y-auto border border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <Hand className="w-5 h-5 text-yellow-500" />
                    Send a Nudge
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowNudgeModal(false)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>
                <p className="text-muted-foreground mb-4 text-sm">
                  Send {partner.username} a gentle nudge to encourage them! ✨
                </p>
                <div className="space-y-2">
                  {NUDGE_MESSAGES.map((message, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNudgeSend(message)}
                      className="w-full text-left p-3 rounded-lg border border-border hover:bg-muted hover:border-primary/30 transition-all duration-200 text-sm"
                    >
                      {message}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Expanded Image Modal */}
        <AnimatePresence>
          {expandedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
              onClick={() => setExpandedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={expandedImage || "/placeholder.svg"}
                  alt="Expanded view"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setExpandedImage(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Close image"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Task Detail Modal */}
        <AnimatePresence>
          {showTaskDetail && selectedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowTaskDetail(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card rounded-xl p-4 sm:p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto border border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Task Verification
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowTaskDetail(false)}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">{selectedTask.description}</h4>
                    <p className="text-sm text-muted-foreground">Scheduled for {selectedTask.scheduledTime}</p>
                  </div>

                  {selectedTask.attachments?.notes && (
                    <div>
                      <h5 className="font-medium text-foreground mb-2">Notes</h5>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm text-foreground break-words">{selectedTask.attachments.notes}</p>
                      </div>
                    </div>
                  )}

                  {selectedTask.attachments?.photos && (
                    <div>
                      <h5 className="font-medium text-foreground mb-2">Photos</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedTask.attachments.photos.map((photo, index) => (
                          <motion.img
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            src={photo || "/placeholder.svg"}
                            alt="Task verification"
                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setExpandedImage(photo)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        console.log("Approving task:", selectedTask.id)
                        handleTaskCelebration(selectedTask.id)
                        setShowTaskDetail(false)
                      }}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-medium shadow-sm"
                    >
                      ✅ Approve
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowTaskDetail(false)
                        setActiveTab("chat")
                        setNewMessage(`About your "${selectedTask.description}" task: `)
                      }}
                      className="flex-1 bg-muted hover:bg-muted/80 text-foreground py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                    >
                      💬 Ask Question
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Celebration Animation */}
        <CelebrationAnimation
          isVisible={showCelebration}
          type={celebrationType || "task-complete"}
          onComplete={() => {
            setShowCelebration(false)
            setCelebrationType(null)
          }}
        />

        <MouseGlowEffect />
      </div>
    </DashboardLayout>
  )
}
