"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { Camera, Upload, X, Check, AlertCircle } from "lucide-react"
import { useState } from "react"
import MouseGlowEffect from "./mouse-glow-effect"

interface TaskVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  taskName: string
  onSubmit: (imageFile?: File) => void
}

export default function TaskVerificationModal({ isOpen, onClose, taskName, onSubmit }: TaskVerificationModalProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    onSubmit(selectedImage || undefined)
    setIsSubmitting(false)
    handleClose()
  }

  const handleClose = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setIsSubmitting(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100">Upload Proof Photo</h3>
                <p className="text-sm text-stone-gray dark:text-gray-400">For: {taskName}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5 text-stone-gray dark:text-gray-400" />
              </button>
            </div>

            {/* Image Preview */}
            {imagePreview ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-4">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Task verification"
                  className="w-full h-48 object-cover rounded-lg border border-cool-gray dark:border-gray-600"
                />
                <div className="flex justify-center mt-3">
                  <button
                    onClick={() => {
                      setSelectedImage(null)
                      setImagePreview(null)
                    }}
                    className="text-sm text-primary-blue hover:text-primary-blue-hover transition-colors"
                  >
                    Choose different photo
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Upload Area */
              <div className="mb-6">
                <div className="border-2 border-dashed border-cool-gray dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary-blue transition-colors">
                  <Upload className="w-12 h-12 text-stone-gray dark:text-gray-400 mx-auto mb-4" />
                  <p className="text-stone-gray dark:text-gray-400 mb-4">Show us your completed task! 📸</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageSelect}
                        className="sr-only"
                      />
                      <MouseGlowEffect glowColor="#19A1E5" intensity="medium">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition-colors flex items-center space-x-2"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Take Photo</span>
                        </motion.div>
                      </MouseGlowEffect>
                    </label>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleImageSelect} className="sr-only" />
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 border border-cool-gray dark:border-gray-600 text-charcoal dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Choose File</span>
                      </motion.div>
                    </label>
                  </div>
                </div>

                {/* Helpful Tips */}
                <div className="mt-4 bg-accent-light-blue dark:bg-primary-blue/10 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-primary-blue mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-primary-blue font-medium mb-1">Photo Tips:</p>
                      <ul className="text-xs text-stone-gray dark:text-gray-300 space-y-1">
                        <li>• Make sure the task completion is clearly visible</li>
                        <li>• Good lighting helps your partner verify quickly</li>
                        <li>• Include yourself in the photo when possible</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 border border-cool-gray dark:border-gray-600 text-charcoal dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <MouseGlowEffect glowColor="#10B981" intensity="high">
                <motion.button
                  whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  onClick={handleSubmit}
                  disabled={!selectedImage || isSubmitting}
                  className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 relative overflow-hidden"
                >
                  {isSubmitting && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  )}
                  {!isSubmitting && <Check className="w-4 h-4" />}
                  <span>{isSubmitting ? "Submitting..." : "Submit for Verification"}</span>

                  {/* Shimmer effect */}
                  {!isSubmitting && (
                    <motion.div
                      animate={{ x: [-100, 200] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                    />
                  )}
                </motion.button>
              </MouseGlowEffect>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
