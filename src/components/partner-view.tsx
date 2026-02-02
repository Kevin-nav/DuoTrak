"use client"
import { motion, AnimatePresence } from "framer-motion"
import type React from "react"
import { format, isToday, isYesterday, parseISO } from "date-fns"

import {
  MessageCircle,
  Clock,
  CheckCircle,
  TrendingUp,
  Calendar,
  Timer,
  FileText,
  X,
  Send,
  Award,
  Zap,
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
} from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import MouseGlowEffect from "./mouse-glow-effect"
import DashboardLayout from "./dashboard-layout"
import { ChatInterface } from "./chat"

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
}

interface ActivityItem {
  id: string
  type: "task-completion" | "reflection" | "system-update" | "achievement" | "duo-challenge"
  timestamp: Date
  summary: string
  details?: {
    taskName?: string
    goalName?: string
    notes?: string
    photo?: string
    badgeName?: string
    challengeText?: string
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
}

interface PartnerInfo {
  id: string
  username: string
  profilePicture: string
  timezone: string
  localTime: string
  initials: string
  lastActive?: Date
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
  "Checking in! 👋",
  "You got this! 💪",
  "Thinking of you! 💭",
  "How's that goal going? 🎯",
  "Just sending some good vibes! ✨",
  "Hope you're having a great day! 😊",
  "Remember, progress over perfection! 🌟",
  "You're doing amazing! Keep it up! 🚀",
]

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "💪", "🎉"]

const groupMessagesByDate = (messages: ChatMessage[]) => {
  return messages.reduce(
    (acc, msg) => {
      const dateKey = format(msg.timestamp, "yyyy-MM-dd")
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(msg)
      return acc
    },
    {} as Record<string, ChatMessage[]>,
  )
}

const getDateLabel = (dateKey: string) => {
  const messageDate = parseISO(dateKey)
  if (isToday(messageDate)) {
    return "Today"
  }
  if (isYesterday(messageDate)) {
    return "Yesterday"
  }
  return format(messageDate, "MMMM d, yyyy")
}

export default function PartnerView({
  partner = {
    id: "partner-1",
    username: "John",
    profilePicture: "/placeholder.svg?height=60&width=60",
    timezone: "GMT-7",
    localTime: "4:15 PM",
    initials: "JD",
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  tasks = [
    {
      id: "task-1",
      description: "Morning Run (5km)",
      scheduledTime: "7:00 AM",
      status: "awaiting-verification",
      timeScheduled: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      attachments: {
        photos: ["/placeholder.svg?height=200&width=300"],
        notes: "Completed the full 5km route! Feeling great today.",
      },
      systemType: "habit",
    },
    {
      id: "task-2",
      description: "Work Session: Project X",
      scheduledTime: "9:00 AM - 11:00 AM",
      status: "completed",
      progress: {
        current: 2,
        total: 2,
        unit: "hours",
      },
      systemType: "routine",
    },
    {
      id: "task-3",
      description: "Language Learning - Spanish",
      scheduledTime: "2:00 PM",
      status: "completed",
      progress: {
        current: 3,
        total: 5,
        unit: "lessons",
      },
      systemType: "habit",
    },
    {
      id: "task-4",
      description: "Read 20 pages",
      scheduledTime: "8:00 PM",
      status: "todo",
      timeScheduled: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      systemType: "habit",
    },
    {
      id: "task-5",
      description: "Evening Meditation",
      scheduledTime: "6:00 PM",
      status: "skipped",
      timeScheduled: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      attachments: {
        notes: "Had to skip today due to unexpected meeting. Will make up tomorrow!",
      },
      systemType: "habit",
    },
  ],
  activities = [
    {
      id: "activity-1",
      type: "achievement",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      summary: "Achievement Unlocked! John earned the 'Streak Starter: Gold' badge!",
      details: {
        badgeName: "Streak Starter: Gold",
      },
      reactions: [
        { userId: "current-user", emoji: "🔥" },
        { userId: "other-user", emoji: "👏" },
      ],
    },
    {
      id: "activity-2",
      type: "task-completion",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      summary: "John completed 'Morning Run (5km)' for 'Daily Fitness'",
      details: {
        taskName: "Morning Run (5km)",
        goalName: "Daily Fitness",
        notes: "Perfect weather for running today! Hit a new personal best on the last kilometer.",
        photo: "/placeholder.svg?height=200&width=300",
      },
      reactions: [{ userId: "current-user", emoji: "💪" }],
      comments: [
        {
          userId: "current-user",
          text: "Amazing work! That's dedication right there 🏃‍♂️",
          timestamp: new Date(Date.now() - 90 * 60 * 1000),
        },
      ],
    },
    {
      id: "activity-3",
      type: "duo-challenge",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      summary: "Duo Challenge Suggestion",
      details: {
        challengeText:
          "You both crushed your morning routines this week! How about a quick 5-minute stretch challenge together tomorrow?",
      },
    },
    {
      id: "activity-4",
      type: "reflection",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      summary: "John wrote a daily reflection",
      details: {
        notes:
          "Today was challenging but rewarding. The morning routine is really starting to stick, and I can feel the positive impact on my energy levels throughout the day.",
      },
      reactions: [{ userId: "current-user", emoji: "❤️" }],
    },
    {
      id: "activity-5",
      type: "system-update",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      summary: "John updated their system for 'Learn Spanish'",
      details: {
        goalName: "Learn Spanish",
        notes: "Increased daily practice time from 15 to 20 minutes to accelerate progress.",
      },
    },
  ],
  messages = [
    {
      id: "msg-1",
      senderId: "partner-1",
      senderName: "John",
      content: "Hey! Just finished my morning run. Feeling great! 🏃‍♂️",
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
    },
    {
      id: "msg-2",
      senderId: "current-user",
      senderName: "You",
      content: "That's awesome! I can see you're really committed to this routine. Keep it up! 💪",
      timestamp: new Date(Date.now() - 90 * 60 * 1000),
      status: "read",
      replyTo: {
        messageId: "msg-1",
        content: "Hey! Just finished my morning run. Feeling great! 🏃‍♂️",
        senderName: "John",
      },
    },
    {
      id: "msg-3",
      senderId: "partner-1",
      senderName: "John",
      content: "Thanks for the encouragement! How's your Spanish learning going?",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      status: "read",
    },
    {
      id: "msg-4",
      senderId: "current-user",
      senderName: "You",
      content: "Going well! Just completed today's lesson. Here's my progress report:",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      status: "delivered",
      attachments: [
        {
          type: "document",
          url: "/placeholder-document.pdf",
          name: "Spanish_Progress_Week3.pdf",
          size: 245760, // 240KB
        },
      ],
    },
    {
      id: "msg-5",
      senderId: "partner-1",
      senderName: "John",
      content: "Wow, you're making great progress! 🎉",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      status: "read",
    },
    {
      id: "msg-6",
      senderId: "current-user",
      senderName: "You",
      content: "Checking in! 👋",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      status: "sent",
      isNudge: true,
    },
  ],
  unreadMessages = 3,
  isPartnerTyping = false,
  isOnline = true,
  isLoading = false,
  error = null,
  lastUpdated = new Date(),
}: PartnerViewProps) {
  const [activeTab, setActiveTab] = useState<"day" | "activity" | "chat">("day")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)
  const [expandedImage, setExpandedImage] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [showNudgeModal, setShowNudgeModal] = useState(false)
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

  const chatContainerRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Handle keyboard appearance on mobile
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" && window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardHeight = Math.max(0, windowHeight - viewportHeight);
        setKeyboardHeight(keyboardHeight);
      }
    };

    const visualViewport = typeof window !== 'undefined' ? window.visualViewport : null;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
      return () => visualViewport.removeEventListener('resize', handleResize);
    }
  }, []);

  // Auto-resize textarea with proper constraints
  const adjustTextareaHeight = useCallback(() => {
    if (messageInputRef.current) {
      const textarea = messageInputRef.current
      const maxHeight = Math.min(120, window.innerHeight * 0.25) // Max 25% of screen height

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
    if (isToday(date)) {
      return format(date, 'p');
    }
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'p')}`;
    }
    return format(date, 'MMM d, yyyy');
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleSendMessage = () => {
    if (newMessage.trim() === "" && !uploadingFile) return

    setIsSending(true)
    const tempId = `temp-${Date.now()}`
    const message: ChatMessage = {
      id: tempId,
      senderId: "current-user",
      senderName: "You",
      content: newMessage.trim(),
      timestamp: new Date(),
      status: "sending",
      replyTo: replyingTo
        ? {
          messageId: replyingTo.id,
          content: replyingTo.content,
          senderName: replyingTo.senderName,
        }
        : undefined,
    }

    setTimeout(() => {
      console.log("Message sent:", message)
      setIsSending(false)
    }, 1000)

    setNewMessage("")
    setReplyingTo(null)
    setInputHeight(44)
    if (messageInputRef.current) {
      messageInputRef.current.style.height = "44px"
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    setFileError(null)

    if (file.size > 10 * 1024 * 1024) {
      setFileError("File size exceeds 10MB limit.")
      setUploadingFile(false)
      return
    }

    setTimeout(() => {
      console.log("File uploaded:", file.name)
      setUploadingFile(false)
    }, 2000)
  }

  const handleReaction = (messageId: string, emoji: string) => {
    console.log(`Reacted with ${emoji} to message ${messageId}`)
    setMessageContextMenu(null)
  }

  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyingTo(message)
    messageInputRef.current?.focus()
    setMessageContextMenu(null)
  }

  const handleNudgeSend = (message: string) => {
    console.log("Nudge sent:", message)
    setShowNudgeModal(false)
  }

  const handleRetry = () => {
    setIsRetrying(true)
    console.log("Retrying connection...")
    setTimeout(() => {
      setIsRetrying(false)
    }, 2000)
  }

  const getStatusIcon = (status: ChatMessage["status"]) => {
    switch (status) {
      case "sending":
        return <Clock className="h-3 w-3 text-gray-400" />
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center max-w-sm w-full">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600 text-sm">Loading partner information...</p>
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
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Couldn't load partner information</h3>
            <p className="text-gray-600 mb-4 text-sm">Please check your connection and try again.</p>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2 mx-auto text-sm"
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
      <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Partner Header - Fixed */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative flex-shrink-0">
                <img
                  src={partner.profilePicture || "/placeholder.svg"}
                  alt={partner.username}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-400"
                    }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{partner.username}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">
                      {partner.localTime} ({partner.timezone})
                    </span>
                  </div>
                  {!isOnline && partner.lastActive && (
                    <div className="flex items-center gap-1">
                      <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">Last seen {formatTime(partner.lastActive)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="Compare progress"
              >
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Fixed */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 flex-shrink-0">
          <div className="flex">
            {[
              { id: "day", label: "Day", fullLabel: "Partner's Day", icon: Calendar },
              { id: "activity", label: "Activity", fullLabel: "Activity Feed", icon: Target },
              { id: "chat", label: "Chat", fullLabel: "Chat", icon: MessageSquare, badge: unreadMessages },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors relative min-w-0 ${activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.fullLabel}</span>
                <span className="sm:hidden truncate">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center flex-shrink-0">
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content - Flexible */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "day" && (
            <div className="h-full overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{partner.username}'s Day</h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Track your partner's progress and offer support
                    </p>
                  </div>

                  {tasks.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No tasks scheduled</h3>
                      <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
                        Looks like {partner.username} hasn't scheduled any tasks for today.
                      </p>
                      <button
                        onClick={() => setActiveTab("chat")}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                      >
                        Send encouragement
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {tasks.map((task) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                <div
                                  className={`w-3 h-3 rounded-full flex-shrink-0 ${task.status === "completed"
                                    ? "bg-green-500"
                                    : task.status === "awaiting-verification"
                                      ? "bg-yellow-500"
                                      : task.status === "skipped"
                                        ? "bg-gray-400"
                                        : task.timeScheduled && task.timeScheduled < new Date()
                                          ? "bg-red-500"
                                          : "bg-blue-500"
                                    }`}
                                />
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                  {task.description}
                                </h3>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${task.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : task.status === "awaiting-verification"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : task.status === "skipped"
                                        ? "bg-gray-100 text-gray-800"
                                        : task.timeScheduled && task.timeScheduled < new Date()
                                          ? "bg-red-100 text-red-800"
                                          : "bg-blue-100 text-blue-800"
                                    }`}
                                >
                                  {task.status === "awaiting-verification"
                                    ? "Needs Verification"
                                    : task.status === "completed"
                                      ? "Completed"
                                      : task.status === "skipped"
                                        ? "Skipped"
                                        : task.timeScheduled && task.timeScheduled < new Date()
                                          ? "Overdue"
                                          : "To Do"}
                                </span>
                              </div>

                              {task.scheduledTime && (
                                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-3">
                                  <Timer className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span>{task.scheduledTime}</span>
                                  {task.timeScheduled && task.timeScheduled < new Date() && task.status === "todo" && (
                                    <span className="text-red-600 font-medium">
                                      ({Math.floor((new Date().getTime() - task.timeScheduled.getTime()) / (1000 * 60))}{" "}
                                      min overdue)
                                    </span>
                                  )}
                                </div>
                              )}

                              {task.progress && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-1">
                                    <span>Progress</span>
                                    <span>
                                      {task.progress.current}/{task.progress.total} {task.progress.unit}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${(task.progress.current / task.progress.total) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {task.attachments?.notes && (
                                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                  <p className="text-xs sm:text-sm text-gray-700 break-words">
                                    {task.attachments.notes}
                                  </p>
                                </div>
                              )}

                              {task.attachments?.photos && (
                                <div className="flex gap-2 mb-3 overflow-x-auto">
                                  {task.attachments.photos.map((photo, index) => (
                                    <img
                                      key={index}
                                      src={photo || "/placeholder.svg"}
                                      alt="Task attachment"
                                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                                      onClick={() => setExpandedImage(photo)}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                              {task.status === "awaiting-verification" && (
                                <button
                                  onClick={() => {
                                    setSelectedTask(task)
                                    setShowTaskDetail(true)
                                  }}
                                  className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs sm:text-sm hover:bg-blue-600 transition-colors whitespace-nowrap"
                                >
                                  Review
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setActiveTab("chat")
                                  setNewMessage(`Great work on "${task.description}"! `)
                                }}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                aria-label="Send message about this task"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="h-full overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Activity Feed</h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Stay updated on {partner.username}'s progress and achievements
                    </p>
                  </div>

                  {activities.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <Target className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                      <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
                        When {partner.username} completes tasks, writes reflections, or achieves milestones, they will
                        appear here.
                      </p>
                      <button
                        onClick={() => setActiveTab("chat")}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                      >
                        Encourage them in chat!
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      {activities.map((activity) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`bg-white rounded-xl border p-4 sm:p-6 hover:shadow-md transition-shadow ${activity.type === "achievement"
                            ? "border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50"
                            : activity.type === "duo-challenge"
                              ? "border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50"
                              : "border-gray-200"
                            }`}
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="flex-shrink-0">
                              {activity.type === "achievement" && (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                                  <Award className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-pulse" />
                                </div>
                              )}
                              {activity.type === "duo-challenge" && (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-full flex items-center justify-center">
                                  <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white animate-pulse" />
                                </div>
                              )}
                              {activity.type === "task-completion" && (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                              )}
                              {activity.type === "reflection" && (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                              )}
                              {activity.type === "system-update" && (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-500 rounded-full flex items-center justify-center">
                                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                                  {activity.summary}
                                </h3>
                                <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
                                  {formatTime(activity.timestamp)}
                                </span>
                              </div>

                              {activity.details?.notes && (
                                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                  <p className="text-xs sm:text-sm text-gray-700 break-words">
                                    {activity.details.notes}
                                  </p>
                                </div>
                              )}

                              {activity.details?.photo && (
                                <div className="mb-3">
                                  <img
                                    src={activity.details.photo || "/placeholder.svg"}
                                    alt="Activity attachment"
                                    className="w-24 h-18 sm:w-32 sm:h-24 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                      if (activity.details?.photo) {
                                        setExpandedImage(activity.details.photo);
                                      }
                                    }}
                                  />
                                </div>
                              )}

                              {activity.type === "duo-challenge" && activity.details?.challengeText && (
                                <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-3 sm:p-4 mb-3">
                                  <p className="text-xs sm:text-sm text-gray-800 mb-3 break-words">
                                    {activity.details.challengeText}
                                  </p>
                                  <button className="bg-purple-500 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm hover:bg-purple-600 transition-colors">
                                    Accept Challenge
                                  </button>
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
                                  {QUICK_REACTIONS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(activity.id, emoji)}
                                      className={`p-1 rounded hover:bg-gray-100 transition-colors flex-shrink-0 ${activity.reactions?.some((r) => r.emoji === emoji) ? "bg-blue-50" : ""
                                        }`}
                                    >
                                      <span className="text-base sm:text-lg">{emoji}</span>
                                    </button>
                                  ))}
                                </div>
                                <button
                                  onClick={() => {
                                    setActiveTab("chat")
                                    setNewMessage(`About your ${activity.type.replace("-", " ")}: `)
                                  }}
                                  className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-colors flex-shrink-0"
                                >
                                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                  Comment
                                </button>
                              </div>

                              {activity.reactions && activity.reactions.length > 0 && (
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                                  {activity.reactions.map((reaction, index) => (
                                    <span key={index} className="text-sm">
                                      {reaction.emoji}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {activity.comments && activity.comments.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  {activity.comments.map((comment, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg p-3 mb-2">
                                      <p className="text-xs sm:text-sm text-gray-700 break-words">{comment.text}</p>
                                      <span className="text-xs text-gray-500 mt-1">
                                        {formatTime(comment.timestamp)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="flex-1 h-full">
              <ChatInterface
                partnerName={partner.username}
                partnerAvatar={partner.profilePicture}
                partnerInitials={partner.initials}
                isPartnerOnline={isOnline}
                partnerLastSeen={partner.lastActive}
              />
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />

        {/* Context Menu */}
        <AnimatePresence>
          {messageContextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="context-menu fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              style={{
                left: Math.min(messageContextMenu.x, window.innerWidth - 220),
                top: Math.min(messageContextMenu.y, window.innerHeight - 120),
              }}
            >
              <div className="px-3 py-2 border-b border-gray-100">
                <div className="text-xs text-gray-500 mb-2">React with:</div>
                <div className="grid grid-cols-6 gap-1">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleReaction(messageContextMenu.messageId, emoji)
                        setMessageContextMenu(null)
                      }}
                      className="p-2 hover:bg-gray-50 rounded text-lg transition-colors flex items-center justify-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  const message = messages.find((m) => m.id === messageContextMenu.messageId)
                  if (message) {
                    handleReplyToMessage(message)
                  }
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Reply className="h-4 w-4" />
                Reply
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nudge Modal */}
        <AnimatePresence>
          {showNudgeModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowNudgeModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Send a Nudge</h3>
                  <button
                    onClick={() => setShowNudgeModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-gray-600 mb-4 text-sm">Send {partner.username} a gentle nudge to encourage them!</p>
                <div className="space-y-2">
                  {NUDGE_MESSAGES.map((message, index) => (
                    <button
                      key={index}
                      onClick={() => handleNudgeSend(message)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-yellow-50 hover:border-yellow-300 transition-colors text-sm"
                    >
                      {message}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded Image Modal */}
        <AnimatePresence>
          {expandedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
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
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
                <button
                  onClick={() => setExpandedImage(null)}
                  className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-colors"
                  aria-label="Close image"
                >
                  <X className="h-5 w-5" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task Detail Modal */}
        <AnimatePresence>
          {showTaskDetail && selectedTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowTaskDetail(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl p-4 sm:p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Task Verification</h3>
                  <button
                    onClick={() => setShowTaskDetail(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{selectedTask.description}</h4>
                    <p className="text-sm text-gray-600">Scheduled for {selectedTask.scheduledTime}</p>
                  </div>

                  {selectedTask.attachments?.notes && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Notes</h5>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 break-words">{selectedTask.attachments.notes}</p>
                      </div>
                    </div>
                  )}

                  {selectedTask.attachments?.photos && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Photos</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedTask.attachments.photos.map((photo, index) => (
                          <img
                            key={index}
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
                    <button
                      onClick={() => {
                        console.log("Approving task:", selectedTask.id)
                        setShowTaskDetail(false)
                      }}
                      className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setShowTaskDetail(false)
                        setActiveTab("chat")
                        setNewMessage(`About your "${selectedTask.description}" task: `)
                      }}
                      className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                      Ask Question
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MouseGlowEffect removed - component requires children */}
      </div>
    </DashboardLayout>
  )
}
