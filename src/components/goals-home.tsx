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
import { useGoals } from "@/hooks/useGoals"
import { GoalRead } from "@/schemas/goal"

// The old Goal interface is replaced by our backend-driven Zod schema.
type Goal = GoalRead;

interface GoalsHomeProps {
  // Props are removed as this component now fetches its own data.
}

export default function GoalsHome({}: GoalsHomeProps) {
  // --- Data Fetching ---
  const { data: goals = [], isLoading, isError } = useGoals();

  // --- Local UI State ---
  const [activeTab, setActiveTab] = useState<"personal" | "shared">("personal")
  const [showTypeSelector, setShowTypeSelector] = useState(false)
  const [showPersonalWizard, setShowPersonalWizard] = useState(false)
  const [showSharedWizardState, setShowSharedWizardState] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [showGoalEditor, setShowGoalEditor] = useState<Goal | null>(null)

  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([])
  const [filterBy, setFilterBy] = useState<"all" | "active" | "completed" | "shared">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showGoalDetail, setShowGoalDetail] = useState<Goal | null>(null)
  const [showEditGoal, setShowEditGoal] = useState<Goal | null>(null)

  useEffect(() => {
    const filtered = goals.filter((goal) => {
      const matchesSearch =
        goal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (goal.category && goal.category.toLowerCase().includes(searchQuery.toLowerCase()));

      // Milestone 1: Filtering by status/type is disabled as this data is not yet in the backend.
      return matchesSearch;
    });
    setFilteredGoals(filtered);
  }, [goals, filterBy, searchQuery]);

  const getStatusEmoji = (status: any) => "🎯"; // Placeholder
  const getStatusText = (goal: Goal) => "In Progress"; // Placeholder

  const handleCreateGoal = () => { /* Temporarily disabled */ }
  const handleGoalTypeSelect = (type: "personal" | "shared") => { /* Temporarily disabled */ }
  const handleGoalClick = (goal: Goal) => { setSelectedGoal(goal) }
  const handleEditGoal = (goal: Goal) => { /* Temporarily disabled */ }
  const handleDeleteGoal = (goalId: string) => { /* Temporarily disabled */ }
  const handleArchiveGoal = (goalId: string) => { /* Temporarily disabled */ }
  const handleDuplicateGoal = (goal: Goal) => { /* Temporarily disabled */ }
  const handleSaveGoal = (updatedGoal: Goal) => { /* Temporarily disabled */ }
  const handleDeleteGoalFromEditor = (goalId: string) => { /* Temporarily disabled */ }

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

  // --- Render Logic ---

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-charcoal dark:text-gray-100 mb-2">Loading Goals...</h1>
          {/* TODO: Add skeleton loaders here for a better UX */}
        </div>
      </DashboardLayout>
    )
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-red-500 mb-2">Error Fetching Goals</h1>
          <p className="text-stone-gray dark:text-gray-300">Could not load your goals. Please try again later.</p>
        </div>
      </DashboardLayout>
    )
  }

  // The original JSX for wizards and detail views is preserved below,
  // but the entry points are commented out in the handlers above for Milestone 1.
  if (showTypeSelector) {
    // ... Original JSX is preserved but currently unreachable
  }
  // ... other modals

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

          {/* Filter Tabs (Functionality simplified for Milestone 1) */}
          <div className="flex bg-pearl-gray dark:bg-gray-700 rounded-lg p-1">
            {/* This section will be re-enabled when status/type fields are added to the backend */}
          </div>
        </motion.div>

        {/* Enhanced Goals Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key="goals-list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            {filteredGoals.length > 0 ? (
              filteredGoals.map((goal) => {
                const Icon = Target; // Placeholder icon
                // In the future, we can map goal.icon (string) to a component
                // const progressPercentage = (goal.progress / goal.total) * 100; // Re-enable when data is available

                return (
                  <MouseGlowEffect key={goal.id} glowColor={goal.color || "#cccccc"} intensity="medium">
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
                          <Icon className="w-6 h-6" style={{ color: goal.color || "#cccccc" }} />
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          {/* Goal Header with Actions */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 cursor-pointer" onClick={() => handleGoalClick(goal)}>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="text-lg font-bold text-charcoal dark:text-gray-100">{goal.name}</h3>
                                {/* <User className="w-4 h-4 text-stone-gray dark:text-gray-400" /> */}
                              </div>
                              <p className="text-sm text-stone-gray dark:text-gray-400">
                                {goal.category} • Created {new Date(goal.created_at).toLocaleDateString()}
                              </p>
                            </div>

                            {/* Goal Actions Menu (Disabled for Milestone 1) */}
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Buttons will be re-enabled in a future milestone */}
                            </div>

                            {/* Status Badge (Disabled for Milestone 1) */}
                          </div>

                          {/* Progress Section (Disabled for Milestone 1) */}
                          
                          {/* Enhanced Goal Info (Simplified for Milestone 1) */}
                          <div className="mt-3 flex items-center justify-between">
                             <div className="flex items-center space-x-2 text-xs">
                              <span className="text-stone-gray dark:text-gray-400">
                                {goal.tasks.length} tasks
                              </span>
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
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-charcoal dark:text-gray-100 mb-2">
                      No goals yet
                    </h3>
                    <p className="text-stone-gray dark:text-gray-300 mb-6">
                      Start building new habits and achieving your dreams!
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Fixed Floating Action Button (Disabled for Milestone 1) */}
        <div className="fixed bottom-24 right-6 z-40">
          <motion.button
            disabled
            className="w-14 h-14 bg-gray-300 dark:bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center cursor-not-allowed"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </DashboardLayout>
  )
}