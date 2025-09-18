"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Heart, Target, Users, Zap, Trophy, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface InvitationLandingProps {
  inviterName: string
  inviterAvatar?: string
  goalTitle?: string
  goalDescription?: string
  goalDuration?: number
  invitationToken: string
  onAccept: () => void
  onDecline: () => void
}

const SUCCESS_STATS = [
  { label: "Success Rate with Partners", value: "87%", icon: Trophy },
  { label: "Average Streak Length", value: "47 days", icon: Target },
  { label: "Active Partnerships", value: "10,000+", icon: Users },
]

const FEATURES = [
  {
    icon: Heart,
    title: "Mutual Accountability",
    description: "Support each other through challenges",
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  {
    icon: Target,
    title: "Shared Progress",
    description: "Track and celebrate wins together",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Stay connected with instant notifications",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
  },
]

// Safe string utility functions
const safeString = (value: any): string => {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  return String(value)
}

const getInitials = (name: any): string => {
  try {
    const safeName = safeString(name).trim()
    if (!safeName) return "?"

    const words = safeName.split(/\s+/).filter((word) => word.length > 0)
    if (words.length === 0) return "?"

    return words
      .slice(0, 2) // Take first 2 words max
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
  } catch (error) {
    console.error("Error generating initials:", error)
    return "?"
  }
}

export default function InvitationLanding({
  inviterName,
  inviterAvatar,
  goalTitle,
  goalDescription,
  goalDuration,
  invitationToken,
  onAccept,
  onDecline,
}: InvitationLandingProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowFeatures(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      await onAccept()
    } catch (error) {
      console.error("Failed to accept invitation:", error)
      setIsLoading(false)
    }
  }

  // Ensure we have safe values
  const displayName = safeString(inviterName) || "Someone"
  const safeGoalTitle = safeString(goalTitle)
  const safeGoalDescription = safeString(goalDescription)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header with Logo */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">DuoTrak</span>
          </h1>
        </motion.div>

        {/* Main Invitation Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-white shadow-xl border-0 overflow-hidden">
            <CardContent className="p-8">
              {/* Invitation Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                  className="mb-4 relative"
                >
                  <Avatar className="w-20 h-20 mx-auto ring-4 ring-blue-100">
                    <AvatarImage
                      src={inviterAvatar || "/placeholder.svg?height=80&width=80&text=Avatar"}
                      alt={displayName}
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="absolute -bottom-2 -right-2"
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Heart className="w-3 h-3 text-white" />
                    </div>
                  </motion.div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="text-3xl font-bold text-gray-900 mb-2"
                >
                  {displayName} invited you!
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="text-gray-600 text-lg"
                >
                  Join them on an amazing goal journey
                </motion.p>
              </div>

              {/* Goal Preview (if provided) */}
              {safeGoalTitle && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="mb-8"
                >
                  <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{safeGoalTitle}</h3>
                          {safeGoalDescription && <p className="text-gray-600 mb-3">{safeGoalDescription}</p>}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {goalDuration && typeof goalDuration === "number" && goalDuration > 0 && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{goalDuration} days</span>
                              </div>
                            )}
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              Shared Goal
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Success Statistics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mb-8"
              >
                <div className="grid grid-cols-3 gap-4">
                  {SUCCESS_STATS.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <motion.div
                        key={`${stat.label}-${index}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.9 + index * 0.1, duration: 0.4 }}
                        className="text-center"
                      >
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="space-y-4"
              >
                <Button
                  onClick={handleAccept}
                  disabled={isLoading}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Accepting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Accept Invitation</span>
                    </div>
                  )}
                </Button>

                <Button
                  onClick={onDecline}
                  variant="ghost"
                  size="lg"
                  className="w-full text-gray-500 hover:text-gray-700"
                  disabled={isLoading}
                >
                  Maybe later
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
                className="mt-6 pt-6 border-t border-gray-100"
              >
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Secure & Private</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Free to Use</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>No Spam</span>
                  </div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Section */}
        {showFeatures && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Why partnerships work</h3>
              <p className="text-gray-600">Science-backed benefits of accountability partners</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={`${feature.title}-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                >
                  <div className={`w-10 h-10 ${feature.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
