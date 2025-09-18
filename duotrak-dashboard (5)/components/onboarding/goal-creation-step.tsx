"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Lightbulb, Target, Sparkles, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface GoalCreationStepProps {
  data: {
    selectedCategories: string[]
    goalTitle: string
    goalDescription: string
  }
  updateData: (updates: any) => void
  onValidationChange: (isValid: boolean) => void
}

const GOAL_SUGGESTIONS = {
  fitness: [
    { title: "30-Day Fitness Challenge", description: "Complete daily workouts together and track progress" },
    { title: "Healthy Meal Prep Sundays", description: "Plan and prepare nutritious meals for the week" },
    { title: "10,000 Steps Daily", description: "Walk 10,000 steps each day and share your routes" },
  ],
  learning: [
    { title: "Learn Spanish Together", description: "Practice a new language with daily lessons and conversations" },
    { title: "Read 12 Books This Year", description: "Read one book per month and discuss insights" },
    { title: "Master a New Skill", description: "Learn coding, photography, or another skill together" },
  ],
  career: [
    { title: "Professional Development", description: "Complete certifications and attend networking events" },
    { title: "Side Project Launch", description: "Build and launch a project or business together" },
    { title: "LinkedIn Growth", description: "Grow professional networks and share industry insights" },
  ],
  relationship: [
    { title: "Weekly Date Nights", description: "Plan and enjoy quality time together every week" },
    { title: "Gratitude Practice", description: "Share daily appreciations and strengthen your bond" },
    { title: "Communication Challenge", description: "Practice active listening and deeper conversations" },
  ],
  home: [
    { title: "Home Organization Project", description: "Declutter and organize your living space room by room" },
    { title: "Garden Together", description: "Start a garden and grow your own herbs or vegetables" },
    { title: "DIY Home Improvements", description: "Complete home projects and learn new skills" },
  ],
  creative: [
    { title: "Daily Creative Practice", description: "Spend 30 minutes daily on creative pursuits" },
    { title: "Photo Challenge", description: "Take and share a photo based on daily themes" },
    { title: "Write Together", description: "Keep a shared journal or work on creative writing" },
  ],
  travel: [
    { title: "Explore Local Adventures", description: "Discover new places in your city or region" },
    { title: "Plan Dream Vacation", description: "Research and save for your next big trip" },
    { title: "Weekend Getaways", description: "Take monthly mini-trips to nearby destinations" },
  ],
  financial: [
    { title: "Emergency Fund Goal", description: "Save $10,000 for unexpected expenses" },
    { title: "Debt-Free Journey", description: "Pay off credit cards and loans together" },
    { title: "Investment Learning", description: "Learn about investing and start building wealth" },
  ],
}

export default function GoalCreationStep({ data, updateData, onValidationChange }: GoalCreationStepProps) {
  const [goalTitle, setGoalTitle] = useState(data.goalTitle || "")
  const [goalDescription, setGoalDescription] = useState(data.goalDescription || "")
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0)

  const getSuggestions = () => {
    const allSuggestions = data.selectedCategories.flatMap(
      (category) => GOAL_SUGGESTIONS[category as keyof typeof GOAL_SUGGESTIONS] || [],
    )
    return allSuggestions.length > 0 ? allSuggestions : GOAL_SUGGESTIONS.fitness
  }

  const suggestions = getSuggestions()

  const applySuggestion = (suggestion: { title: string; description: string }) => {
    setGoalTitle(suggestion.title)
    setGoalDescription(suggestion.description)
    updateData({
      goalTitle: suggestion.title,
      goalDescription: suggestion.description,
    })
    setShowSuggestions(false)
  }

  const getNewSuggestion = () => {
    const nextIndex = (currentSuggestionIndex + 1) % suggestions.length
    setCurrentSuggestionIndex(nextIndex)
  }

  useEffect(() => {
    const isValid = goalTitle.trim().length >= 3 && goalDescription.trim().length >= 10
    onValidationChange(isValid)
  }, [goalTitle, goalDescription, onValidationChange])

  useEffect(() => {
    updateData({ goalTitle, goalDescription })
  }, [goalTitle, goalDescription, updateData])

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <Target className="w-8 h-8 text-blue-500" />
          <h2 className="text-3xl font-bold text-gray-900">Create Your First Goal</h2>
        </div>
        <p className="text-lg text-gray-600">
          Let's create a meaningful goal that you and your partner can work on together.
        </p>
      </motion.div>

      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900">Suggested Goal</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={getNewSuggestion}
              className="ml-auto text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              New Idea
            </Button>
          </div>

          <div className="bg-white rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">{suggestions[currentSuggestionIndex]?.title}</h4>
            <p className="text-gray-600 text-sm">{suggestions[currentSuggestionIndex]?.description}</p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => applySuggestion(suggestions[currentSuggestionIndex])}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Use This Goal
            </Button>
            <Button variant="outline" onClick={() => setShowSuggestions(false)}>
              Create My Own
            </Button>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Goal Title *</label>
          <Input
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="e.g., 30-Day Fitness Challenge"
            className="text-lg"
          />
          <p className="text-xs text-gray-500 mt-1">Choose a clear, inspiring title for your goal</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Goal Description *</label>
          <Textarea
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
            placeholder="Describe what you want to achieve together, why it matters, and how you'll measure success..."
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Provide details about your goal and what success looks like (minimum 10 characters)
          </p>
        </div>

        {goalTitle && goalDescription && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 rounded-xl p-4 border border-green-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-800">Goal Preview</span>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{goalTitle}</h4>
              <p className="text-gray-600 text-sm">{goalDescription}</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {!showSuggestions && suggestions.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => setShowSuggestions(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Show Suggestions
          </Button>
        </motion.div>
      )}
    </div>
  )
}
