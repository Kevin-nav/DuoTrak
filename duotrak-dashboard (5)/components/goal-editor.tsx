"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Save, Trash2, Users, User, Camera, Clock, Plus, X } from "lucide-react"
import { useState } from "react"

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
  description?: string
  tasks?: Array<{
    id: string
    name: string
    status: "pending" | "completed" | "pending-verification" | "verified" | "failed"
    dueDate: string
  }>
}

interface System {
  id: string
  name: string
  description: string
  frequency: "daily" | "weekly" | "custom"
  customDays?: string[]
  timePreference: "morning" | "evening" | "flexible"
  verificationType: "photo" | "note" | "partner" | "self"
  reminderEnabled: boolean
  reminderTime?: string
}

interface GoalEditorProps {
  goal: Goal
  onSave: (updatedGoal: Goal) => void
  onDelete: (goalId: string) => void
  onClose: () => void
}

export default function GoalEditor({ goal, onSave, onDelete, onClose }: GoalEditorProps) {
  const [formData, setFormData] = useState({
    name: goal.name,
    description: goal.description || "",
    category: goal.category,
    target: goal.total,
    accountabilityType: goal.accountabilityType,
    timeWindow: goal.timeWindow || "",
    type: goal.type,
  })

  const [systems, setSystems] = useState<System[]>([
    {
      id: "system-1",
      name: "Daily Check-in",
      description: "Complete daily task verification",
      frequency: "daily",
      timePreference: "morning",
      verificationType: goal.accountabilityType === "visual" ? "photo" : "self",
      reminderEnabled: true,
      reminderTime: "09:00",
    },
  ])

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<"details" | "systems" | "settings">("details")

  const categories = [
    "Fitness",
    "Health",
    "Education",
    "Career",
    "Personal",
    "Social",
    "Creative",
    "Financial",
    "Spiritual",
    "Family",
  ]

  const handleSave = () => {
    const updatedGoal: Goal = {
      ...goal,
      name: formData.name,
      description: formData.description,
      category: formData.category,
      total: formData.target,
      accountabilityType: formData.accountabilityType,
      timeWindow: formData.timeWindow,
      type: formData.type,
    }
    onSave(updatedGoal)
  }

  const handleDeleteConfirm = () => {
    onDelete(goal.id)
    onClose()
  }

  const addSystem = () => {
    const newSystem: System = {
      id: `system-${Date.now()}`,
      name: "",
      description: "",
      frequency: "daily",
      timePreference: "flexible",
      verificationType: "self",
      reminderEnabled: false,
    }
    setSystems([...systems, newSystem])
  }

  const updateSystem = (systemId: string, updates: Partial<System>) => {
    setSystems((prev) => prev.map((s) => (s.id === systemId ? { ...s, ...updates } : s)))
  }

  const removeSystem = (systemId: string) => {
    setSystems((prev) => prev.filter((s) => s.id !== systemId))
  }

  return (
    <div className="min-h-screen bg-pearl-gray dark:bg-gray-900 pt-16 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6 text-charcoal dark:text-gray-100" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100">Edit Goal</h1>
            <p className="text-sm text-stone-gray dark:text-gray-400">
              {goal.type === "shared" ? "Shared Goal" : "Personal Goal"}
            </p>
          </div>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 hover:bg-error-red/10 text-error-red rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
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

        {/* Tab Navigation */}
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
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-primary-blue text-white shadow-md"
                  : "text-stone-gray dark:text-gray-400 hover:text-charcoal dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Goal Name */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700">
                <label className="block text-sm font-medium text-charcoal dark:text-gray-100 mb-2">Goal Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                  placeholder="Enter goal name..."
                />
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700">
                <label className="block text-sm font-medium text-charcoal dark:text-gray-100 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none resize-none"
                  placeholder="Describe your goal and why it matters to you..."
                />
              </div>

              {/* Category & Target */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700">
                  <label className="block text-sm font-medium text-charcoal dark:text-gray-100 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700">
                  <label className="block text-sm font-medium text-charcoal dark:text-gray-100 mb-2">Target</label>
                  <input
                    type="number"
                    value={formData.target}
                    onChange={(e) => setFormData((prev) => ({ ...prev, target: Number.parseInt(e.target.value) || 0 }))}
                    className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                    placeholder="e.g., 30 days"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "systems" && (
            <motion.div
              key="systems"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Systems List */}
              {systems.map((system, index) => (
                <div
                  key={system.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100">System {index + 1}</h3>
                    <button
                      onClick={() => removeSystem(system.id)}
                      className="p-2 hover:bg-error-red/10 text-error-red rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={system.name}
                      onChange={(e) => updateSystem(system.id, { name: e.target.value })}
                      className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                      placeholder="System name..."
                    />

                    <textarea
                      value={system.description}
                      onChange={(e) => updateSystem(system.id, { description: e.target.value })}
                      rows={2}
                      className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none resize-none"
                      placeholder="System description..."
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={system.frequency}
                        onChange={(e) => updateSystem(system.id, { frequency: e.target.value as any })}
                        className="p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="custom">Custom</option>
                      </select>

                      <select
                        value={system.verificationType}
                        onChange={(e) => updateSystem(system.id, { verificationType: e.target.value as any })}
                        className="p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                      >
                        <option value="self">Self Report</option>
                        <option value="photo">Photo Proof</option>
                        <option value="note">Note Required</option>
                        <option value="partner">Partner Verification</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add System Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addSystem}
                className="w-full p-4 border-2 border-dashed border-cool-gray dark:border-gray-600 rounded-xl hover:border-primary-blue hover:bg-accent-light-blue/10 dark:hover:bg-primary-blue/5 transition-all flex items-center justify-center space-x-2 text-stone-gray dark:text-gray-400 hover:text-primary-blue"
              >
                <Plus className="w-5 h-5" />
                <span>Add New System</span>
              </motion.button>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Accountability Type */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700">
                <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100 mb-4">Accountability Method</h3>

                <div className="space-y-3">
                  <label
                    className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all ${
                      formData.accountabilityType === "visual"
                        ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                        : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountability"
                      checked={formData.accountabilityType === "visual"}
                      onChange={() => setFormData((prev) => ({ ...prev, accountabilityType: "visual" }))}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center ${
                        formData.accountabilityType === "visual"
                          ? "border-primary-blue"
                          : "border-cool-gray dark:border-gray-600"
                      }`}
                    >
                      {formData.accountabilityType === "visual" && (
                        <div className="w-2 h-2 bg-primary-blue rounded-full" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Camera className="w-5 h-5 text-primary-blue" />
                        <span className="font-semibold text-charcoal dark:text-gray-100">Visual Proof</span>
                      </div>
                      <p className="text-sm text-stone-gray dark:text-gray-400">
                        Upload photos to verify task completion
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all ${
                      formData.accountabilityType === "time-bound"
                        ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                        : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountability"
                      checked={formData.accountabilityType === "time-bound"}
                      onChange={() => setFormData((prev) => ({ ...prev, accountabilityType: "time-bound" }))}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-full border-2 mr-3 mt-0.5 flex items-center justify-center ${
                        formData.accountabilityType === "time-bound"
                          ? "border-primary-blue"
                          : "border-cool-gray dark:border-gray-600"
                      }`}
                    >
                      {formData.accountabilityType === "time-bound" && (
                        <div className="w-2 h-2 bg-primary-blue rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Clock className="w-5 h-5 text-primary-blue" />
                        <span className="font-semibold text-charcoal dark:text-gray-100">Time-Bound</span>
                      </div>
                      <p className="text-sm text-stone-gray dark:text-gray-400 mb-3">
                        Complete within specific time windows
                      </p>
                      {formData.accountabilityType === "time-bound" && (
                        <input
                          type="text"
                          placeholder="e.g., 7:00 AM ± 30 mins"
                          value={formData.timeWindow}
                          onChange={(e) => setFormData((prev) => ({ ...prev, timeWindow: e.target.value }))}
                          className="w-full p-2 border border-cool-gray dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none text-sm"
                        />
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Goal Type */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700">
                <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100 mb-4">Goal Type</h3>

                <div className="flex items-center space-x-2 text-sm">
                  {formData.type === "shared" ? (
                    <>
                      <Users className="w-4 h-4 text-primary-blue" />
                      <span className="text-charcoal dark:text-gray-100">Shared Goal</span>
                      {goal.partnerName && (
                        <span className="text-stone-gray dark:text-gray-400">• With {goal.partnerName}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4 text-stone-gray dark:text-gray-400" />
                      <span className="text-charcoal dark:text-gray-100">Personal Goal</span>
                    </>
                  )}
                </div>

                <p className="text-xs text-stone-gray dark:text-gray-400 mt-2">
                  Goal type cannot be changed after creation
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
              >
                <h3 className="text-lg font-bold text-charcoal dark:text-gray-100 mb-2">Delete Goal?</h3>
                <p className="text-stone-gray dark:text-gray-300 mb-6">
                  This action cannot be undone. All progress and associated systems will be permanently deleted.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 px-4 border border-cool-gray dark:border-gray-600 text-charcoal dark:text-gray-100 rounded-lg hover:bg-cool-gray dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 py-2 px-4 bg-error-red hover:bg-error-red/90 text-white rounded-lg transition-colors"
                  >
                    Delete Goal
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
