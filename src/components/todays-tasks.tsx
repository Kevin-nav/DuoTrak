"use client"

import { motion, Variants } from "framer-motion"
import { Clock, Camera, CheckCircle, AlertCircle, Users, User } from "lucide-react"
import { useState } from "react"
import MouseGlowEffect from "./mouse-glow-effect"
import TaskVerificationModal from "./task-verification-modal"

interface Task {
  id: string
  name: string
  goalName: string
  goalType: "personal" | "shared"
  accountabilityType: "visual" | "time-bound"
  status: "pending" | "completed" | "pending-verification" | "verified" | "failed" | "rejected"
  timeWindow?: string
  dueTime?: string
  canComplete: boolean
  rejectionReason?: string
}

interface TodaysTasksProps {
  tasks?: Task[]
  onTaskComplete: (taskId: string) => void
  onTaskVerificationSubmit: (taskId: string, imageFile?: File) => void
}

export default function TodaysTasks({
  tasks = [
    {
      id: "1",
      name: "Morning Meditation",
      goalName: "Mindfulness Journey",
      goalType: "personal",
      accountabilityType: "visual",
      status: "pending",
      canComplete: true,
    },
    {
      id: "2",
      name: "Partner Workout",
      goalName: "Fitness Duo",
      goalType: "shared",
      accountabilityType: "visual",
      status: "pending-verification",
      canComplete: false,
    },
    {
      id: "3",
      name: "Wake up at 7 AM",
      goalName: "Morning Routine",
      goalType: "personal",
      accountabilityType: "time-bound",
      status: "failed",
      timeWindow: "6:50 AM - 7:10 AM",
      canComplete: false,
    },
    {
      id: "4",
      name: "Evening Reading",
      goalName: "Learning Goals",
      goalType: "shared",
      accountabilityType: "visual",
      status: "rejected",
      rejectionReason: "Image is unclear or blurry",
      canComplete: true,
    },
    {
      id: "5",
      name: "Healthy Lunch",
      goalName: "Nutrition Goals",
      goalType: "shared",
      accountabilityType: "visual",
      status: "verified",
      canComplete: false,
    },
  ],
  onTaskComplete,
  onTaskVerificationSubmit,
}: TodaysTasksProps) {
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const handleTaskClick = (task: Task) => {
    if (!task.canComplete) return

    if (task.status === "pending") {
      if (task.accountabilityType === "visual") {
        setSelectedTask(task)
        setShowVerificationModal(true)
      } else {
        // Time-bound task - mark as completed immediately
        onTaskComplete(task.id)
      }
    } else if (task.status === "rejected") {
      // Allow resubmission for rejected tasks
      setSelectedTask(task)
      setShowVerificationModal(true)
    }
  }

  const handleVerificationSubmit = (imageFile?: File) => {
    if (selectedTask) {
      onTaskVerificationSubmit(selectedTask.id, imageFile)
    }
    setShowVerificationModal(false)
    setSelectedTask(null)
  }

  const getStatusIcon = (task: Task) => {
    switch (task.status) {
      case "completed":
      case "verified":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "pending-verification":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Clock className="w-5 h-5 text-primary-blue" />
          </motion.div>
        )
      case "failed":
        return <AlertCircle className="w-5 h-5 text-error-red" />
      case "rejected":
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      default:
        return task.accountabilityType === "visual" ? (
          <Camera className="w-5 h-5 text-stone-gray dark:text-gray-400" />
        ) : (
          <Clock className="w-5 h-5 text-stone-gray dark:text-gray-400" />
        )
    }
  }

  const getStatusText = (task: Task) => {
    switch (task.status) {
      case "completed":
        return "Completed"
      case "verified":
        return "Verified ✅"
      case "pending-verification":
        return "Awaiting Verification"
      case "failed":
        return "Missed"
      case "rejected":
        return "Needs Resubmission"
      default:
        return task.accountabilityType === "visual" ? "Add Photo" : "Mark Complete"
    }
  }

  const getStatusColor = (task: Task) => {
    switch (task.status) {
      case "completed":
      case "verified":
        return "text-green-600 dark:text-green-400"
      case "pending-verification":
        return "text-primary-blue"
      case "failed":
        return "text-error-red"
      case "rejected":
        return "text-orange-500"
      default:
        return "text-stone-gray dark:text-gray-400"
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
      >
        <motion.h2 variants={itemVariants} className="text-xl font-bold text-charcoal dark:text-gray-100 mb-6">
          Today's Tasks
        </motion.h2>

        <div className="space-y-3">
          {tasks.map((task, index) => (
            <MouseGlowEffect
              key={task.id}
              glowColor={task.canComplete ? "#19A1E5" : "#9CA3AF"}
              intensity={task.canComplete ? "medium" : "low"}
            >
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                whileHover={task.canComplete ? { scale: 1.01, x: 5 } : {}}
                onClick={() => handleTaskClick(task)}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  task.status === "verified" || task.status === "completed"
                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                    : task.status === "failed"
                      ? "border-error-red/20 bg-error-red/5 dark:bg-error-red/10"
                      : task.status === "rejected"
                        ? "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20"
                        : task.status === "pending-verification"
                          ? "border-primary-blue/20 bg-accent-light-blue dark:bg-primary-blue/10"
                          : task.canComplete
                            ? "border-cool-gray dark:border-gray-600 hover:border-primary-blue cursor-pointer"
                            : "border-cool-gray dark:border-gray-600 opacity-60"
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">{getStatusIcon(task)}</div>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4
                        className={`font-medium ${
                          task.status === "verified" || task.status === "completed"
                            ? "text-green-700 dark:text-green-300 line-through"
                            : "text-charcoal dark:text-gray-100"
                        }`}
                      >
                        {task.name}
                      </h4>
                      <div className="flex items-center space-x-1">
                        {task.goalType === "shared" ? (
                          <Users className="w-3 h-3 text-primary-blue" />
                        ) : (
                          <User className="w-3 h-3 text-stone-gray dark:text-gray-400" />
                        )}
                        <span className="text-xs text-stone-gray dark:text-gray-400">
                          {task.goalType === "shared" ? "Shared" : "Personal"}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-stone-gray dark:text-gray-400">{task.goalName}</p>
                    {task.timeWindow && (
                      <p className="text-xs text-stone-gray dark:text-gray-400 mt-1">Time window: {task.timeWindow}</p>
                    )}
                    {task.status === "rejected" && task.rejectionReason && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Reason: {task.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status/Action */}
                <div className="flex-shrink-0">
                  {task.canComplete && (task.status === "pending" || task.status === "rejected") ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg font-medium transition-colors text-sm"
                    >
                      {task.status === "rejected" ? "Resubmit" : getStatusText(task)}
                    </motion.button>
                  ) : (
                    <span className={`text-sm font-medium ${getStatusColor(task)}`}>{getStatusText(task)}</span>
                  )}
                </div>
              </motion.div>
            </MouseGlowEffect>
          ))}
        </div>

        {tasks.length === 0 && (
          <motion.div variants={itemVariants} className="text-center py-8 text-stone-gray dark:text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tasks scheduled for today</p>
          </motion.div>
        )}
      </motion.div>

      {/* Task Verification Modal */}
      <TaskVerificationModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false)
          setSelectedTask(null)
        }}
        taskName={selectedTask?.name || ""}
        onSubmit={handleVerificationSubmit}
      />
    </>
  )
}
