"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Flame, Zap, Star, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

interface DuoStreakHeroProps {
  streakCount?: number
  partnerName?: string
  userProgress?: boolean
  partnerProgress?: boolean
  hasPartner?: boolean
}

export default function DuoStreakHero({
  streakCount = 7,
  partnerName = "John",
  userProgress = true,
  partnerProgress = false,
  hasPartner = true,
}: DuoStreakHeroProps) {
  const [displayCount, setDisplayCount] = useState(0)
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [showMilestone, setShowMilestone] = useState(false)

  // Check if current streak is a milestone
  const isMilestone = (count: number) => {
    return count > 0 && (count % 7 === 0 || count % 10 === 0 || count === 1 || count === 3 || count === 5)
  }

  // Animate streak counter on mount and updates
  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0
      const increment = Math.ceil(streakCount / 20)
      const counter = setInterval(() => {
        current += increment
        if (current >= streakCount) {
          current = streakCount
          clearInterval(counter)

          // Trigger celebration for milestones
          if (isMilestone(streakCount)) {
            setIsCelebrating(true)
            setShowMilestone(true)
            setTimeout(() => {
              setIsCelebrating(false)
              setTimeout(() => setShowMilestone(false), 2000)
            }, 1500)
          }
        }
        setDisplayCount(current)
      }, 50)
    }, 500)

    return () => clearTimeout(timer)
  }, [streakCount])

  const getMotivationalMessage = () => {
    if (!hasPartner) return "Start your streak journey!"

    if (streakCount === 1) return `You and ${partnerName} just started something amazing!`
    if (streakCount < 7) return `You and ${partnerName} are building momentum!`
    if (streakCount < 30) return `You and ${partnerName} are unstoppable!`
    if (streakCount < 100) return `Fantastic teamwork with ${partnerName}!`
    return `You and ${partnerName} are streak legends!`
  }

  const getMilestoneMessage = () => {
    if (streakCount === 1) return "First day together! 🎉"
    if (streakCount === 7) return "One week strong! 🔥"
    if (streakCount === 30) return "One month milestone! 🏆"
    if (streakCount === 100) return "Century club! 💯"
    if (streakCount % 10 === 0) return `${streakCount} days of excellence! ⭐`
    return "Milestone achieved! 🎊"
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative overflow-hidden bg-gradient-to-br from-white to-pearl-gray dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-lg border border-cool-gray dark:border-gray-700"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-4 left-4 w-8 h-8 bg-primary-blue rounded-full"></div>
        <div className="absolute top-12 right-8 w-4 h-4 bg-accent-light-blue rounded-full"></div>
        <div className="absolute bottom-8 left-12 w-6 h-6 bg-primary-blue rounded-full"></div>
        <div className="absolute bottom-4 right-4 w-3 h-3 bg-accent-light-blue rounded-full"></div>
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {isCelebrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Celebration particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  scale: 0,
                  x: "50%",
                  y: "50%",
                  rotate: 0,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5],
                  x: `${50 + (Math.random() - 0.5) * 200}%`,
                  y: `${50 + (Math.random() - 0.5) * 200}%`,
                  rotate: 360,
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
                className="absolute w-2 h-2 bg-primary-blue rounded-full"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {/* Main Content */}
        <div className="text-center space-y-6">
          {/* Duo Visual Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.3,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="flex justify-center"
          >
            <motion.div
              animate={
                isCelebrating
                  ? {
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0],
                    }
                  : {
                      scale: [1, 1.05, 1],
                    }
              }
              transition={{
                duration: isCelebrating ? 0.6 : 2,
                repeat: isCelebrating ? 2 : Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
              className="relative"
            >
              {/* Main flame icon with gradient effect */}
              <div className="relative">
                <Flame className="w-16 h-16 text-primary-blue" />
                <Flame className="w-16 h-16 text-orange-500 absolute top-0 left-0 opacity-60" />

                {/* Glow effect */}
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 bg-primary-blue rounded-full blur-xl opacity-30"
                />
              </div>

              {/* Duo indicator - two small flames */}
              <div className="absolute -top-2 -right-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                >
                  <Zap className="w-6 h-6 text-yellow-500" />
                </motion.div>
              </div>
            </motion.div>
          </motion.div>

          {/* Streak Counter */}
          <div className="space-y-2">
            <motion.div
              key={displayCount}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className="text-6xl md:text-7xl font-black text-charcoal dark:text-gray-100"
            >
              {displayCount}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-lg font-bold text-primary-blue uppercase tracking-wider"
            >
              {streakCount === 1 ? "DAY STREAK!" : "DAYS CRUSHED TOGETHER!"}
            </motion.p>
          </div>

          {/* Motivational Message */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-stone-gray dark:text-gray-300 font-medium text-lg max-w-md mx-auto"
          >
            {getMotivationalMessage()}
          </motion.p>

          {/* Daily Progress Indicators */}
          {hasPartner && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex justify-center space-x-6"
            >
              <div className="text-center">
                <motion.div
                  animate={userProgress ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 ${
                    userProgress
                      ? "bg-primary-blue border-primary-blue text-white"
                      : "border-cool-gray dark:border-gray-600 text-cool-gray dark:text-gray-600"
                  }`}
                >
                  {userProgress && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}>
                      <Star className="w-4 h-4 fill-current" />
                    </motion.div>
                  )}
                </motion.div>
                <p className="text-xs text-stone-gray dark:text-gray-400 font-medium">You</p>
              </div>

              <div className="text-center">
                <motion.div
                  animate={partnerProgress ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mb-2 ${
                    partnerProgress
                      ? "bg-primary-blue border-primary-blue text-white"
                      : "border-cool-gray dark:border-gray-600 text-cool-gray dark:text-gray-600"
                  }`}
                >
                  {partnerProgress && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}>
                      <Star className="w-4 h-4 fill-current" />
                    </motion.div>
                  )}
                </motion.div>
                <p className="text-xs text-stone-gray dark:text-gray-400 font-medium">{partnerName}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Milestone Celebration Banner */}
        <AnimatePresence>
          {showMilestone && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary-blue to-accent-light-blue text-white px-6 py-2 rounded-full shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-sm">{getMilestoneMessage()}</span>
                <Sparkles className="w-4 h-4" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  )
}
