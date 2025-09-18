"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check, X } from "lucide-react"
import { useState } from "react"

interface EnhancedCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  size?: "sm" | "md" | "lg"
  variant?: "default" | "goal" | "task"
}

export default function EnhancedCheckbox({
  checked,
  onChange,
  size = "md",
  variant = "default",
}: EnhancedCheckboxProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [showDiscouragement, setShowDiscouragement] = useState(false)
  const [justChecked, setJustChecked] = useState(false)

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }

  const handleClick = () => {
    if (checked) {
      // Show discouragement animation when trying to uncheck
      setShowDiscouragement(true)
      setTimeout(() => setShowDiscouragement(false), 3000)

      // Add a slight delay to make unchecking feel less immediate
      setTimeout(() => onChange(false), 500)
    } else {
      // Trigger celebration animation for checking
      setJustChecked(true)
      onChange(true)
      setTimeout(() => setJustChecked(false), 1000)
    }
  }

  return (
    <div className="relative z-10">
      <motion.button
        onClick={handleClick}
        onHoverStart={() => setIsHovering(true)}
        onHoverEnd={() => setIsHovering(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`${sizeClasses[size]} relative rounded-md border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
          checked
            ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25"
            : "border-border hover:border-primary bg-card"
        }`}
      >
        {/* Glow effect when checked */}
        {checked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.6, scale: 1.2 }}
            className="absolute inset-0 bg-primary rounded-md blur-sm -z-10"
          />
        )}

        {/* Check mark with enhanced celebration */}
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{
                scale: 1,
                rotate: 0,
                opacity: 1,
              }}
              exit={{ scale: 0, rotate: 180, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 600,
                damping: 20,
                duration: 0.6,
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.div
                animate={
                  justChecked
                    ? {
                        scale: [1, 1.3, 1],
                        rotate: [0, 10, -10, 0],
                      }
                    : {}
                }
                transition={{ duration: 0.5 }}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </motion.div>

              {/* Enhanced celebration sparkles */}
              {justChecked &&
                [...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      scale: [0, 1.5, 1, 0],
                      x: [0, Math.cos((i * 60 * Math.PI) / 180) * 20],
                      y: [0, Math.sin((i * 60 * Math.PI) / 180) * 20],
                    }}
                    transition={{
                      duration: 0.8,
                      delay: 0.1,
                      ease: "easeOut",
                    }}
                    className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
                  />
                ))}

              {/* Success ripple effect */}
              {justChecked && (
                <motion.div
                  initial={{ scale: 0, opacity: 0.8 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute inset-0 border-2 border-green-400 rounded-md"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover effect for unchecked state */}
        {!checked && isHovering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              className="w-2 h-2 bg-primary/40 rounded-full"
            />
          </motion.div>
        )}
      </motion.button>

      {/* Fixed discouragement tooltip with better positioning */}
      <AnimatePresence>
        {showDiscouragement && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap z-50 shadow-lg"
            style={{ minWidth: "200px" }}
          >
            <motion.div
              className="flex items-center justify-center space-x-2"
              animate={{ x: [-2, 2, -2, 0] }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4, delay: 0.1 }}>
                <X className="w-3 h-3" />
              </motion.div>
              <span>Are you sure? You've got this! 💪</span>
            </motion.div>

            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-destructive" />

            {/* Pulsing border for attention */}
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 0 hsl(var(--destructive) / 0.4)",
                  "0 0 0 8px hsl(var(--destructive) / 0)",
                  "0 0 0 0 hsl(var(--destructive) / 0)",
                ],
              }}
              transition={{ duration: 1.5, repeat: 2 }}
              className="absolute inset-0 rounded-lg"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
