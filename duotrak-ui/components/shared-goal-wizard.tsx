"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Users, Clock, Camera, Sparkles, Send } from "lucide-react"
import { useState } from "react"
import MouseGlowEffect from "./mouse-glow-effect"

interface SharedGoalWizardProps {
  partnerName?: string
  onClose?: () => void
}

export default function SharedGoalWizard({ partnerName = "John", onClose }: SharedGoalWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    goalName: "",
    motivation: "",
    availability: [] as string[],
    timeCommitment: "",
    customTime: "",
    accountabilityType: "visual" as "visual" | "time-bound",
    timeWindow: "",
  })
  const [showSuggestion, setShowSuggestion] = useState(false)

  const steps = [
    { id: "goal", title: "Shared Goal", description: `What do you and ${partnerName} want to achieve?` },
    { id: "motivation", title: "Your Why", description: "Why is this goal important to both of you?" },
    { id: "availability", title: "Combined Schedule", description: "Tell us about your combined availability" },
    { id: "time", title: "Time Together", description: "How much time will you dedicate together?" },
    { id: "accountability", title: "Duo Accountability", description: "How will you ensure accountability?" },
    { id: "review", title: "Your Plan", description: "Review your personalized routine" },
  ]

  const availabilityOptions = [
    "Early Mornings (6-8 AM)",
    "Lunch Break (12-2 PM)",
    "Evenings (6-9 PM)",
    "Weekend Mornings",
    "Weekend Evenings",
    "We're flexible",
  ]

  const timeCommitmentOptions = [
    "30 mins daily together",
    "1 hour, 3x per week",
    "2 hours on weekends",
    "Suggest optimal based on our input",
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleAvailabilityChange = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter((item) => item !== option)
        : [...prev.availability, option],
    }))
  }

  const generateSuggestion = () => {
    setShowSuggestion(true)
  }

  const mockSuggestion = {
    routine: [
      "Start with 20-minute morning runs together",
      "Use a fitness tracking app to log your runs",
      "Take a post-workout selfie as proof of completion",
      "Gradually increase distance by 10% each week",
      "Celebrate weekly milestones together",
    ],
    schedule: "Every morning at 6:30 AM",
    duration: "8 weeks to build the habit",
    partnerRoutine: `${partnerName} will receive their own personalized plan`,
  }

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
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
          <button
            onClick={handleBack}
            className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-charcoal dark:text-gray-100" />
          </button>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Users className="w-5 h-5 text-primary-blue" />
              <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100">Create Shared Goal</h1>
            </div>
            <p className="text-sm text-stone-gray dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
          <div className="w-10" />
        </motion.div>

        {/* Progress Bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="h-2 bg-cool-gray dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-primary-blue to-accent-light-blue rounded-full"
            />
          </div>
        </motion.div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 mb-6"
          >
            <h2 className="text-xl font-bold text-charcoal dark:text-gray-100 mb-2">{steps[currentStep].title}</h2>
            <p className="text-stone-gray dark:text-gray-300 mb-6">{steps[currentStep].description}</p>

            {/* Goal Name Input */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder={`e.g., Run a 5K together, Learn cooking as a duo, Build a morning routine`}
                  value={formData.goalName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, goalName: e.target.value }))}
                  className="w-full p-4 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                />
                <div className="bg-accent-light-blue dark:bg-primary-blue/10 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-primary-blue" />
                    <span className="text-sm font-medium text-primary-blue">Duo Goal Tip</span>
                  </div>
                  <p className="text-xs text-stone-gray dark:text-gray-300">
                    Choose goals that you can work on together or support each other in achieving. {partnerName} will
                    get their own personalized routine for this goal!
                  </p>
                </div>
              </div>
            )}

            {/* Motivation Input */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <textarea
                  placeholder={`e.g., We want to get healthier together, Support each other's growth, Build stronger habits as a team`}
                  value={formData.motivation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, motivation: e.target.value }))}
                  rows={4}
                  className="w-full p-4 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none resize-none"
                />
                <div className="bg-pearl-gray dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm text-stone-gray dark:text-gray-300">
                    💡 <strong>Remember:</strong> Shared motivation creates stronger commitment. Think about what you
                    both want to achieve together!
                  </p>
                </div>
              </div>
            )}

            {/* Availability Selection */}
            {currentStep === 2 && (
              <div className="space-y-3">
                {availabilityOptions.map((option) => (
                  <motion.label
                    key={option}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.availability.includes(option)
                        ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                        : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.availability.includes(option)}
                      onChange={() => handleAvailabilityChange(option)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        formData.availability.includes(option)
                          ? "border-primary-blue bg-primary-blue"
                          : "border-cool-gray dark:border-gray-600"
                      }`}
                    >
                      {formData.availability.includes(option) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-white rounded-sm"
                        />
                      )}
                    </div>
                    <span className="text-charcoal dark:text-gray-100">{option}</span>
                  </motion.label>
                ))}

                <input
                  type="text"
                  placeholder="Other availability (specify)"
                  className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                />
              </div>
            )}

            {/* Time Commitment */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {timeCommitmentOptions.map((option) => (
                  <motion.label
                    key={option}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.timeCommitment === option
                        ? "border-primary-blue bg-accent-light-blue dark:bg-primary-blue/10"
                        : "border-cool-gray dark:border-gray-600 hover:border-primary-blue"
                    }`}
                  >
                    <input
                      type="radio"
                      name="timeCommitment"
                      checked={formData.timeCommitment === option}
                      onChange={() => setFormData((prev) => ({ ...prev, timeCommitment: option }))}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                        formData.timeCommitment === option
                          ? "border-primary-blue"
                          : "border-cool-gray dark:border-gray-600"
                      }`}
                    >
                      {formData.timeCommitment === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-primary-blue rounded-full"
                        />
                      )}
                    </div>
                    <span className="text-charcoal dark:text-gray-100">{option}</span>
                  </motion.label>
                ))}

                <input
                  type="text"
                  placeholder="Custom: e.g., 1 hour twice per week"
                  value={formData.customTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, customTime: e.target.value }))}
                  className="w-full p-3 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
                />
              </div>
            )}

            {/* Duo Accountability */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <motion.label
                  whileHover={{ scale: 1.01 }}
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
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-primary-blue rounded-full"
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Camera className="w-5 h-5 text-primary-blue" />
                      <span className="font-semibold text-charcoal dark:text-gray-100">
                        Strict Photo Verification (Recommended)
                      </span>
                    </div>
                    <p className="text-sm text-stone-gray dark:text-gray-400">
                      Both partners upload photos to confirm task completion. Perfect for workouts, meals, study
                      sessions, etc.
                    </p>
                  </div>
                </motion.label>

                <motion.label
                  whileHover={{ scale: 1.01 }}
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
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-primary-blue rounded-full"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="w-5 h-5 text-primary-blue" />
                      <span className="font-semibold text-charcoal dark:text-gray-100">
                        System-Verified Punctuality
                      </span>
                    </div>
                    <p className="text-sm text-stone-gray dark:text-gray-400 mb-3">
                      For precise timing goals like "Wake up at 7 AM" or "Be at the gym by 6 PM"
                    </p>
                    {formData.accountabilityType === "time-bound" && (
                      <input
                        type="text"
                        placeholder="e.g., 7:00 AM ± 10 mins"
                        value={formData.timeWindow}
                        onChange={(e) => setFormData((prev) => ({ ...prev, timeWindow: e.target.value }))}
                        className="w-full p-2 border border-cool-gray dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none text-sm"
                      />
                    )}
                  </div>
                </motion.label>
              </div>
            )}

            {/* AI Suggestion Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                {!showSuggestion ? (
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-16 h-16 mx-auto mb-4"
                    >
                      <Sparkles className="w-16 h-16 text-primary-blue" />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100 mb-2">
                      Creating your duo plan...
                    </h3>
                    <p className="text-stone-gray dark:text-gray-400">
                      Our AI is crafting personalized routines for both you and {partnerName}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-primary-blue/10 to-accent-light-blue/20 dark:from-primary-blue/20 dark:to-accent-light-blue/10 rounded-lg p-4 border border-primary-blue/20">
                      <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100 mb-2">
                        Great! Here's your suggested plan for "{formData.goalName}"
                      </h3>
                      <p className="text-sm text-stone-gray dark:text-gray-300">
                        Your partner, {partnerName}, will receive their own personalized plan for this goal to review
                        before it goes live.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-cool-gray dark:border-gray-600">
                      <h4 className="font-semibold text-charcoal dark:text-gray-100 mb-3">Your Routine:</h4>
                      <ul className="space-y-2">
                        {mockSuggestion.routine.map((item, index) => (
                          <li key={index} className="text-sm text-stone-gray dark:text-gray-300 flex items-start">
                            <span className="text-primary-blue mr-2 mt-1">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-pearl-gray dark:bg-gray-700 rounded-lg p-3">
                        <h5 className="font-semibold text-charcoal dark:text-gray-100 text-sm mb-1">Schedule</h5>
                        <p className="text-sm text-stone-gray dark:text-gray-300">{mockSuggestion.schedule}</p>
                      </div>
                      <div className="bg-pearl-gray dark:bg-gray-700 rounded-lg p-3">
                        <h5 className="font-semibold text-charcoal dark:text-gray-100 text-sm mb-1">Duration</h5>
                        <p className="text-sm text-stone-gray dark:text-gray-300">{mockSuggestion.duration}</p>
                      </div>
                    </div>

                    <div className="bg-accent-light-blue dark:bg-primary-blue/10 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-primary-blue" />
                        <span className="text-sm font-medium text-primary-blue">Partner's Plan</span>
                      </div>
                      <p className="text-sm text-stone-gray dark:text-gray-300">
                        {mockSuggestion.partnerRoutine} based on their preferences and availability.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex justify-between">
          {currentStep > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              className="px-6 py-3 border border-cool-gray dark:border-gray-600 text-charcoal dark:text-gray-100 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              Back
            </motion.button>
          )}

          <div className="flex-1" />

          {currentStep < steps.length - 1 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={currentStep === 4 ? generateSuggestion : handleNext}
              disabled={
                (currentStep === 0 && !formData.goalName) ||
                (currentStep === 1 && !formData.motivation) ||
                (currentStep === 2 && formData.availability.length === 0) ||
                (currentStep === 3 && !formData.timeCommitment && !formData.customTime) ||
                (currentStep === 4 && formData.accountabilityType === "time-bound" && !formData.timeWindow)
              }
              className="px-6 py-3 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>{currentStep === 4 ? "Generate Duo Plan" : "Next"}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          ) : (
            showSuggestion && (
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentStep(0)}
                  className="px-6 py-3 border border-primary-blue text-primary-blue rounded-lg hover:bg-accent-light-blue dark:hover:bg-primary-blue/10 transition-colors"
                >
                  Refine Input
                </motion.button>
                <MouseGlowEffect glowColor="#19A1E5" intensity="high">
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(25, 161, 229, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-lg transition-all flex items-center space-x-2 relative overflow-hidden"
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      animate={{ x: [-100, 200] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                    />
                    <Send className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Send to {partnerName} for Approval</span>
                  </motion.button>
                </MouseGlowEffect>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
