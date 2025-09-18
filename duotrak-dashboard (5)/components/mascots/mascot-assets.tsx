"use client"

import { motion } from "framer-motion"
import type { MascotType, MascotExpression, MascotPose } from "@/types/mascot"

interface MascotAssetProps {
  type: MascotType
  expression: MascotExpression
  pose: MascotPose
  size?: "small" | "medium" | "large"
  animated?: boolean
  className?: string
}

export function MascotAsset({
  type,
  expression,
  pose,
  size = "medium",
  animated = true,
  className = "",
}: MascotAssetProps) {
  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-16 h-16",
    large: "w-24 h-24",
  }

  if (type === "both") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <MascotAsset type="poko" expression={expression} pose={pose} size={size} animated={animated} />
        <MascotAsset type="lumo" expression={expression} pose={pose} size={size} animated={animated} />
      </div>
    )
  }

  const colors = {
    poko: {
      primary: "#36C95F",
      secondary: "#FFD54F",
      accent: "#2EBF4F",
    },
    lumo: {
      primary: "#3AB8C2",
      secondary: "#9B6EF3",
      accent: "#2A9BA5",
    },
  }

  const mascotColors = colors[type as keyof typeof colors]

  const getAnimationProps = () => {
    if (!animated) return {}

    switch (pose) {
      case "waving":
        return {
          animate: { rotate: [0, 15, -15, 0] },
          transition: { duration: 1, repeat: 2 },
        }
      case "confetti-dance":
        return {
          animate: { y: [0, -8, 0], rotate: [0, 5, -5, 0] },
          transition: { duration: 0.6, repeat: 3 },
        }
      case "tail-glow":
        return {
          animate: { scale: [1, 1.1, 1] },
          transition: { duration: 1.5, repeat: Number.POSITIVE_INFINITY },
        }
      case "high-five":
        return {
          animate: { y: [0, -4, 0] },
          transition: { duration: 0.8, repeat: 2 },
        }
      default:
        return {
          animate: { y: [0, -2, 0] },
          transition: { duration: 2, repeat: Number.POSITIVE_INFINITY },
        }
    }
  }

  return (
    <motion.div className={`${sizeClasses[size]} ${className}`} {...getAnimationProps()}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Mascot Body */}
        <ellipse cx="50" cy="60" rx="25" ry="30" fill={mascotColors.primary} stroke="#000" strokeWidth="2" />

        {/* Head */}
        <circle cx="50" cy="35" r="20" fill={mascotColors.primary} stroke="#000" strokeWidth="2" />

        {/* Eyes */}
        <circle cx="42" cy="30" r="4" fill="#fff" />
        <circle cx="58" cy="30" r="4" fill="#fff" />
        <circle cx="42" cy="30" r="2" fill="#000" />
        <circle cx="58" cy="30" r="2" fill="#000" />

        {/* Expression-based mouth */}
        {expression === "happy" && <path d="M 40 40 Q 50 48 60 40" stroke="#000" strokeWidth="2" fill="none" />}
        {expression === "celebratory" && <ellipse cx="50" cy="42" rx="6" ry="4" fill="#000" />}
        {expression === "supportive" && <path d="M 45 40 Q 50 44 55 40" stroke="#000" strokeWidth="2" fill="none" />}
        {expression === "excited" && <ellipse cx="50" cy="42" rx="8" ry="6" fill="#000" />}

        {/* Cheek blush for happy expressions */}
        {(expression === "happy" || expression === "excited") && (
          <>
            <circle cx="35" cy="38" r="3" fill="#FF9999" opacity="0.6" />
            <circle cx="65" cy="38" r="3" fill="#FF9999" opacity="0.6" />
          </>
        )}

        {/* Arms based on pose */}
        {pose === "waving" && (
          <ellipse
            cx="25"
            cy="50"
            rx="4"
            ry="12"
            fill={mascotColors.primary}
            stroke="#000"
            strokeWidth="1"
            transform="rotate(-30 25 50)"
          />
        )}
        {pose === "high-five" && (
          <ellipse
            cx="25"
            cy="45"
            rx="4"
            ry="12"
            fill={mascotColors.primary}
            stroke="#000"
            strokeWidth="1"
            transform="rotate(-45 25 45)"
          />
        )}
        {pose === "pointing" && (
          <ellipse
            cx="75"
            cy="50"
            rx="4"
            ry="12"
            fill={mascotColors.primary}
            stroke="#000"
            strokeWidth="1"
            transform="rotate(45 75 50)"
          />
        )}

        {/* Tail with glow effect for tail-glow pose */}
        <path
          d="M 75 65 Q 85 70 80 80"
          stroke={mascotColors.primary}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        {pose === "tail-glow" && (
          <path
            d="M 75 65 Q 85 70 80 80"
            stroke={mascotColors.secondary}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            opacity="0.6"
          />
        )}

        {/* Confetti for celebration */}
        {pose === "confetti-dance" && (
          <g>
            <rect x="20" y="15" width="2" height="2" fill="#FFD54F" transform="rotate(45 20 15)" />
            <rect x="80" y="20" width="2" height="2" fill="#FF6B6B" transform="rotate(30 80 20)" />
            <rect x="15" y="25" width="2" height="2" fill="#4ECDC4" transform="rotate(60 15 25)" />
            <rect x="85" y="30" width="2" height="2" fill="#45B7D1" transform="rotate(15 85 30)" />
          </g>
        )}
      </svg>
    </motion.div>
  )
}
