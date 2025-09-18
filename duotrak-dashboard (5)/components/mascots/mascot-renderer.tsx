"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useMascot } from "@/contexts/mascot-context"
import { MascotAsset } from "./mascot-assets"
import { Button } from "@/components/ui/button"

export function MascotRenderer() {
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

  if (!state.mascotEnabled || !state.currentInteraction) {
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
      case "top-right":
      default:
        return "top-4 right-4"
    }
  }

  const getPriorityStyles = () => {
    switch (interaction.priority) {
      case "high":
        return "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg"
      case "medium":
        return "bg-white border-gray-200 shadow-md"
      case "low":
        return "bg-gray-50 border-gray-100 shadow-sm"
      default:
        return "bg-white border-gray-200 shadow-md"
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`fixed z-50 ${getPositionClasses()}`}
        >
          <div
            className={`
              max-w-sm p-4 rounded-xl border-2 backdrop-blur-sm
              ${getPriorityStyles()}
            `}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <MascotAsset
                  type={interaction.type}
                  expression={interaction.expression}
                  pose={interaction.pose}
                  size="medium"
                  animated={!state.reducedMotion}
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 leading-relaxed">{interaction.message}</p>
              </div>

              {interaction.showCloseButton !== false && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={hideInteraction}
                  className="flex-shrink-0 h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Priority indicator */}
            {interaction.priority === "high" && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
