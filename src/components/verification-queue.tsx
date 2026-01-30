"use client"

import { motion, AnimatePresence, Variants } from "framer-motion"
import { Check, X, Eye, Camera, AlertTriangle } from "lucide-react"
import { useState } from "react"
import MouseGlowEffect from "./mouse-glow-effect"

interface VerificationItem {
  id: string
  taskName: string
  partnerName: string
  partnerInitials: string
  imageUrl: string
  submittedAt: string
  goalName: string
  goalType: "personal" | "shared"
}

interface VerificationQueueProps {
  items?: VerificationItem[]
  onVerify: (itemId: string) => void
  onReject: (itemId: string, reason: string) => void
}

export default function VerificationQueue({
  items = [
    {
      id: "1",
      taskName: "Morning Workout",
      partnerName: "John",
      partnerInitials: "JD",
      imageUrl: "/placeholder.svg?height=200&width=300",
      submittedAt: "2 hours ago",
      goalName: "Fitness Journey",
      goalType: "shared",
    },
    {
      id: "2",
      taskName: "Healthy Breakfast",
      partnerName: "John",
      partnerInitials: "JD",
      imageUrl: "/placeholder.svg?height=200&width=300",
      submittedAt: "5 minutes ago",
      goalName: "Nutrition Goals",
      goalType: "shared",
    },
  ],
  onVerify,
  onReject,
}: VerificationQueueProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [expandedImage, setExpandedImage] = useState<string | null>(null)

  const rejectReasons = [
    "Image is unclear or blurry",
    "Doesn't show task completion",
    "Wrong task or activity",
    "Photo seems old/not recent",
  ]

  const handleVerify = (itemId: string) => {
    onVerify(itemId)
  }

  const handleRejectClick = (itemId: string) => {
    setSelectedItem(itemId)
    setShowRejectModal(true)
  }

  const handleRejectSubmit = () => {
    if (selectedItem && rejectReason) {
      onReject(selectedItem, rejectReason)
      setShowRejectModal(false)
      setSelectedItem(null)
      setRejectReason("")
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

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 text-center"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="mb-4"
        >
          <Eye className="w-12 h-12 text-stone-gray dark:text-gray-400 mx-auto" />
        </motion.div>
        <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100 mb-2">All caught up!</h3>
        <p className="text-stone-gray dark:text-gray-300">No tasks waiting for your verification</p>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}>
              <AlertTriangle className="w-6 h-6 text-primary-blue" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-gray-100">Verification Queue</h2>
              <p className="text-sm text-stone-gray dark:text-gray-300">
                {items.length} task{items.length !== 1 ? "s" : ""} waiting for your review
              </p>
            </div>
          </div>
          <div className="bg-primary-blue text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
            {items.length}
          </div>
        </motion.div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              className="border border-cool-gray dark:border-gray-600 rounded-lg p-4 hover:border-primary-blue transition-colors"
            >
              <div className="flex items-start space-x-4">
                {/* Partner Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary-blue rounded-full flex items-center justify-center text-white font-semibold">
                    {item.partnerInitials}
                  </div>
                </div>

                {/* Task Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-charcoal dark:text-gray-100">{item.taskName}</h4>
                      <p className="text-sm text-stone-gray dark:text-gray-400">
                        {item.partnerName} • {item.goalName} • {item.submittedAt}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                      <Camera className="w-3 h-3 text-stone-gray dark:text-gray-400" />
                      <span className="text-stone-gray dark:text-gray-400">Photo</span>
                    </div>
                  </div>

                  {/* Image Preview */}
                  <div className="mb-3">
                    <motion.img
                      whileHover={{ scale: 1.02 }}
                      src={item.imageUrl}
                      alt={`${item.taskName} verification`}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer border border-cool-gray dark:border-gray-600"
                      onClick={() => setExpandedImage(item.imageUrl)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <MouseGlowEffect glowColor="#10B981" intensity="medium">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleVerify(item.id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Verify</span>
                      </motion.button>
                    </MouseGlowEffect>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRejectClick(item.id)}
                      className="flex-1 border border-error-red text-error-red hover:bg-error-red hover:text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setExpandedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={expandedImage}
              alt="Expanded verification"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
                <X className="w-6 h-6 text-error-red" />
                <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100">Reject Task</h3>
              </div>

              <p className="text-stone-gray dark:text-gray-300 mb-4">
                Let your partner know why this task needs to be resubmitted:
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
                  onClick={() => {
                    setShowRejectModal(false)
                    setRejectReason("")
                  }}
                  className="flex-1 px-4 py-2 border border-cool-gray dark:border-gray-600 text-charcoal dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={!rejectReason}
                  className="flex-1 px-4 py-2 bg-error-red hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Feedback
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
