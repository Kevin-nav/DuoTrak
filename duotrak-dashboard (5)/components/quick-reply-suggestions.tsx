"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Sparkles } from "lucide-react"
import { useState, useEffect } from "react"

interface QuickReplySuggestionsProps {
  isVisible: boolean
  context?: "task-completion" | "achievement" | "check-in" | "motivation" | "general"
  partnerName: string
  onReplySelect: (reply: string) => void
  onDismiss: () => void
}

const REPLY_SUGGESTIONS = {
  "task-completion": [
    { text: "Amazing work! 🎉", icon: "🎉", color: "from-green-400 to-blue-500" },
    { text: "You're crushing it! 💪", icon: "💪", color: "from-red-400 to-pink-500" },
    { text: "So proud of you! ❤️", icon: "❤️", color: "from-pink-400 to-rose-500" },
    { text: "Keep it up! 🔥", icon: "🔥", color: "from-orange-400 to-red-500" },
    { text: "That's incredible! ✨", icon: "✨", color: "from-yellow-400 to-orange-500" },
    { text: "You inspire me! 🌟", icon: "🌟", color: "from-purple-400 to-indigo-500" },
  ],
  achievement: [
    { text: "Congratulations! 🏆", icon: "🏆", color: "from-yellow-400 to-orange-500" },
    { text: "You earned it! 🎊", icon: "🎊", color: "from-purple-400 to-pink-500" },
    { text: "So well deserved! 👏", icon: "👏", color: "from-blue-400 to-indigo-500" },
    { text: "Absolutely amazing! 🚀", icon: "🚀", color: "from-green-400 to-blue-500" },
    { text: "You're a champion! 💎", icon: "💎", color: "from-indigo-400 to-purple-500" },
  ],
  "check-in": [
    { text: "How are you feeling? 😊", icon: "😊", color: "from-blue-400 to-cyan-500" },
    { text: "Thinking of you! 💭", icon: "💭", color: "from-purple-400 to-pink-500" },
    { text: "Hope you're well! 🌸", icon: "🌸", color: "from-pink-400 to-rose-500" },
    { text: "Sending good vibes! ✨", icon: "✨", color: "from-yellow-400 to-orange-500" },
    { text: "You've got this! 💪", icon: "💪", color: "from-red-400 to-pink-500" },
  ],
  motivation: [
    { text: "You're unstoppable! 🚀", icon: "🚀", color: "from-blue-400 to-indigo-500" },
    { text: "Believe in yourself! ⭐", icon: "⭐", color: "from-yellow-400 to-orange-500" },
    { text: "One step at a time! 👣", icon: "👣", color: "from-green-400 to-blue-500" },
    { text: "Progress over perfection! 📈", icon: "📈", color: "from-purple-400 to-indigo-500" },
    { text: "You're amazing! 🌟", icon: "🌟", color: "from-pink-400 to-rose-500" },
  ],
  general: [
    { text: "That's awesome! 😍", icon: "😍", color: "from-pink-400 to-rose-500" },
    { text: "Love it! ❤️", icon: "❤️", color: "from-red-400 to-pink-500" },
    { text: "So cool! 😎", icon: "😎", color: "from-blue-400 to-indigo-500" },
    { text: "Interesting! 🤔", icon: "🤔", color: "from-purple-400 to-indigo-500" },
    { text: "Tell me more! 💬", icon: "💬", color: "from-green-400 to-blue-500" },
  ],
}

const CONTEXTUAL_REPLIES = [
  "How did that make you feel?",
  "What's next on your list?",
  "I'm so proud of your consistency!",
  "Your dedication is inspiring!",
  "Want to celebrate together?",
]

export default function QuickReplySuggestions({
  isVisible,
  context = "general",
  partnerName,
  onReplySelect,
  onDismiss,
}: QuickReplySuggestionsProps) {
  const [currentSuggestions, setCurrentSuggestions] = useState(REPLY_SUGGESTIONS[context])
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    setCurrentSuggestions(REPLY_SUGGESTIONS[context])
  }, [context])

  const handleReplySelect = (reply: string) => {
    onReplySelect(reply)
    onDismiss()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200 backdrop-blur-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                <Sparkles className="w-5 h-5 text-blue-500" />
              </motion.div>
              <h4 className="font-medium text-gray-800 text-sm">Quick replies</h4>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </motion.button>
          </div>

          {/* Quick Reply Chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {currentSuggestions.slice(0, showMore ? currentSuggestions.length : 4).map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleReplySelect(suggestion.text)}
                className={`group relative overflow-hidden bg-gradient-to-r ${suggestion.color} text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200`}
              >
                <motion.div whileHover={{ x: [0, 5, 0] }} className="flex items-center gap-2">
                  <span className="text-base">{suggestion.icon}</span>
                  <span>{suggestion.text}</span>
                </motion.div>

                {/* Shimmer effect */}
                <motion.div
                  animate={{ x: [-100, 200] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
              </motion.button>
            ))}
          </div>

          {/* Show More/Less */}
          {currentSuggestions.length > 4 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowMore(!showMore)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-3"
            >
              {showMore ? "Show less" : `Show ${currentSuggestions.length - 4} more`}
            </motion.button>
          )}

          {/* Contextual Suggestions */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500 mb-2">Or try these:</p>
            <div className="space-y-1">
              {CONTEXTUAL_REPLIES.slice(0, 2).map((reply, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ x: 5, backgroundColor: "#f3f4f6" }}
                  onClick={() => handleReplySelect(reply)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                >
                  {reply}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Custom Reply Prompt */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-3 pt-3 border-t border-gray-100"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleReplySelect("")}
              className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
            >
              💬 Write your own message
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
