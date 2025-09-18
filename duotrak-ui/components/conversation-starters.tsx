"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, MessageCircle, Heart, Target, Zap, Coffee, Sun, Moon, X, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"

interface ConversationStartersProps {
  partnerName: string
  partnerMood?: string
  timeOfDay: "morning" | "afternoon" | "evening" | "night"
  recentActivity?: string
  onStarterSelect: (starter: string) => void
  onDismiss: () => void
  isVisible: boolean
}

const CONVERSATION_STARTERS = {
  morning: [
    "Good morning! How are you feeling about today's goals? ☀️",
    "Hope you're having a great start to your day! 🌅",
    "What's the first thing you're tackling today?",
    "Morning motivation coming your way! 💪",
    "Ready to crush another day together? 🚀",
  ],
  afternoon: [
    "How's your day going so far? 🌞",
    "Checking in on your progress! How are you feeling?",
    "Need any encouragement for the rest of the day?",
    "What's been your biggest win today? 🎉",
    "Afternoon energy boost coming your way! ⚡",
  ],
  evening: [
    "How did today go for you? 🌅",
    "Reflecting on the day - what went well?",
    "Ready to wind down? How are you feeling? 😌",
    "What's one thing you're proud of today?",
    "Evening check-in! How can I support you? 💙",
  ],
  night: [
    "Hope you had a good day! 🌙",
    "How are you feeling about tomorrow?",
    "Time to rest - you've earned it! 😴",
    "What's one positive from today?",
    "Sweet dreams! Tomorrow's another chance to shine ✨",
  ],
}

const MOOD_BASED_STARTERS = {
  excited: [
    "I can feel your energy! What's got you so pumped? 🤩",
    "Your excitement is contagious! Tell me more! ⚡",
    "Love seeing you this motivated! 🔥",
  ],
  focused: [
    "I see you're in the zone! How's the focus going? 🎯",
    "Deep work mode activated? You've got this! 💪",
    "Loving the dedication! Keep it up! 🚀",
  ],
  tired: [
    "Take it easy today - you're doing great! 😌",
    "Rest is part of the process. How can I help? 💙",
    "Even small steps count. You're amazing! ✨",
  ],
  motivated: [
    "Your motivation is inspiring! What's driving you? 💪",
    "Love seeing you fired up! Let's go! 🔥",
    "That energy is everything! Keep pushing! 🚀",
  ],
}

const ACTIVITY_BASED_STARTERS = {
  "task-completion": [
    "Saw you complete a task! How did it feel? 🎉",
    "Amazing work on that task! Tell me about it! 💪",
    "You're on fire today! What's next? 🔥",
  ],
  achievement: [
    "Congratulations on your achievement! 🏆",
    "You earned that badge! How does it feel? ✨",
    "So proud of your progress! Keep going! 🌟",
  ],
  streak: [
    "Your streak is incredible! How do you stay consistent? 🔥",
    "Streak master! What's your secret? 💪",
    "That consistency is paying off! Amazing! 🚀",
  ],
}

const SUPPORTIVE_STARTERS = [
  "How can I support you better? 💙",
  "What's challenging you most right now?",
  "Remember: progress over perfection! 🌟",
  "You're doing better than you think! ✨",
  "What would make today feel like a win? 🎯",
  "I believe in you! What do you need? 💪",
]

const getTimeIcon = (timeOfDay: string) => {
  switch (timeOfDay) {
    case "morning":
      return Sun
    case "afternoon":
      return Coffee
    case "evening":
      return Sun
    case "night":
      return Moon
    default:
      return MessageCircle
  }
}

export default function ConversationStarters({
  partnerName,
  partnerMood,
  timeOfDay,
  recentActivity,
  onStarterSelect,
  onDismiss,
  isVisible,
}: ConversationStartersProps) {
  const [currentStarters, setCurrentStarters] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    generateStarters()
  }, [partnerMood, timeOfDay, recentActivity])

  const generateStarters = () => {
    let starters: string[] = []

    // Add time-based starters
    starters = [...starters, ...CONVERSATION_STARTERS[timeOfDay].slice(0, 2)]

    // Add mood-based starters if mood is available
    if (partnerMood && MOOD_BASED_STARTERS[partnerMood as keyof typeof MOOD_BASED_STARTERS]) {
      starters = [...starters, ...MOOD_BASED_STARTERS[partnerMood as keyof typeof MOOD_BASED_STARTERS].slice(0, 1)]
    }

    // Add activity-based starters if recent activity
    if (recentActivity && ACTIVITY_BASED_STARTERS[recentActivity as keyof typeof ACTIVITY_BASED_STARTERS]) {
      starters = [
        ...starters,
        ...ACTIVITY_BASED_STARTERS[recentActivity as keyof typeof ACTIVITY_BASED_STARTERS].slice(0, 1),
      ]
    }

    // Add supportive starters
    starters = [...starters, ...SUPPORTIVE_STARTERS.slice(0, 2)]

    // Shuffle and limit
    const shuffled = starters.sort(() => Math.random() - 0.5)
    setCurrentStarters(shuffled.slice(0, 6))
  }

  const TimeIcon = getTimeIcon(timeOfDay)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-blue-200 shadow-lg backdrop-blur-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <TimeIcon className="w-4 h-4" />
                  Start a conversation with {partnerName}
                </h3>
                <p className="text-sm text-gray-600">Choose a conversation starter or create your own</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={generateStarters}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title="Generate new starters"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onDismiss}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Conversation Starters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentStarters.slice(0, showAll ? currentStarters.length : 4).map((starter, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStarterSelect(starter)}
                className="group bg-white/80 backdrop-blur-sm text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 group-hover:from-blue-500 group-hover:to-purple-600 transition-all"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                  </motion.div>
                  <p className="text-sm text-gray-700 group-hover:text-gray-900 leading-relaxed flex-1">{starter}</p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Show More/Less Button */}
          {currentStarters.length > 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAll(!showAll)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                {showAll ? "Show less" : `Show ${currentStarters.length - 4} more`}
              </motion.button>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStarterSelect("How are you feeling today? 😊")}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 rounded-lg hover:from-pink-200 hover:to-rose-200 transition-all text-sm font-medium"
              >
                <Heart className="w-4 h-4" />
                Check-in
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStarterSelect("You're doing amazing! Keep it up! 💪")}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-lg hover:from-green-200 hover:to-emerald-200 transition-all text-sm font-medium"
              >
                <Zap className="w-4 h-4" />
                Motivate
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStarterSelect("What's your biggest goal right now? 🎯")}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-lg hover:from-blue-200 hover:to-indigo-200 transition-all text-sm font-medium"
              >
                <Target className="w-4 h-4" />
                Goals
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
