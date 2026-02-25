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
  goalArchetype?: "savings" | "marathon" | "daily_habit" | "general"
  goalProfileJson?: string
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
      goalArchetype: "daily_habit",
      goalProfileJson: JSON.stringify({ currentStreak: 8, targetStreak: 21 }),
      goalType: "personal",
      accountabilityType: "visual",
      status: "pending",
      canComplete: true,
    },
    {
      id: "2",
      name: "Partner Workout",
      goalName: "Fitness Duo",
      goalArchetype: "marathon",
      goalProfileJson: JSON.stringify({ completedWeeks: 5, totalWeeks: 16 }),
      goalType: "shared",
      accountabilityType: "visual",
      status: "pending-verification",
      canComplete: false,
    },
    {
      id: "3",
      name: "Wake up at 7 AM",
      goalName: "Morning Routine",
      goalArchetype: "daily_habit",
      goalProfileJson: JSON.stringify({ currentStreak: 2, targetStreak: 30 }),
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
      goalArchetype: "general",
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
      goalArchetype: "savings",
      goalProfileJson: JSON.stringify({ currentAmount: 420, targetAmount: 1000, currency: "USD" }),
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

  const parseGoalProfile = (task: Task): Record<string, unknown> => {
    if (!task.goalProfileJson) return {};
    try {
      return JSON.parse(task.goalProfileJson) as Record<string, unknown>;
    } catch {
      return {};
    }
  };

  const getArchetypeActionLabel = (task: Task): string => {
    if (task.status === "rejected") return "Resubmit";
    if (task.goalArchetype === "savings") return "Log Deposit";
    if (task.goalArchetype === "marathon") return "Log Run";
    if (task.goalArchetype === "daily_habit") return "Check In";
    return getStatusText(task);
  };

  const getArchetypeHint = (task: Task): string | null => {
    const profile = parseGoalProfile(task);
    if (task.goalArchetype === "savings") {
      const current = Number(profile.currentAmount || 0);
      const target = Number(profile.targetAmount || 0);
      const currency = String(profile.currency || "USD");
      return `${currency} ${current.toLocaleString()} / ${target.toLocaleString()}`;
    }
    if (task.goalArchetype === "marathon") {
      const completed = Number(profile.completedWeeks || 0);
      const total = Number(profile.totalWeeks || 0);
      return `Week progress ${completed}/${total}`;
    }
    if (task.goalArchetype === "daily_habit") {
      const streak = Number(profile.currentStreak || 0);
      const target = Number(profile.targetStreak || 0);
      return `Streak ${streak}/${target}`;
    }
    return null;
  };

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
        className="rounded-xl border border-cool-gray bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700 sm:p-6"
      >
        <motion.h2 variants={itemVariants} className="mb-4 text-lg font-bold text-charcoal dark:text-gray-100 sm:mb-6 sm:text-xl">
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
                whileHover={task.canComplete ? { scale: 1.005 } : {}}
                onClick={() => handleTaskClick(task)}
                className={`rounded-lg border p-3.5 transition-all sm:p-4 ${
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 sm:items-center sm:space-x-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">{getStatusIcon(task)}</div>

                  {/* Task Info */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:space-x-2">
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
                    <p className="text-xs text-stone-gray dark:text-gray-400 sm:text-sm">{task.goalName}</p>
                    {getArchetypeHint(task) && (
                      <p className="text-xs font-medium text-primary-blue mt-1">{getArchetypeHint(task)}</p>
                    )}
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
                <div className="w-full sm:w-auto sm:flex-shrink-0">
                  {task.canComplete && (task.status === "pending" || task.status === "rejected") ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full rounded-lg bg-primary-blue px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-blue-hover sm:w-auto sm:py-1.5"
                    >
                      {getArchetypeActionLabel(task)}
                    </motion.button>
                  ) : (
                    <span className={`block text-right text-sm font-medium sm:text-left ${getStatusColor(task)}`}>{getStatusText(task)}</span>
                  )}
                </div>
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
