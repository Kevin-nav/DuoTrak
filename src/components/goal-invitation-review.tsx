"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Users, Clock, Camera, Edit, Check, X, AlertCircle } from "lucide-react"
import { useState } from "react"
import MouseGlowEffect from "./mouse-glow-effect"

interface GoalInvitationReviewProps {
  goalName?: string
  initiatorName?: string
  goalDescription?: string
  suggestedRoutine?: string[]
  accountabilityType?: "visual" | "time-bound"
  recommendationReasons?: string[]
  onAccept?: () => void
  onReject?: () => void
  onEdit?: () => void
}

export default function GoalInvitationReview({
  goalName = "Morning Running Duo",
  initiatorName = "Sarah",
  goalDescription = "Run together every morning to build fitness and accountability",
  suggestedRoutine = [
    "Start with 15-minute morning runs",
    "Meet at the local park at 6:30 AM",
    "Take a post-run selfie together",
    "Track distance using fitness app",
    "Gradually increase duration each week",
  ],
  accountabilityType = "visual",
  recommendationReasons = [],
  onAccept,
  onReject,
  onEdit,
}: GoalInvitationReviewProps) {
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [showEditMode, setShowEditMode] = useState(false)
  const [editedRoutine, setEditedRoutine] = useState(suggestedRoutine)
  const [showReasons, setShowReasons] = useState(false)

  const rejectReasons = ["Too busy right now", "Not interested in this goal", "Not a priority", "Schedule conflict"]

  const handleReject = () => {
    setShowRejectModal(false)
    onReject?.()
  }

  const handleEdit = () => {
    setShowEditMode(true)
  }

  const handleSaveEdit = () => {
    setShowEditMode(false)
    onEdit?.()
  }

  const addRoutineItem = () => {
    setEditedRoutine([...editedRoutine, ""])
  }

  const updateRoutineItem = (index: number, value: string) => {
    const updated = [...editedRoutine]
    updated[index] = value
    setEditedRoutine(updated)
  }

  const removeRoutineItem = (index: number) => {
    setEditedRoutine(editedRoutine.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen bg-pearl-gray dark:bg-gray-900 pt-16 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center mb-6">
          <button className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors mr-4">
            <ArrowLeft className="w-6 h-6 text-charcoal dark:text-gray-100" />
          </button>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Users className="w-5 h-5 text-primary-blue" />
              <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100">A Goal Awaits!</h1>
            </div>
            <p className="text-stone-gray dark:text-gray-400">Review your shared goal invitation</p>
          </div>
        </motion.div>

        {/* Goal Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-blue/10 to-accent-light-blue/20 dark:from-primary-blue/20 dark:to-accent-light-blue/10 rounded-xl p-6 mb-6 border border-primary-blue/20"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Users className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-charcoal dark:text-gray-100 mb-2">{goalName}</h2>
            <p className="text-stone-gray dark:text-gray-300 mb-3">{goalDescription}</p>
            <div className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2">
              <span className="text-sm text-stone-gray dark:text-gray-400">Invited by</span>
              <span className="text-sm font-semibold text-primary-blue">{initiatorName}</span>
            </div>
          </div>
        </motion.div>

        {recommendationReasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-accent-light-blue dark:bg-primary-blue/10 border border-primary-blue/20 rounded-xl p-4 mb-6"
          >
            <button
              type="button"
              onClick={() => setShowReasons((prev) => !prev)}
              className="w-full text-left text-sm font-semibold text-primary-blue"
            >
              Why this routine was recommended {showReasons ? "▲" : "▼"}
            </button>
            {showReasons && (
              <ul className="mt-2 space-y-1 text-sm text-stone-gray dark:text-gray-300">
                {recommendationReasons.slice(0, 3).map((reason, index) => (
                  <li key={`reason-${index}`}>• {reason}</li>
                ))}
              </ul>
            )}
          </motion.div>
        )}

        {/* Personalized Routine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100">Your Personalized Routine</h3>
            {!showEditMode && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEdit}
                className="flex items-center space-x-2 text-primary-blue hover:text-primary-blue-hover transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm font-medium">Customize</span>
              </motion.button>
            )}
          </div>

          {!showEditMode ? (
            <div className="space-y-3">
              {suggestedRoutine.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start space-x-3 p-3 bg-pearl-gray dark:bg-gray-700 rounded-lg"
                >
                  <div className="w-6 h-6 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                  <p className="text-sm text-charcoal dark:text-gray-100 leading-relaxed">{item}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {editedRoutine.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-primary-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateRoutineItem(index, e.target.value)}
                    className="flex-1 p-2 border border-cool-gray dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none text-sm"
                    placeholder="Enter routine step..."
                  />
                  <button
                    onClick={() => removeRoutineItem(index)}
                    className="p-1 text-error-red hover:bg-error-red/10 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex space-x-2">
                <button
                  onClick={addRoutineItem}
                  className="px-3 py-2 border border-primary-blue text-primary-blue rounded hover:bg-accent-light-blue dark:hover:bg-primary-blue/10 transition-colors text-sm"
                >
                  + Add Step
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-2 bg-primary-blue text-white rounded hover:bg-primary-blue-hover transition-colors text-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Accountability Info */}
          <div className="mt-4 p-3 bg-accent-light-blue dark:bg-primary-blue/10 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              {accountabilityType === "visual" ? (
                <Camera className="w-4 h-4 text-primary-blue" />
              ) : (
                <Clock className="w-4 h-4 text-primary-blue" />
              )}
              <span className="text-sm font-medium text-primary-blue">
                {accountabilityType === "visual" ? "Photo Verification Required" : "Time-Bound Completion"}
              </span>
            </div>
            <p className="text-xs text-stone-gray dark:text-gray-300">
              {accountabilityType === "visual"
                ? "Both you and your partner will need to upload photos to confirm task completion"
                : "Tasks must be completed within the specified time window"}
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {/* Accept Button */}
          <MouseGlowEffect glowColor="#10B981" intensity="high">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 8px 25px rgba(16, 185, 129, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              onClick={onAccept}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2 relative overflow-hidden"
            >
              <motion.div
                animate={{ x: [-100, 200] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
              />
              <Check className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Accept & Use This Routine</span>
            </motion.button>
          </MouseGlowEffect>

          {/* Edit Button */}
          <MouseGlowEffect glowColor="#19A1E5" intensity="medium">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleEdit}
              className="w-full bg-primary-blue hover:bg-primary-blue-hover text-white py-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <Edit className="w-5 h-5" />
              <span>Edit My Routine</span>
            </motion.button>
          </MouseGlowEffect>

          {/* Reject Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowRejectModal(true)}
            className="w-full border-2 border-cool-gray dark:border-gray-600 text-stone-gray dark:text-gray-400 hover:border-error-red hover:text-error-red py-4 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            <X className="w-5 h-5" />
            <span>Reject Goal</span>
          </motion.button>
        </motion.div>

        {/* Reject Modal */}
        <AnimatePresence>
          {showRejectModal && (
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
                <div className="flex items-center space-x-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-error-red" />
                  <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100">Reject Goal</h3>
                </div>

                <p className="text-stone-gray dark:text-gray-300 mb-4">
                  Let {initiatorName} know why you're not able to join this goal right now:
                </p>

                <div className="space-y-2 mb-4">
                  {rejectReasons.map((reason) => (
                    <motion.label
                      key={reason}
                      whileHover={{ scale: 1.01 }}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                        rejectReason === reason
                          ? "border-error-red bg-error-red/10"
                          : "border-cool-gray dark:border-gray-600 hover:border-error-red"
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejectReason"
                        checked={rejectReason === reason}
                        onChange={() => setRejectReason(reason)}
                        className="sr-only"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                          rejectReason === reason ? "border-error-red" : "border-cool-gray dark:border-gray-600"
                        }`}
                      >
                        {rejectReason === reason && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-error-red rounded-full"
                          />
                        )}
                      </div>
                      <span className="text-sm text-charcoal dark:text-gray-100">{reason}</span>
                    </motion.label>
                  ))}
                </div>

                <textarea
                  placeholder="Other reason (optional)"
                  value={rejectReason.startsWith("Other") ? rejectReason.replace("Other: ", "") : ""}
                  onChange={(e) => setRejectReason(`Other: ${e.target.value}`)}
                  className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-error-red focus:outline-none resize-none text-sm"
                  rows={3}
                />

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 px-4 py-2 border border-cool-gray dark:border-gray-600 text-charcoal dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason}
                    className="flex-1 px-4 py-2 bg-error-red hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject Goal
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
