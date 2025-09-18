"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Target,
  Clock,
  Camera,
  Star,
  Users,
  User,
  CheckCircle,
  AlertCircle,
  Search,
  Edit,
  Copy,
  Archive,
} from "lucide-react"
import { useState, useEffect } from "react"
import MouseGlowEffect from "./mouse-glow-effect"
import SharedGoalWizard from "./shared-goal-wizard"
import GoalInvitationReview from "./goal-invitation-review"
import GoalCreationWizard from "./goal-creation-wizard"
import GoalTypeSelector from "./goal-type-selector"
import DashboardLayout from "./dashboard-layout"
import GoalEditor from "./goal-editor"

interface Goal {
  id: string
  name: string
  category: string
  icon: React.ComponentType<any>
  progress: number
  total: number
  status: "on-track" | "ahead" | "needs-attention" | "completed"
  color: string
  accountabilityType: "visual" | "time-bound"
  timeWindow?: string
  type: "personal" | "shared"
  partnerName?: string
  partnerInitials?: string
  createdAt: string
  tasks?: Array<{
    id: string
    name: string
    status: "pending" | "completed" | "pending-verification" | "verified" | "failed"
    dueDate: string
  }>
}

interface GoalsHomeProps {
  personalGoals?: Goal[]
  sharedGoals?: Goal[]
  showSharedWizard?: boolean
  showInvitationReview?: boolean
  hasPartner?: boolean
  partnerName?: string
}

export default function GoalsHome({
  personalGoals = [
    {
      id: "personal-1",
      name: "Daily Meditation",
      category: "Wellness",
      icon: Target,
      progress: 5,
      total: 10,
      status: "on-track",
      color: "#10B981",
      accountabilityType: "visual",
      type: "personal",
      createdAt: "2 days ago",
      tasks: [
        { id: "t1", name: "Morning meditation", status: "completed", dueDate: "Today" },
        { id: "t2", name: "Evening reflection", status: "pending", dueDate: "Today" },
        { id: "t3", name: "Mindfulness practice", status: "pending", dueDate: "Tomorrow" },
      ],
    },
    {
      id: "personal-2",
      name: "Learn Spanish",
      category: "Education",
      icon: Star,
      progress: 15,
      total: 20,
      status: "ahead",
      color: "#F59E0B",
      accountabilityType: "time-bound",
      timeWindow: "7:00 PM ± 30 mins",
      type: "personal",
      createdAt: "1 week ago",
      tasks: [
        { id: "t4", name: "Daily vocabulary", status: "verified", dueDate: "Today" },
        { id: "t5", name: "Grammar practice", status: "completed", dueDate: "Today" },
      ],
    },
  ],
  sharedGoals = [
    {
      id: "shared-1",
      name: "Morning Running Duo",
      category: "Fitness",
      icon: Target,
      progress: 8,
      total: 14,
      status: "on-track",
      color: "#8B5CF6",
      accountabilityType: "visual",
      type: "shared",
      partnerName: "John",
      partnerInitials: "JD",
      createdAt: "3 days ago",
      tasks: [
        { id: "t6", name: "Morning run", status: "pending-verification", dueDate: "Today" },
        { id: "t7", name: "Post-run stretch", status: "pending", dueDate: "Today" },
      ],
    },
  ],
  showSharedWizard = false,
  showInvitationReview = false,
  hasPartner = true,
  partnerName = "John",
}: GoalsHomeProps) {
  const [activeTab, setActiveTab] = useState<"personal" | "shared">("personal")
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [showPersonalWizard, setShowPersonalWizard] = useState(false)
  const [showSharedWizardState, setShowSharedWizardState] = useState(showSharedWizard)
  const [showReview, setShowReview] = useState(showInvitationReview)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [showGoalEditor, setShowGoalEditor] = useState<Goal | null>(null)

  const [goals, setGoals] = useState<Goal[]>([...personalGoals, ...sharedGoals])
  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([])
  const [filterBy, setFilterBy] = useState<"all" | "active" | "completed" | "shared">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showGoalDetail, setShowGoalDetail] = useState<Goal | null>(null)
  const [showEditGoal, setShowEditGoal] = useState<Goal | null>(null)

  const allGoals = [...personalGoals, ...sharedGoals]

  useEffect(() => {
    const filtered = goals.filter((goal) => {
      const matchesSearch =
        goal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.category.toLowerCase().includes(searchQuery.toLowerCase())

      switch (filterBy) {
        case "active":
          return matchesSearch && goal.status !== "completed"
        case "completed":
          return matchesSearch && goal.status === "completed"
        case "shared":
          return matchesSearch && goal.type === "shared"
        default:
          return matchesSearch
      }
    })
    setFilteredGoals(filtered)
  }, [goals, filterBy, searchQuery])

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "on-track":
        return "🎉"
      case "ahead":
        return "🚀"
      case "needs-attention":
        return "⏳"
      case "completed":
        return "✅"
      default:
        return "🎯"
    }
  }

  const getStatusText = (goal: Goal) => {
    switch (goal.status) {
      case "on-track":
        return goal.type === "shared" ? "Duo On Track" : "On Track"
      case "ahead":
        return goal.type === "shared" ? "Duo Ahead" : "Ahead of Schedule"
      case "needs-attention":
        return goal.type === "shared" ? "Duo Needs Attention" : "Needs Attention"
      case "completed":
        return goal.type === "shared" ? "Together, You Did It!" : "Completed"
      default:
        return "In Progress"
    }
  }

  const handleCreateGoal = () => {
    setShowTypeSelector(true)
  }

  const handleGoalTypeSelect = (type: "personal" | "shared") => {
    setShowTypeSelector(false)
    if (type === "personal") {
      setShowPersonalWizard(true)
    } else {
      setShowSharedWizardState(true)
    }
  }

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal)
  }

  const handleEditGoal = (goal: Goal) => {
    setShowGoalEditor(goal)
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId))
  }

  const handleArchiveGoal = (goalId: string) => {
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, status: "completed" as const } : g)))
  }

  const handleDuplicateGoal = (goal: Goal) => {
    const newGoal: Goal = {
      ...goal,
      id: `${goal.id}-copy-${Date.now()}`,
      name: `${goal.name} (Copy)`,
      progress: 0,
      status: "on-track",
      createdAt: "Just now",
    }
    setGoals((prev) => [...prev, newGoal])
  }

  const handleSaveGoal = (updatedGoal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)))
    setShowGoalEditor(null)
  }

  const handleDeleteGoalFromEditor = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId))
    setShowGoalEditor(null)
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
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  // Show wizards or selectors
  if (showTypeSelector) {
    return (
      <DashboardLayout>
        <GoalTypeSelector
          onClose={() => setShowTypeSelector(false)}
          onSelectType={handleGoalTypeSelect}
          hasPartner={hasPartner}
          partnerName={partnerName}
        />
      </DashboardLayout>
    )
  }

  if (showPersonalWizard) {
    return (
      <DashboardLayout>
        <GoalCreationWizard />
      </DashboardLayout>
    )
  }

  if (showSharedWizardState) {
    return (
      <DashboardLayout>
        <SharedGoalWizard partnerName={partnerName} onClose={() => setShowSharedWizardState(false)} />
      </DashboardLayout>
    )
  }

  if (showReview) {
    return (
      <DashboardLayout>
        <GoalInvitationReview
          goalName="Morning Running Duo"
          initiatorName="Sarah"
          onAccept={() => setShowReview(false)}
          onReject={() => setShowReview(false)}
          onEdit={() => setShowReview(false)}
        />
      </DashboardLayout>
    )
  }

  // Show goal detail view
  if (selectedGoal) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-pearl-gray dark:bg-gray-900 pt-16 pb-20">
          <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Goal Detail Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center mb-6"
            >
              <button
                onClick={() => setSelectedGoal(null)}
                className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors mr-4"
              >
                <motion.div whileHover={{ x: -2 }}>←</motion.div>
              </button>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  {selectedGoal.type === "shared" ? (
                    <Users className="w-5 h-5 text-primary-blue" />
                  ) : (
                    <User className="w-5 h-5 text-stone-gray dark:text-gray-400" />
                  )}
                  <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100">{selectedGoal.name}</h1>
                </div>
                <p className="text-stone-gray dark:text-gray-400">
                  {selectedGoal.category} • {selectedGoal.type === "shared" ? "Shared" : "Personal"} Goal
                </p>
              </div>
            </motion.div>

            {/* Goal Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-charcoal dark:text-gray-100">Overall Progress</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-stone-gray dark:text-gray-400">
                    {selectedGoal.progress}/{selectedGoal.total} completed
                  </span>
                  <span className="text-sm">{getStatusEmoji(selectedGoal.status)}</span>
                </div>
              </div>

              <div className="relative h-3 bg-cool-gray dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(selectedGoal.progress / selectedGoal.total) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full relative"
                  style={{ backgroundColor: selectedGoal.color }}
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
                  {selectedGoal.accountabilityType === "visual" ? "Photo verification" : "Time-bound completion"}
                </span>
                <span className="font-medium" style={{ color: selectedGoal.color }}>
                  {Math.round((selectedGoal.progress / selectedGoal.total) * 100)}% complete
                </span>
              </div>

              {selectedGoal.type === "shared" && (
                <div className="mt-4 pt-4 border-t border-cool-gray dark:border-gray-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-blue rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {selectedGoal.partnerInitials}
                    </div>
                    <span className="text-sm text-stone-gray dark:text-gray-300">
                      Working together with {selectedGoal.partnerName}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Tasks List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
            >
              <h2 className="text-lg font-semibold text-charcoal dark:text-gray-100 mb-4">Recent Tasks</h2>

              <div className="space-y-3">
                {selectedGoal.tasks?.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      task.status === "completed" || task.status === "verified"
                        ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                        : task.status === "pending-verification"
                          ? "border-primary-blue/20 bg-accent-light-blue dark:bg-primary-blue/10"
                          : task.status === "failed"
                            ? "border-error-red/20 bg-error-red/5 dark:bg-error-red/10"
                            : "border-cool-gray dark:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {task.status === "completed" || task.status === "verified" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : task.status === "pending-verification" ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          >
                            <Clock className="w-5 h-5 text-primary-blue" />
                          </motion.div>
                        ) : task.status === "failed" ? (
                          <AlertCircle className="w-5 h-5 text-error-red" />
                        ) : selectedGoal.accountabilityType === "visual" ? (
                          <Camera className="w-5 h-5 text-stone-gray dark:text-gray-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-stone-gray dark:text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-medium ${
                            task.status === "completed" || task.status === "verified"
                              ? "text-green-700 dark:text-green-300 line-through"
                              : "text-charcoal dark:text-gray-100"
                          }`}
                        >
                          {task.name}
                        </p>
                        <p className="text-sm text-stone-gray dark:text-gray-400">{task.dueDate}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-medium ${
                          task.status === "completed" || task.status === "verified"
                            ? "text-green-600 dark:text-green-400"
                            : task.status === "pending-verification"
                              ? "text-primary-blue"
                              : task.status === "failed"
                                ? "text-error-red"
                                : "text-stone-gray dark:text-gray-400"
                        }`}
                      >
                        {task.status === "completed"
                          ? "Completed"
                          : task.status === "verified"
                            ? "Verified ✅"
                            : task.status === "pending-verification"
                              ? "Awaiting Verification"
                              : task.status === "failed"
                                ? "Missed"
                                : "Pending"}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (showGoalEditor) {
    return (
      <DashboardLayout>
        <GoalEditor
          goal={showGoalEditor}
          onSave={handleSaveGoal}
          onDelete={handleDeleteGoalFromEditor}
          onClose={() => setShowGoalEditor(null)}
        />
      </DashboardLayout>
    )
  }

  // Main Goals Home Page
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-charcoal dark:text-gray-100 mb-2">Your Goals</h1>
          <p className="text-stone-gray dark:text-gray-300">Track your progress and achieve your dreams</p>
        </motion.div>

        {/* Enhanced Tab Navigation with Filtering */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-cool-gray dark:border-gray-700"
        >
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-gray dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-pearl-gray dark:bg-gray-700 rounded-lg p-1">
            {[
              { key: "all", label: "All Goals", count: goals.length },
              { key: "active", label: "Active", count: goals.filter((g) => g.status !== "completed").length },
              { key: "completed", label: "Completed", count: goals.filter((g) => g.status === "completed").length },
              { key: "shared", label: "Shared", count: goals.filter((g) => g.type === "shared").length },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterBy(filter.key as any)}
                className={`flex-1 py-2 px-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm ${
                  filterBy === filter.key
                    ? "bg-white dark:bg-gray-600 text-primary-blue shadow-sm"
                    : "text-stone-gray dark:text-gray-400 hover:text-charcoal dark:hover:text-gray-200"
                }`}
              >
                <span>{filter.label}</span>
                {filter.count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      filterBy === filter.key
                        ? "bg-primary-blue/10 text-primary-blue"
                        : "bg-stone-gray/10 text-stone-gray dark:text-gray-400"
                    }`}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Goals Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${filterBy}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            {filteredGoals.length > 0 ? (
              filteredGoals.map((goal) => {
                const Icon = goal.icon
                const progressPercentage = (goal.progress / goal.total) * 100

                return (
                  <MouseGlowEffect key={goal.id} glowColor={goal.color} intensity="medium">
                    <motion.div
                      variants={itemVariants}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 group"
                    >
                      <div className="flex items-start space-x-4">
                        {/* Goal Icon */}
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer"
                          style={{ backgroundColor: `${goal.color}20` }}
                          onClick={() => handleGoalClick(goal)}
                        >
                          <Icon className="w-6 h-6" style={{ color: goal.color }} />
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          {/* Goal Header with Actions */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 cursor-pointer" onClick={() => handleGoalClick(goal)}>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-lg font-bold text-charcoal dark:text-gray-100">{goal.name}</h3>
                                {goal.type === "shared" ? (
                                  <Users className="w-4 h-4 text-primary-blue" />
                                ) : (
                                  <User className="w-4 h-4 text-stone-gray dark:text-gray-400" />
                                )}
                              </div>
                              <p className="text-sm text-stone-gray dark:text-gray-400">
                                {goal.category} • Created {goal.createdAt}
                                {goal.type === "shared" && goal.partnerName && <span> • With {goal.partnerName}</span>}
                              </p>
                            </div>

                            {/* Goal Actions Menu */}
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditGoal(goal)}
                                className="p-2 hover:bg-cool-gray dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Edit Goal"
                              >
                                <Edit className="w-4 h-4 text-stone-gray dark:text-gray-400" />
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDuplicateGoal(goal)}
                                className="p-2 hover:bg-cool-gray dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Duplicate Goal"
                              >
                                <Copy className="w-4 h-4 text-stone-gray dark:text-gray-400" />
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleArchiveGoal(goal.id)}
                                className="p-2 hover:bg-cool-gray dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Archive Goal"
                              >
                                <Archive className="w-4 h-4 text-stone-gray dark:text-gray-400" />
                              </motion.button>
                            </div>

                            {/* Status Badge */}
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className={`px-3 py-1 rounded-full text-xs font-medium ml-2 ${
                                goal.status === "on-track"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  : goal.status === "ahead"
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : goal.status === "needs-attention"
                                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {getStatusText(goal)} {getStatusEmoji(goal.status)}
                            </motion.div>
                          </div>

                          {/* Progress Section */}
                          <div className="space-y-2 cursor-pointer" onClick={() => handleGoalClick(goal)}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-stone-gray dark:text-gray-400">Progress</span>
                              <span className="text-sm font-semibold text-charcoal dark:text-gray-100">
                                {goal.progress}/{goal.total}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative h-3 bg-cool-gray dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                                className="h-full rounded-full relative"
                                style={{ backgroundColor: goal.color }}
                              >
                                <motion.div
                                  animate={{ x: [-100, 200] }}
                                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                                />
                              </motion.div>
                            </div>
                          </div>

                          {/* Enhanced Goal Info */}
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-stone-gray dark:text-gray-400">
                              {goal.accountabilityType === "visual" ? (
                                <div className="flex items-center space-x-1">
                                  <Camera className="w-3 h-3" />
                                  <span>Photo verification</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Time-bound: {goal.timeWindow}</span>
                                </div>
                              )}

                              <div className="flex items-center space-x-1">
                                <Target className="w-3 h-3" />
                                <span>{Math.round(progressPercentage)}% complete</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 text-xs">
                              <span className="text-stone-gray dark:text-gray-400">
                                {goal.tasks?.filter((t) => t.status === "pending").length || 0} pending
                              </span>
                              {goal.tasks?.filter((t) => t.status === "pending-verification").length > 0 && (
                                <span className="bg-primary-blue/10 text-primary-blue px-2 py-0.5 rounded-full">
                                  {goal.tasks.filter((t) => t.status === "pending-verification").length} awaiting
                                  verification
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </MouseGlowEffect>
                )
              })
            ) : (
              // Enhanced Empty State
              <motion.div
                variants={itemVariants}
                className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-cool-gray dark:border-gray-700"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="mb-6"
                >
                  {searchQuery ? (
                    <Search className="w-16 h-16 text-stone-gray dark:text-gray-400 mx-auto mb-4" />
                  ) : (
                    <Target className="w-16 h-16 text-primary-blue mx-auto mb-4" />
                  )}
                </motion.div>

                {searchQuery ? (
                  <>
                    <h3 className="text-xl font-bold text-charcoal dark:text-gray-100 mb-2">
                      No goals found for "{searchQuery}"
                    </h3>
                    <p className="text-stone-gray dark:text-gray-300 mb-6">
                      Try adjusting your search or create a new goal
                    </p>
                    <div className="flex justify-center space-x-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSearchQuery("")}
                        className="px-4 py-2 border border-cool-gray dark:border-gray-600 text-charcoal dark:text-gray-100 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      >
                        Clear Search
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreateGoal}
                        className="px-4 py-2 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg transition-colors"
                      >
                        Create New Goal
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-charcoal dark:text-gray-100 mb-2">
                      {filterBy === "completed"
                        ? "No completed goals yet"
                        : filterBy === "shared"
                          ? "No shared goals yet"
                          : filterBy === "active"
                            ? "No active goals"
                            : "No goals yet"}
                    </h3>
                    <p className="text-stone-gray dark:text-gray-300 mb-6">
                      {filterBy === "completed"
                        ? "Complete your first goal to see it here!"
                        : filterBy === "shared"
                          ? "Create a shared goal with your partner!"
                          : "Start building new habits and achieving your dreams!"}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCreateGoal}
                      className="px-6 py-3 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg font-medium transition-colors"
                    >
                      Create Your First Goal
                    </motion.button>
                  </>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Fixed Floating Action Button */}
        <div className="fixed bottom-24 right-6 z-40">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateGoal}
              className="w-14 h-14 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 relative overflow-hidden group"
            >
              {/* Glow effect on hover */}
              <motion.div
                className="absolute inset-0 bg-primary-blue rounded-full opacity-0 group-hover:opacity-30 blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />

              {/* Shimmer effect */}
              <motion.div
                animate={{ x: [-100, 200] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 opacity-0 group-hover:opacity-100"
              />

              {/* Plus icon */}
              <Plus className="w-6 h-6 relative z-10" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  )
}
