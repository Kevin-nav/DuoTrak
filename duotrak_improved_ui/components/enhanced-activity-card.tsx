"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Eye, AlertCircle } from "lucide-react"
import { useState } from "react"
import MouseGlowEffect from "./mouse-glow-effect"

interface EnhancedActivityCardProps {
  pendingVerifications?: number
}

export default function EnhancedActivityCard({ pendingVerifications = 1 }: EnhancedActivityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showUrgency, setShowUrgency] = useState(false)

  return (
    <MouseGlowEffect glowColor="#E6F4FD" intensity="high">
      <motion.div
        whileHover={{ scale: 1.01 }}
        onHoverStart={() => setShowUrgency(true)}
        onHoverEnd={() => setShowUrgency(false)}
        className="bg-accent-light-blue dark:bg-primary-blue/10 border border-primary-blue/20 dark:border-primary-blue/30 rounded-lg p-4 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={showUrgency ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] } : { scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AlertCircle className="w-5 h-5 text-primary-blue" />
            </motion.div>

            <div>
              <motion.p
                className="text-charcoal dark:text-gray-100 font-medium"
                animate={showUrgency ? { x: [0, 2, -2, 0] } : { x: 0 }}
                transition={{ duration: 0.3 }}
              >
                Your partner has {pendingVerifications} task{pendingVerifications !== 1 ? "s" : ""} waiting for review
              </motion.p>

              <AnimatePresence>
                {showUrgency && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-stone-gray dark:text-gray-300 text-sm"
                  >
                    ⏰ Don't keep them waiting! Quick reviews build trust
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(25, 161, 229, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 bg-primary-blue hover:bg-primary-blue-hover text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm relative overflow-hidden"
          >
            {/* Button shimmer effect */}
            <motion.div
              animate={{ x: [-100, 200] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
            />

            <Eye className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Review Now</span>
          </motion.button>
        </div>

        {/* Urgency indicator */}
        <AnimatePresence>
          {showUrgency && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 flex items-center space-x-2 text-xs text-primary-blue"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                className="w-2 h-2 bg-primary-blue rounded-full"
              />
              <span>Quick action builds stronger partnerships!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MouseGlowEffect>
  )
}
