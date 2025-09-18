"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useMascot } from "@/contexts/mascot-context"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import type { MascotContext } from "@/types/mascot"

const MASCOT_IMAGES: Record<MascotContext, string> = {
  notification: "/mascots/notification-mascot.png",
  motivation: "/mascots/motivation-mascot.png",
  challenge: "/mascots/challenge-mascot.png",
  streak: "/mascots/streak-mascot.png",
  celebration: "/mascots/celebration-mascot.png",
  rest: "/mascots/rest-mascot.png",
  progress: "/mascots/progress-mascot.png",
  teamwork: "/mascots/teamwork-mascot.png",
  welcome: "/mascots/motivation-mascot.png",
  achievement: "/mascots/celebration-mascot.png",
}

export function ContextualMascotRenderer() {
  const { state, hideInteraction } = useMascot()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (state.currentInteraction) {
      setIsVisible(true)

      // Auto-hide after duration
      const duration = state.currentInteraction.duration || 8000
      const timer = setTimeout(() => {
        if (state.currentInteraction?.autoHide !== false) {
          hideInteraction()
        }
      }, duration)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [state.currentInteraction, hideInteraction])

  if (!state.mascotEnabled || !state.contextualMascots || !state.currentInteraction) {
    return null
  }

  const interaction = state.currentInteraction

  const getPositionClasses = () => {
    switch (interaction.position) {
      case "top-center":
        return "top-4 left-1/2 transform -translate-x-1/2"
      case "center":
        return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      case "bottom-right":
        return "bottom-4 right-4"
      case "bottom-center":
        return "bottom-4 left-1/2 transform -translate-x-1/2"
      case "top-right":
      default:
        return "top-4 right-4"
    }
  }

  const getPriorityStyles = () => {
    switch (interaction.priority) {
      case "high":
        return "bg-gradient-to-r from-[var(--theme-primary)]/10 to-[var(--theme-secondary)]/10 border-[var(--theme-primary)]/30 shadow-lg backdrop-blur-md"
      case "medium":
        return "bg-[var(--theme-card)] border-[var(--theme-border)] shadow-md backdrop-blur-sm"
      case "low":
        return "bg-[var(--theme-accent)] border-[var(--theme-border)] shadow-sm"
      default:
        return "bg-[var(--theme-card)] border-[var(--theme-border)] shadow-md backdrop-blur-sm"
    }
  }

  const getContextAnimation = () => {
    switch (interaction.context) {
      case "celebration":
        return {
          initial: { opacity: 0, scale: 0.5, rotate: -10 },
          animate: {
            opacity: 1,
            scale: 1,
            rotate: 0,
            y: [0, -5, 0],
          },
          transition: {
            duration: 0.6,
            ease: "backOut",
            y: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          },
        }
      case "streak":
        return {
          initial: { opacity: 0, scale: 0.8, x: 50 },
          animate: {
            opacity: 1,
            scale: 1,
            x: 0,
            rotate: [0, 2, -2, 0],
          },
          transition: {
            duration: 0.5,
            rotate: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          },
        }
      case "notification":
        return {
          initial: { opacity: 0, y: -20, scale: 0.9 },
          animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            x: [0, 2, -2, 0],
          },
          transition: {
            duration: 0.4,
            x: { duration: 0.5, repeat: 3, ease: "easeInOut" },
          },
        }
      case "challenge":
        return {
          initial: { opacity: 0, scale: 0.7, y: 30 },
          animate: {
            opacity: 1,
            scale: 1,
            y: 0,
            rotate: [0, 1, -1, 0],
          },
          transition: {
            duration: 0.7,
            ease: "backOut",
            rotate: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          },
        }
      default:
        return {
          initial: { opacity: 0, scale: 0.8, y: 20 },
          animate: { opacity: 1, scale: 1, y: 0 },
          transition: { duration: 0.3, ease: "easeOut" },
        }
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          {...getContextAnimation()}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          className={`fixed z-50 ${getPositionClasses()}`}
        >
          <div
            className={`
              max-w-sm rounded-2xl border-2 p-4
              ${getPriorityStyles()}
            `}
          >
            <div className="flex items-start space-x-3">
              {/* Contextual Mascot Image */}
              <div className="flex-shrink-0">
                <motion.div
                  animate={
                    !state.reducedMotion
                      ? {
                          scale: [1, 1.05, 1],
                          rotate: interaction.context === "celebration" ? [0, 5, -5, 0] : [0, 1, -1, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: interaction.context === "celebration" ? 0.8 : 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <Image
                    src={MASCOT_IMAGES[interaction.context] || "/placeholder.svg"}
                    alt={`${interaction.context} mascot`}
                    width={64}
                    height={64}
                    className="rounded-lg"
                  />

                  {/* Context-specific effects */}
                  {interaction.context === "streak" && (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                      className="absolute -inset-1 bg-orange-400/20 rounded-lg blur-sm"
                    />
                  )}

                  {interaction.context === "celebration" && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                      className="absolute -inset-2 bg-yellow-400/30 rounded-full blur-md"
                    />
                  )}
                </motion.div>
              </div>

              <div className="flex-1 min-w-0">
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm font-medium text-[var(--theme-foreground)] leading-relaxed"
                >
                  {interaction.message}
                </motion.p>
              </div>

              {interaction.showCloseButton !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={hideInteraction}
                  className="flex-shrink-0 h-6 w-6 p-0 hover:bg-[var(--theme-accent)]"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Priority indicator */}
            {interaction.priority === "high" && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--theme-primary)] rounded-full"
              />
            )}

            {/* Context-specific decorations */}
            {interaction.context === "celebration" && (
              <div className="absolute -top-2 -left-2 text-yellow-400">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  ✨
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
