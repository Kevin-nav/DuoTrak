"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Trophy, Sparkles, Heart, Target, Calendar, MessageSquare, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FirstSuccessStepProps {
  data: {
    goalTitle: string
    partnerName: string
    firstTask: {
      title: string
      scheduledTime: string
    }
  }
  updateData: (updates: any) => void
  onValidationChange: (isValid: boolean) => void
}

const CELEBRATION_EMOJIS = ["🎉", "🎊", "✨", "🌟", "💫", "🎈", "🏆", "💪"]

export default function FirstSuccessStep({ data, onValidationChange }: FirstSuccessStepProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [animationPhase, setAnimationPhase] = useState(0)

  useEffect(() => {
    onValidationChange(true)

    // Trigger celebration animation
    setShowConfetti(true)

    // Animation phases
    const timer1 = setTimeout(() => setAnimationPhase(1), 500)
    const timer2 = setTimeout(() => setAnimationPhase(2), 1000)
    const timer3 = setTimeout(() => setAnimationPhase(3), 1500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [onValidationChange])

  const nextSteps = [
    {
      icon: Calendar,
      title: data.firstTask?.title ? "Complete Your First Task" : "Create Your First Task",
      description: data.firstTask?.title
        ? `"${data.firstTask.title}" scheduled for ${new Date(data.firstTask.scheduledTime || Date.now()).toLocaleDateString()}`
        : "Set up your first task to start making progress",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      icon: MessageSquare,
      title: "Connect with Your Partner",
      description: `Chat with ${data.partnerName || "your partner"} and encourage each other`,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      icon: Target,
      title: "Track Your Progress",
      description: "Watch your goal progress grow day by day",
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
  ]

  return (
    <div className="max-w-3xl mx-auto text-center relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
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
                delay: Math.random() * 2,
              }}
            >
              {CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)]}
            </motion.div>
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Trophy Animation */}
        <motion.div
          animate={{
            rotate: animationPhase >= 1 ? [0, -10, 10, 0] : 0,
            scale: animationPhase >= 1 ? [1, 1.1, 1] : 1,
          }}
          transition={{
            duration: 0.6,
            repeat: animationPhase >= 1 ? 2 : 0,
          }}
          className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <Trophy className="w-12 h-12 text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
        >
          You're All Set! 🎉
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-xl text-gray-600 mb-8"
        >
          You've successfully set up DuoTrak and invited your partner!
        </motion.p>

        {/* Goal Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">Your Journey Begins</h3>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2">
              {data.goalTitle || "Your goal will appear here once created"}
            </h4>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Account Created</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Partner Invited</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Preferences Set</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mb-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">What's Next?</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {nextSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`p-6 rounded-xl ${step.bgColor} border border-gray-200 hover:shadow-md transition-all duration-200`}
              >
                <div
                  className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4 mx-auto shadow-sm`}
                >
                  <step.icon className={`w-6 h-6 ${step.color}`} />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Success Stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900">You're Ready to Succeed!</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Remember, DuoTrak works because you're not alone. Your partner is the key to your success, and you're the
            key to theirs. Together, you'll achieve more than either of you could alone.
          </p>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="text-center"
        >
          <p className="text-gray-600 mb-6">Ready to start your journey? Your dashboard is waiting for you!</p>
          <Button
            onClick={() => (window.location.href = "/")}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
