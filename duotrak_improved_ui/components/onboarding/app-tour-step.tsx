"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Play, Target, MessageSquare, Calendar, TrendingUp, Bell, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AppTourStepProps {
  data: { tourCompleted: boolean }
  updateData: (updates: any) => void
  onValidationChange: (isValid: boolean) => void
  onSkip?: () => void
}

const TOUR_FEATURES = [
  {
    icon: Target,
    title: "Goals Dashboard",
    description: "Track your shared goals and see progress at a glance",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: Calendar,
    title: "Daily Tasks",
    description: "Break down goals into manageable daily actions",
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  {
    icon: MessageSquare,
    title: "Partner Chat",
    description: "Communicate, encourage, and celebrate together",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Visualize your journey with charts and streaks",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Stay motivated with timely reminders and updates",
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
]

export default function AppTourStep({ data, updateData, onValidationChange, onSkip }: AppTourStepProps) {
  const [currentFeature, setCurrentFeature] = useState(0)
  const [tourStarted, setTourStarted] = useState(false)
  const [tourCompleted, setTourCompleted] = useState(data.tourCompleted || false)

  useEffect(() => {
    onValidationChange(true) // Tour step is always valid (can be skipped)
  }, [onValidationChange])

  const startTour = () => {
    setTourStarted(true)
    setCurrentFeature(0)
  }

  const nextFeature = () => {
    if (currentFeature < TOUR_FEATURES.length - 1) {
      setCurrentFeature((prev) => prev + 1)
    } else {
      completeTour()
    }
  }

  const completeTour = () => {
    setTourCompleted(true)
    updateData({ tourCompleted: true })
  }

  if (tourCompleted) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Tour Complete! 🎉</h2>
          <p className="text-lg text-gray-600 mb-8">
            You're all set to start using DuoTrak effectively. Ready to achieve your goals together?
          </p>
        </motion.div>
      </div>
    )
  }

  if (!tourStarted) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Play className="w-10 h-10 text-blue-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Quick App Tour</h2>
          <p className="text-lg text-gray-600 mb-8">
            Let's take a quick tour of DuoTrak's key features so you can make the most of your experience.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {TOUR_FEATURES.slice(0, 4).map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className={`p-4 rounded-lg ${feature.bgColor} border border-gray-200`}
              >
                <feature.icon className={`w-6 h-6 ${feature.color} mb-2`} />
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={startTour}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Start Tour (2 min)
            </Button>
            {onSkip && (
              <Button variant="outline" onClick={onSkip}>
                Skip Tour
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  const currentTourFeature = TOUR_FEATURES[currentFeature]

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        key={currentFeature}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <div className={`w-20 h-20 ${currentTourFeature.bgColor} rounded-full flex items-center justify-center`}>
              <currentTourFeature.icon className={`w-10 h-10 ${currentTourFeature.color}`} />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">{currentTourFeature.title}</h2>
          <p className="text-lg text-gray-600 mb-8">{currentTourFeature.description}</p>
        </div>

        {/* Mock UI Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm"
        >
          <div className="text-left">
            {currentFeature === 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-semibold">30-Day Fitness Challenge</span>
                  <span className="text-sm text-gray-500 ml-auto">75% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                </div>
                <p className="text-sm text-gray-600">22 days completed • 8 days remaining</p>
              </div>
            )}

            {currentFeature === 1 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Morning workout - 7:00 AM</span>
                  <span className="text-xs text-green-600 ml-auto">✓ Done</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">Healthy lunch prep - 12:00 PM</span>
                  <span className="text-xs text-blue-600 ml-auto">In Progress</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span className="text-sm font-medium">Evening walk - 6:00 PM</span>
                  <span className="text-xs text-gray-500 ml-auto">Scheduled</span>
                </div>
              </div>
            )}

            {currentFeature === 2 && (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    A
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Just finished my morning run! 🏃‍♂️</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 justify-end">
                  <div className="flex-1 text-right">
                    <p className="text-sm text-gray-900">Amazing! You're crushing it! 💪</p>
                    <p className="text-xs text-gray-500">1 minute ago</p>
                  </div>
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    Y
                  </div>
                </div>
              </div>
            )}

            {currentFeature === 3 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Weekly Progress</span>
                  <span className="text-sm text-green-600">+15% from last week</span>
                </div>
                <div className="space-y-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-8">{day}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.random() * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentFeature === 4 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Task Reminder</p>
                    <p className="text-xs text-gray-600">Your partner completed their morning workout!</p>
                  </div>
                  <span className="text-xs text-blue-500">now</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Bell className="w-4 h-4 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Goal Milestone</p>
                    <p className="text-xs text-gray-600">You've completed 75% of your fitness goal!</p>
                  </div>
                  <span className="text-xs text-green-500">5m ago</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {TOUR_FEATURES.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentFeature ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {currentFeature + 1} of {TOUR_FEATURES.length}
          </span>

          <Button
            onClick={nextFeature}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {currentFeature === TOUR_FEATURES.length - 1 ? "Finish Tour" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
