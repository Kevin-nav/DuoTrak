"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Save, Archive } from "lucide-react";
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGoal, useUpdateGoal, useArchiveGoal } from "@/hooks/useGoals"
import { GoalUpdate } from "@/schemas/goal"
import DashboardLayout from "@/components/dashboard-layout"

export default function GoalEditPage() {
  const router = useRouter()
  const params = useParams()
  const goalId = params.goalId as string

  const { data: goal, isLoading, isError } = useGoal(goalId)
  const updateGoal = useUpdateGoal(goalId)
  const archiveGoal = useArchiveGoal();

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [total, setTotal] = useState(0)
  const [activeTab, setActiveTab] = useState<"details" | "systems" | "settings">("details")

  useEffect(() => {
    if (goal) {
      setName(goal.name)
      setDescription(goal.description || "")
      setCategory(goal.category || "")
      setTotal(goal.total)
    }
  }, [goal])

  const handleSave = async () => {
    // Note: description and total are not currently supported in the Convex schema
    // They are displayed in the UI but not persisted until the schema is extended
    const updatedGoal: GoalUpdate = {
      name,
      category: category || undefined,
    }
    updateGoal.mutate(updatedGoal, {
      onSuccess: () => router.push("/goals"),
    });
  }

  const handleArchive = () => {
    archiveGoal.mutate(goalId, {
      onSuccess: () => router.push("/goals"),
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading goal...</div>
      </DashboardLayout>
    )
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-red-500">Error fetching goal.</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <button onClick={() => router.back()} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-charcoal dark:text-gray-100" />
          </button>
          <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100">Edit Goal</h1>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleArchive}
              className="p-2 hover:bg-error-red/10 text-error-red rounded-lg transition-colors"
              title="Archive Goal"
            >
              <Archive className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="px-4 py-2 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex bg-white dark:bg-gray-800 rounded-xl p-1 mb-6 shadow-sm border border-cool-gray dark:border-gray-700"
        >
          {[
            { key: "details", label: "Goal Details" },
            { key: "systems", label: "Systems & Tasks" },
            { key: "settings", label: "Settings" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${activeTab === tab.key
                ? "bg-primary-blue text-white shadow-md"
                : "text-stone-gray dark:text-gray-400 hover:text-charcoal dark:hover:text-gray-200"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700">
                <label className="block text-sm font-medium text-charcoal dark:text-gray-100 mb-2">Goal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700">
                <label className="block text-sm font-medium text-charcoal dark:text-gray-100 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700">
                  <label className="block text-sm font-medium text-charcoal dark:text-gray-100 mb-2">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                  />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700">
                  <label className="block text-sm font-medium text-charcoal dark:text-gray-100 mb-2">Target</label>
                  <input
                    type="number"
                    value={total}
                    onChange={(e) => setTotal(Number.parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  )
}
