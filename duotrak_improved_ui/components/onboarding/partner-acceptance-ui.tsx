"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { Heart, Check, X, Target, Calendar, Sparkles, Trophy, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface PartnerAcceptanceUIProps {
  inviterName: string
  inviterAvatar?: string
  goalTitle: string
  goalDescription: string
  invitationMessage: string
  onAccept: () => void
  onDecline: () => void
}

export default function PartnerAcceptanceUI({
  inviterName = "Alex",
  inviterAvatar = "/placeholder.svg?height=60&width=60",
  goalTitle = "30-Day Fitness Challenge",
  goalDescription = "Complete daily workouts together and track our progress toward better health and fitness.",
  invitationMessage = "Hi! I've started using DuoTrak to work on goals together, and I'd love for you to join me!",
  onAccept,
  onDecline,
}: PartnerAcceptanceUIProps) {
  const [decision, setDecision] = useState<"accept" | "decline" | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  const handleAccept = () => {
    setDecision("accept")
    setShowCelebration(true)
    setTimeout(() => {
      onAccept()
    }, 2000)
  }

  const handleDecline = () => {
    setDecision("decline")
    setTimeout(() => {
      onDecline()
    }, 1000)
  }

  if (decision === "accept") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          {/* Celebration Animation */}
          <AnimatePresence>
            {showCelebration && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-2xl"
                    initial={{
                      x: Math.random() * window.innerWidth,
                      y: -50,
                      rotate: 0,
                      scale: 0,
                    }}
                    animate={{
                      y: window.innerHeight + 100,
                      rotate: 360,
                      scale: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      ease: "easeOut",
                      delay: Math.random() * 1,
                    }}
                  >
                    {["🎉", "🎊", "✨", "💫", "🌟"][Math.floor(Math.random() * 5)]}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          <motion.div
            animate={{
              rotate: [0, -10, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 0.6,
              repeat: 2,
            }}
            className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            Welcome to DuoTrak! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-600 mb-6"
          >
            You've successfully joined {inviterName} on your shared goal journey!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={inviterAvatar || "/placeholder.svg"} alt={inviterName} />
                <AvatarFallback>{inviterName[0]}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">{goalTitle}</h3>
                <p className="text-sm text-gray-600">with {inviterName}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-green-600">
              <div className="flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>Partnership Confirmed</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>Goal Shared</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-gray-600 text-sm"
          >
            Setting up your dashboard...
          </motion.div>
        </motion.div>
      </div>
    )
  }

  if (decision === "decline") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-gray-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation Declined</h1>

          <p className="text-gray-600 mb-6">
            We understand that now might not be the right time. {inviterName} will be notified of your decision.
          </p>

          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
            <p className="text-sm text-gray-600">
              If you change your mind later, you can always ask {inviterName} to send you another invitation.
            </p>
          </div>

          <Button variant="outline" onClick={() => window.close()} className="w-full">
            Close
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Heart className="w-8 h-8 text-white" />
          </motion.div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Invited!</h1>
          <p className="text-gray-600">{inviterName} wants to achieve goals together with you</p>
        </div>

        {/* Invitation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6"
        >
          {/* Inviter Info */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={inviterAvatar || "/placeholder.svg"} alt={inviterName} />
                <AvatarFallback className="bg-blue-500 text-white">{inviterName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">{inviterName}</h3>
                <p className="text-sm text-gray-600">wants to be your goal partner</p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="p-6 border-b border-gray-100">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 text-sm leading-relaxed">{invitationMessage}</p>
            </div>
          </div>

          {/* Goal Details */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-blue-500" />
              <h4 className="font-semibold text-gray-900">Shared Goal</h4>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <h5 className="font-semibold text-gray-900 mb-2">{goalTitle}</h5>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">{goalDescription}</p>

              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Start together</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>Daily check-ins</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Celebrate wins</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 border border-gray-200 mb-6"
        >
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            What you'll get with DuoTrak
          </h4>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Shared goal tracking and progress visualization</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Daily task management with partner verification</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Built-in chat for encouragement and support</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Celebration of milestones and achievements</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-4"
        >
          <Button
            onClick={handleAccept}
            className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Heart className="w-5 h-5 mr-2" />
            Accept & Join
          </Button>

          <Button
            variant="outline"
            onClick={handleDecline}
            className="px-6 py-3 border-2 hover:bg-gray-50 bg-transparent"
          >
            <X className="w-4 h-4 mr-2" />
            Decline
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-gray-500 mt-4"
        >
          By accepting, you'll create a free DuoTrak account and join {inviterName} on this goal
        </motion.p>
      </motion.div>
    </div>
  )
}
