"use client"

import { motion } from "framer-motion"
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
            <Clock className="w-5 h-5 text-primary" />
          </motion.div>
        )
      case "failed":
        return <AlertCircle className="w-5 h-5 text-destructive" />
      case "rejected":
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      default:
        return task.accountabilityType === "visual" ? (
          <Camera className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Clock className="w-5 h-5 text-muted-foreground" />
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
        return "text-green-600"
      case "pending-verification":
        return "text-primary"
      case "failed":
        return "text-destructive"
      case "rejected":
        return "text-orange-500"
      default:
        return "text-muted-foreground"
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
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
        className="bg-card rounded-xl p-6 shadow-sm border border-border"
      >
        <motion.h2 variants={itemVariants} className="text-xl font-bold text-foreground mb-6">
          Today's Tasks
        </motion.h2>

        <div className="space-y-3">
          {tasks.map((task, index) => (
            <MouseGlowEffect
              key={task.id}
              glowColor={task.canComplete ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
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
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                    : task.status === "failed"
                      ? "border-destructive/20 bg-destructive/5"
                      : task.status === "rejected"
                        ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
                        : task.status === "pending-verification"
                          ? "border-primary/20 bg-primary/10"
                          : task.canComplete
                            ? "border-border hover:border-primary cursor-pointer"
                            : "border-border opacity-60"
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
                            : "text-foreground"
                        }`}
                      >
                        {task.name}
                      </h4>
                      <div className="flex items-center space-x-1">
                        {task.goalType === "shared" ? (
                          <Users className="w-3 h-3 text-primary" />
                        ) : (
                          <User className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {task.goalType === "shared" ? "Shared" : "Personal"}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.goalName}</p>
                    {task.timeWindow && (
                      <p className="text-xs text-muted-foreground mt-1">Time window: {task.timeWindow}</p>
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
                      className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors text-sm"
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
          <motion.div variants={itemVariants} className="text-center py-8 text-muted-foreground">
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
