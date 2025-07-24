"use client"

import type React from "react"

import { motion } from "framer-motion"
import { useState } from "react"

interface MouseGlowEffectProps {
  children: React.ReactNode
  glowColor?: string
  intensity?: "low" | "medium" | "high"
  className?: string
}

export default function MouseGlowEffect({
  children,
  glowColor = "#19A1E5",
  intensity = "medium",
  className = "",
}: MouseGlowEffectProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const intensityMap = {
    low: { size: 100, opacity: 0.1 },
    medium: { size: 150, opacity: 0.15 },
    high: { size: 200, opacity: 0.2 },
  }

  const { size, opacity } = intensityMap[intensity]

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Glow effect */}
      {isHovering && (
        <motion.div
          className="absolute pointer-events-none rounded-full blur-xl"
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle, ${glowColor}${Math.round(opacity * 255).toString(16)} 0%, transparent 70%)`,
            left: mousePosition.x - size / 2,
            top: mousePosition.y - size / 2,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
        />
      )}
      {children}
    </div>
  )
}
