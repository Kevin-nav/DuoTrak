"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

interface CelebrationAnimationProps {
  isVisible: boolean
  type: "task-complete" | "achievement" | "streak" | "goal-reached"
  message?: string
  onComplete?: () => void
}

const CELEBRATION_CONFIGS = {
  "task-complete": {
    emoji: "🎉",
    colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1"],
    message: "Task Completed!",
    duration: 2000,
  },
  achievement: {
    emoji: "🏆",
    colors: ["#FFD700", "#FFA500", "#FF4500", "#DC143C"],
    message: "Achievement Unlocked!",
    duration: 3000,
  },
  streak: {
    emoji: "🔥",
    colors: ["#FF4500", "#FF6347", "#FFD700", "#FFA500"],
    message: "Streak Milestone!",
    duration: 2500,
  },
  "goal-reached": {
    emoji: "🌟",
    colors: ["#9B59B6", "#E74C3C", "#F39C12", "#27AE60"],
    message: "Goal Achieved!",
    duration: 3500,
  },
}

const Confetti = ({ color, delay }: { color: string; delay: number }) => (
  <motion.div
    initial={{
      opacity: 1,
      scale: 0,
      x: 0,
      y: 0,
      rotate: 0,
    }}
    animate={{
      opacity: [1, 1, 0],
      scale: [0, 1, 0.8],
      x: Math.random() * 400 - 200,
      y: Math.random() * 300 + 100,
      rotate: Math.random() * 720,
    }}
    transition={{
      duration: 2,
      delay,
      ease: "easeOut",
    }}
    className="absolute w-3 h-3 rounded-full pointer-events-none"
    style={{ backgroundColor: color }}
  />
)

const FloatingEmoji = ({ emoji, delay }: { emoji: string; delay: number }) => (
  <motion.div
    initial={{
      opacity: 0,
      scale: 0,
      y: 50,
    }}
    animate={{
      opacity: [0, 1, 1, 0],
      scale: [0, 1.5, 1.2, 0],
      y: [50, -100, -150, -200],
      rotate: [0, 10, -10, 0],
    }}
    transition={{
      duration: 2.5,
      delay,
      ease: "easeOut",
    }}
    className="absolute text-4xl pointer-events-none"
    style={{
      left: `${20 + Math.random() * 60}%`,
    }}
  >
    {emoji}
  </motion.div>
)

const Sparkle = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{
      opacity: 0,
      scale: 0,
      rotate: 0,
    }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      rotate: [0, 180, 360],
    }}
    transition={{
      duration: 1.5,
      delay,
      ease: "easeOut",
    }}
    className="absolute w-6 h-6 pointer-events-none"
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }}
  >
    ✨
  </motion.div>
)

export default function CelebrationAnimation({ isVisible, type, message, onComplete }: CelebrationAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false)
  const config = CELEBRATION_CONFIGS[type]

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true)
      const timer = setTimeout(() => {
        setShowAnimation(false)
        onComplete?.()
      }, config.duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, config.duration, onComplete])

  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        >
          {/* Background overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black"
          />

          {/* Confetti */}
          {Array.from({ length: 50 }).map((_, i) => (
            <Confetti key={`confetti-${i}`} color={config.colors[i % config.colors.length]} delay={i * 0.02} />
          ))}

          {/* Floating emojis */}
          {Array.from({ length: 8 }).map((_, i) => (
            <FloatingEmoji key={`emoji-${i}`} emoji={config.emoji} delay={i * 0.1} />
          ))}

          {/* Sparkles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <Sparkle key={`sparkle-${i}`} delay={i * 0.05} />
          ))}

          {/* Main message */}
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: -50 }}
            transition={{ duration: 0.5, ease: "backOut" }}
            className="relative z-10 text-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: 2,
                ease: "easeInOut",
              }}
              className="text-8xl mb-4"
            >
              {config.emoji}
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold text-white mb-2 drop-shadow-lg"
            >
              {message || config.message}
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="text-2xl"
            >
              🎊
            </motion.div>
          </motion.div>

          {/* Radial burst effect */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-4 border-yellow-400"
            style={{
              background: `radial-gradient(circle, ${config.colors[0]}20 0%, transparent 70%)`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
