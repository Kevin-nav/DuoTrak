"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Star, Plus, Trophy, Flame } from 'lucide-react'
import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface XPEarningNotificationProps {
  xpGained: number
  reason: string
  type: 'task' | 'streak' | 'milestone' | 'collaboration'
  isVisible: boolean
  onComplete: () => void
}

export default function XPEarningNotification({ 
  xpGained, 
  reason, 
  type, 
  isVisible, 
  onComplete 
}: XPEarningNotificationProps) {
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setShowNotification(true)
      const timer = setTimeout(() => {
        setShowNotification(false)
        setTimeout(onComplete, 300) // Wait for exit animation
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, onComplete])

  const getIcon = () => {
    switch (type) {
      case 'task': return Star
      case 'streak': return Flame
      case 'milestone': return Trophy
      case 'collaboration': return Plus
      default: return Star
    }
  }

  const getColor = () => {
    switch (type) {
      case 'task': return 'text-blue-500'
      case 'streak': return 'text-orange-500'
      case 'milestone': return 'text-yellow-500'
      case 'collaboration': return 'text-green-500'
      default: return 'text-blue-500'
    }
  }

  const Icon = getIcon()

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          className="fixed top-4 right-4 z-50"
        >
          <Card className="bg-[var(--theme-card)] border-[var(--theme-border)] shadow-lg">
            <div className="p-4 flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className={`p-2 rounded-full bg-opacity-20 ${getColor().replace('text-', 'bg-')}`}
              >
                <Icon className={`w-6 h-6 ${getColor()}`} />
              </motion.div>
              
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center space-x-2"
                >
                  <span className="text-2xl font-bold text-[var(--theme-primary)]">
                    +{xpGained}
                  </span>
                  <span className="text-sm font-medium text-[var(--theme-secondary)]">XP</span>
                </motion.div>
                
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm text-[var(--theme-secondary)]"
                >
                  {reason}
                </motion.p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
