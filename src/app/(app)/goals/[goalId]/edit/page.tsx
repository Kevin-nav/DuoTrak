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
      // DomainGoal has [key: string]: unknown index signature,
      // so spread properties like name/total resolve as unknown
      const g = goal as any;
      setName(g.name)
      setDescription(g.description || "")
      setCategory(g.category || "")
      setTotal(g.total)
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
          className="mb-6 space-y-3"
        >
          <div className="flex items-center justify-between">
            <button onClick={() => router.back()} className="rounded-lg p-2 transition-colors hover:bg-white dark:hover:bg-gray-800">
              <ArrowLeft className="h-6 w-6 text-charcoal dark:text-gray-100" />
            </button>
            <h1 className="text-xl font-bold text-charcoal dark:text-gray-100 sm:text-2xl">Edit Goal</h1>
            <div className="w-10" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleArchive}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-error-red transition-colors hover:bg-error-red/10"
              title="Archive Goal"
            >
              <Archive className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="flex h-10 items-center gap-2 rounded-lg bg-primary-blue px-4 py-2 text-white transition-colors hover:bg-primary-blue-hover"
            >
              <Save className="h-4 w-4" />
              <span>Save</span>
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid grid-cols-1 gap-2 rounded-xl border border-cool-gray bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-3 sm:p-1"
        >
          {[
            { key: "details", label: "Goal Details" },
            { key: "systems", label: "Systems & Tasks" },
            { key: "settings", label: "Settings" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${activeTab === tab.key
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
              <div className="rounded-xl border border-cool-gray bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
                <label className="block text-sm font-medium text-charcoal dark:text-gray-100 mb-2">Goal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-cool-gray bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
                <label className="block text-sm font-medium text-charcoal dark:text-gray-100 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-cool-gray bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
                  <label className="block text-sm font-medium text-charcoal dark:text-gray-100 mb-2">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                  />
                </div>

                <div className="rounded-xl border border-cool-gray bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
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
