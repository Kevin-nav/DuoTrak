"use client"

import { motion } from "framer-motion"
import { useEffect } from "react"
import { Heart, Target, Users, Zap, Sparkles, Trophy } from "lucide-react"

interface WelcomeStepProps {
  data: any
  updateData: (updates: any) => void
  onValidationChange: (isValid: boolean) => void
  onNext: () => void
}

const FEATURES = [
  {
    icon: Heart,
    title: "Shared Goals",
    description: "Create meaningful goals together with your partner",
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
  {
    icon: Target,
    title: "Daily Tasks",
    description: "Break down goals into manageable daily actions",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: Users,
    title: "Partner Support",
    description: "Encourage each other and celebrate victories",
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Stay connected with instant progress sharing",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
  },
]

export default function WelcomeStep({ onValidationChange }: WelcomeStepProps) {
  useEffect(() => {
    // Welcome step is always valid
    onValidationChange(true)
  }, [onValidationChange])

  return (
    <div className="text-center max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="mb-8">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="inline-block mb-4"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">DuoTrak</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-gray-600 mb-8 leading-relaxed"
          >
            You're about to transform how you achieve goals.
            <br />
            Let's get you set up in just a few minutes!
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4 mx-auto`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Your journey begins with a partner</h3>
          </div>
          <p className="text-gray-600 mb-4">
            DuoTrak works because you're not alone. In the next step, you'll invite your accountability partner - the
            person who will help transform your goals into achievements.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Quick Setup</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Partner Invitation</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Goal Creation</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
