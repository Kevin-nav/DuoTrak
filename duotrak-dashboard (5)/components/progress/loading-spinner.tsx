"use client"

import { motion } from "framer-motion"
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
}

export default function LoadingSpinner({ 
  size = "md", 
  text = "Loading..." 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center space-x-2 text-[var(--theme-secondary)]"
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      {text && <span className="text-sm">{text}</span>}
    </motion.div>
  )
}
