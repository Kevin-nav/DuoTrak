"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Heart, Users, Target, Trophy, ArrowRight, Sparkles, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useInvitation } from "@/contexts/invitation-context"

// Confetti component
const Confetti = () => {
  const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7", "#dda0dd"]

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            left: `${Math.random() * 100}%`,
            top: "-10px",
          }}
          animate={{
            y: window.innerHeight + 100,
            rotate: 360,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 2,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  )
}

export default function PartnershipConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setPartnershipStatus, setPartnerInfo, inviterInfo, isFromInvitation } = useInvitation()

  const [currentStep, setCurrentStep] = useState(0)
  const [showConfetti, setShowConfetti] = useState(true)

  // Mock partner info from URL params or invitation context
  const partnerName = searchParams?.get("partner") || inviterInfo?.name || "Your Partner"
  const partnerEmail = searchParams?.get("email") || inviterInfo?.email || "partner@example.com"

  useEffect(() => {
    // Set partnership status to confirmed
    setPartnershipStatus("confirmed")

    // Set partner info
    setPartnerInfo({
      name: partnerName,
      email: partnerEmail,
      avatar: "/placeholder.svg?height=40&width=40&text=" + partnerName.charAt(0),
    })

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [partnerName, partnerEmail, setPartnershipStatus, setPartnerInfo])

  const steps = [
    {
      icon: Users,
      title: "Partnership Established",
      description: `You and ${partnerName} are now connected!`,
      color: "from-blue-500 to-purple-500",
    },
    {
      icon: Target,
      title: "Ready to Set Goals",
      description: "Time to create your first shared goal together",
      color: "from-green-500 to-blue-500",
    },
    {
      icon: Trophy,
      title: "Success Awaits",
      description: "Achieve more together than you ever could alone",
      color: "from-yellow-500 to-red-500",
    },
  ]

  const benefits = [
    {
      icon: Heart,
      title: "Stronger Bond",
      description: "Working towards goals together strengthens relationships",
    },
    {
      icon: Target,
      title: "Higher Success Rate",
      description: "You're 65% more likely to achieve goals with a partner",
    },
    {
      icon: Trophy,
      title: "Shared Victories",
      description: "Celebrate wins together and support through challenges",
    },
  ]

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Navigate to enhanced goal creation
      router.push("/goals/create?from=partnership")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      {showConfetti && <Confetti />}

      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-8"
        >
          {/* Header */}
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Heart className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </motion.div>

            <h1 className="text-4xl font-bold text-gray-900">🎉 Partnership Confirmed!</h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Congratulations! You and {partnerName} are now officially partners on DuoTrak. Get ready to achieve
              amazing things together!
            </p>
          </div>

          {/* Partner Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center space-x-8 p-6 bg-white rounded-2xl shadow-lg max-w-md mx-auto"
          >
            <div className="text-center">
              <Avatar className="w-16 h-16 mx-auto mb-2">
                <AvatarImage src="/placeholder.svg?height=64&width=64&text=You" />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <p className="font-medium text-gray-900">You</p>
            </div>

            <div className="flex items-center">
              <Heart className="w-8 h-8 text-pink-500" />
            </div>

            <div className="text-center">
              <Avatar className="w-16 h-16 mx-auto mb-2">
                <AvatarImage src={`/placeholder-icon.png?height=64&width=64&text=${partnerName.charAt(0)}`} />
                <AvatarFallback>{partnerName.charAt(0)}</AvatarFallback>
              </Avatar>
              <p className="font-medium text-gray-900">{partnerName}</p>
            </div>
          </motion.div>

          {/* Journey Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep

              return (
                <Card
                  key={index}
                  className={`transition-all duration-500 ${
                    isActive
                      ? "ring-2 ring-blue-500 shadow-lg scale-105"
                      : isCompleted
                        ? "bg-green-50 border-green-200"
                        : "opacity-60"
                  }`}
                >
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-8 h-8 text-white" />
                      ) : (
                        <Icon className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div key={index} className="text-center p-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{benefit.title}</h4>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              )
            })}
          </motion.div>

          {/* Success Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="p-6 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl max-w-2xl mx-auto"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Partnership Success Stats</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">65%</p>
                <p className="text-xs text-gray-600">Higher Success Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">3x</p>
                <p className="text-xs text-gray-600">More Motivation</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">89%</p>
                <p className="text-xs text-gray-600">Relationship Satisfaction</p>
              </div>
            </div>
          </motion.div>

          {/* Continue Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
            <Button
              onClick={handleContinue}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-lg px-8 py-3"
            >
              {currentStep < steps.length - 1 ? "Continue Journey" : "Create Your First Goal"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
