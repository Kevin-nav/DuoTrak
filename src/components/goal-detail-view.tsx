"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Camera, Clock, CheckCircle, Upload, X } from "lucide-react"
import { useState } from "react"
import MouseGlowEffect from "./mouse-glow-effect"

interface Task {
  id: string
  name: string
  completed: boolean
  date: string
  canComplete: boolean
  timeWindow?: string
}

interface GoalDetailViewProps {
  goalName?: string
  category?: string
  accountabilityType?: "visual" | "time-bound"
  progress?: number
  total?: number
  tasks?: Task[]
}

export default function GoalDetailView({
  goalName = "Daily Meditation",
  category = "Wellness",
  accountabilityType = "visual",
  progress = 5,
  total = 10,
  tasks = [
    { id: "1", name: "Morning meditation session", completed: true, date: "Today", canComplete: false },
    { id: "2", name: "Evening reflection", completed: false, date: "Today", canComplete: true },
    { id: "3", name: "Mindfulness practice", completed: false, date: "Tomorrow", canComplete: false },
  ],
}: GoalDetailViewProps) {
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  const handleMarkComplete = (taskId: string) => {
    if (accountabilityType === "visual") {
      setSelectedTask(taskId)
      setShowPhotoUpload(true)
    } else {
      // Time-bound completion
      triggerCelebration()
    }
  }

  const handlePhotoUpload = () => {
    setShowPhotoUpload(false)
    setSelectedTask(null)
    triggerCelebration()
  }

  const triggerCelebration = () => {
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 2000)
  }

  const progressPercentage = (progress / total) * 100

  return (
    <div className="min-h-screen bg-pearl-gray dark:bg-gray-900 pt-16 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center mb-6">
          <button className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors mr-4">
            <ArrowLeft className="w-6 h-6 text-charcoal dark:text-gray-100" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100">{goalName}</h1>
            <p className="text-stone-gray dark:text-gray-400">{category}</p>
          </div>
        </motion.div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal dark:text-gray-100">Overall Progress</h2>
            <span className="text-sm font-medium text-stone-gray dark:text-gray-400">
              {progress}/{total} completed
            </span>
          </div>

          <div className="relative h-3 bg-cool-gray dark:bg-gray-700 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary-blue to-accent-light-blue rounded-full relative"
            >
              <motion.div
                animate={{ x: [-100, 200] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
              />
            </motion.div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-gray dark:text-gray-400">
              {accountabilityType === "visual" ? "Photo verification" : "Time-bound completion"}
            </span>
            <span className="text-primary-blue font-medium">{Math.round(progressPercentage)}% complete</span>
          </div>
        </motion.div>

        {/* Tasks List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-charcoal dark:text-gray-100 mb-4">Daily Tasks</h2>

          <div className="space-y-3">
            {tasks.map((task, index) => (
              <MouseGlowEffect key={task.id} glowColor={task.completed ? "#10B981" : "#19A1E5"} intensity="low">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    task.completed
                      ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                      : task.canComplete
                        ? "border-primary-blue/20 bg-accent-light-blue dark:bg-primary-blue/10 hover:border-primary-blue"
                        : "border-cool-gray dark:border-gray-600 opacity-60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        task.completed
                          ? "border-green-500 bg-green-500"
                          : task.canComplete
                            ? "border-primary-blue hover:bg-primary-blue/10"
                            : "border-cool-gray dark:border-gray-600"
                      }`}
                    >
                      {task.completed && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>

                    <div>
                      <p
                        className={`font-medium ${
                          task.completed
                            ? "text-green-700 dark:text-green-300 line-through"
                            : "text-charcoal dark:text-gray-100"
                        }`}
                      >
                        {task.name}
                      </p>
                      <p className="text-sm text-stone-gray dark:text-gray-400">{task.date}</p>
                    </div>
                  </div>

                  {task.canComplete && !task.completed && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleMarkComplete(task.id)}
                      className="flex items-center space-x-2 bg-primary-blue hover:bg-primary-blue-hover text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      {accountabilityType === "visual" ? (
                        <>
                          <Camera className="w-4 h-4" />
                          <span>Add Photo</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          <span>Mark Done</span>
                        </>
                      )}
                    </motion.button>
                  )}

                  {task.completed && (
                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                  )}
                </motion.div>
              </MouseGlowEffect>
            ))}
          </div>
        </motion.div>

        {/* Photo Upload Modal */}
        <AnimatePresence>
          {showPhotoUpload && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100">Upload Proof Photo</h3>
                  <button
                    onClick={() => setShowPhotoUpload(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5 text-stone-gray dark:text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-cool-gray dark:border-gray-600 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-stone-gray dark:text-gray-400 mx-auto mb-4" />
                    <p className="text-stone-gray dark:text-gray-400 mb-4">Take a photo or select from your gallery</p>
                    <div className="flex space-x-3 justify-center">
                      <button className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition-colors">
                        Take Photo
                      </button>
                      <button className="px-4 py-2 border border-cool-gray dark:border-gray-600 text-charcoal dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Choose File
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePhotoUpload}
                    className="w-full bg-primary-blue hover:bg-primary-blue-hover text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Confirm Completion
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        import Mascot from '@/components/mascot/Mascot';

// ... (imports)

// ... (inside component)
        {/* Celebration Animation */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1 }} className="text-6xl mb-4">
                  🎉
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Great job!</h2>
                <p className="text-white/80">Task completed successfully</p>
              </motion.div>

              {/* Confetti */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 0,
                    scale: 0,
                    x: "50vw",
                    y: "50vh",
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.5],
                    x: `${50 + (Math.random() - 0.5) * 100}vw`,
                    y: `${50 + (Math.random() - 0.5) * 100}vh`,
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    ease: "easeOut",
                  }}
                  className="absolute w-3 h-3 bg-primary-blue rounded-full"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
// ... (rest of component)
      </div>
    </div>
  )
}
