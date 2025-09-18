"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, User, Users, Sparkles } from "lucide-react"
import { useState } from "react"
import MouseGlowEffect from "./mouse-glow-effect"

interface GoalTypeSelectorProps {
  onClose: () => void
  onSelectType: (type: "personal" | "shared") => void
  hasPartner?: boolean
  partnerName?: string
}

export default function GoalTypeSelector({
  onClose,
  onSelectType,
  hasPartner = true,
  partnerName = "John",
}: GoalTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<"personal" | "shared" | null>(null)

  const handleContinue = () => {
    if (selectedType) {
      onSelectType(selectedType)
    }
  }

  return (
    <div className="min-h-screen bg-pearl-gray dark:bg-gray-900 pt-16 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-charcoal dark:text-gray-100" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100">Create New Goal</h1>
            <p className="text-sm text-stone-gray dark:text-gray-400">Choose your goal type</p>
          </div>
          <div className="w-10" />
        </motion.div>

        {/* Goal Type Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 mb-6"
        >
          <div className="text-center mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="w-16 h-16 mx-auto mb-4"
            >
              <Sparkles className="w-16 h-16 text-primary-blue" />
            </motion.div>
            <h2 className="text-xl font-bold text-charcoal dark:text-gray-100 mb-2">What kind of goal?</h2>
            <p className="text-stone-gray dark:text-gray-300">
              Choose whether this goal is just for you or something you want to achieve together
            </p>
          </div>

          <div className="space-y-4">
            {/* Personal Goal Option */}
            <MouseGlowEffect glowColor="#19A1E5" intensity="medium">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedType("personal")}
                className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                  selectedType === "personal"
                    ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10 shadow-lg"
                    : "border-cool-gray dark:border-gray-600 hover:border-primary-blue hover:shadow-md"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <motion.div
                    animate={selectedType === "personal" ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5 }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedType === "personal"
                        ? "bg-primary-blue text-white"
                        : "bg-pearl-gray dark:bg-gray-700 text-stone-gray dark:text-gray-400"
                    }`}
                  >
                    <User className="w-6 h-6" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-charcoal dark:text-gray-100 mb-2">Just for Me</h3>
                    <p className="text-stone-gray dark:text-gray-300 text-sm leading-relaxed">
                      Create a personal goal with AI-powered routines, photo verification, and progress tracking
                      designed just for you.
                    </p>
                    <div className="mt-3 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-stone-gray dark:text-gray-400">
                        Perfect for building personal habits
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            </MouseGlowEffect>

            {/* Shared Goal Option */}
            <MouseGlowEffect glowColor={hasPartner ? "#10B981" : "#9CA3AF"} intensity={hasPartner ? "medium" : "low"}>
              <motion.button
                whileHover={hasPartner ? { scale: 1.02 } : {}}
                whileTap={hasPartner ? { scale: 0.98 } : {}}
                onClick={() => hasPartner && setSelectedType("shared")}
                disabled={!hasPartner}
                className={`w-full p-6 rounded-xl border-2 transition-all text-left relative overflow-hidden ${
                  !hasPartner
                    ? "border-cool-gray dark:border-gray-600 opacity-60 cursor-not-allowed"
                    : selectedType === "shared"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg"
                      : "border-cool-gray dark:border-gray-600 hover:border-green-500 hover:shadow-md"
                }`}
              >
                {hasPartner && selectedType === "shared" && (
                  <motion.div
                    animate={{ x: [-100, 200] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-green-200/30 to-transparent skew-x-12"
                  />
                )}

                <div className="flex items-start space-x-4 relative z-10">
                  <motion.div
                    animate={selectedType === "shared" ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5 }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      !hasPartner
                        ? "bg-cool-gray dark:bg-gray-700 text-stone-gray dark:text-gray-500"
                        : selectedType === "shared"
                          ? "bg-green-500 text-white"
                          : "bg-pearl-gray dark:bg-gray-700 text-stone-gray dark:text-gray-400"
                    }`}
                  >
                    <Users className="w-6 h-6" />
                  </motion.div>
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-bold mb-2 ${
                        hasPartner ? "text-charcoal dark:text-gray-100" : "text-stone-gray dark:text-gray-500"
                      }`}
                    >
                      With My Duo
                    </h3>
                    <p
                      className={`text-sm leading-relaxed ${
                        hasPartner ? "text-stone-gray dark:text-gray-300" : "text-stone-gray dark:text-gray-500"
                      }`}
                    >
                      {hasPartner
                        ? `Create a shared goal with ${partnerName}. Both of you get personalized routines and can verify each other's progress.`
                        : "You need a partner to create shared goals. Invite someone to join you first!"}
                    </p>
                    <div className="mt-3 flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          hasPartner ? "bg-green-500" : "bg-stone-gray dark:bg-gray-500"
                        }`}
                      ></div>
                      <span
                        className={`text-xs ${
                          hasPartner ? "text-stone-gray dark:text-gray-400" : "text-stone-gray dark:text-gray-500"
                        }`}
                      >
                        {hasPartner ? "Great for accountability and motivation" : "Partner required"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            </MouseGlowEffect>
          </div>
        </motion.div>

        {/* Continue Button */}
        <AnimatePresence>
          {selectedType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-center"
            >
              <MouseGlowEffect glowColor="#19A1E5" intensity="high">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(25, 161, 229, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleContinue}
                  className="px-8 py-4 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-xl font-semibold transition-all flex items-center space-x-2 relative overflow-hidden"
                >
                  <motion.div
                    animate={{ x: [-100, 200] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  />
                  <span className="relative z-10">
                    Continue with {selectedType === "personal" ? "Personal" : "Shared"} Goal
                  </span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    className="relative z-10"
                  >
                    →
                  </motion.div>
                </motion.button>
              </MouseGlowEffect>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-stone-gray dark:text-gray-400">
            💡 You can always create both types of goals. Personal goals are great for individual habits, while shared
            goals help you stay accountable with your partner.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
