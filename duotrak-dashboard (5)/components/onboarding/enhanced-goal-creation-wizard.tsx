"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Target,
  Calendar,
  CheckCircle,
  Sparkles,
  Heart,
  Trophy,
  BookOpen,
  Dumbbell,
  Briefcase,
  Home,
  Plus,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useInvitation } from "@/contexts/invitation-context"
import { useMascotInteractions } from "@/hooks/use-mascot-interactions"

interface GoalTemplate {
  id: string
  title: string
  description: string
  category: string
  icon: any
  frequency: string
  tasks: string[]
  color: string
}

const goalTemplates: GoalTemplate[] = [
  {
    id: "fitness",
    title: "Get Fit Together",
    description: "Build healthy habits and stay active as a team",
    category: "Health & Fitness",
    icon: Dumbbell,
    frequency: "daily",
    tasks: ["30-minute workout", "Track water intake", "Take 10,000 steps"],
    color: "bg-red-500",
  },
  {
    id: "learning",
    title: "Learn Something New",
    description: "Expand your knowledge and skills together",
    category: "Education",
    icon: BookOpen,
    frequency: "daily",
    tasks: ["Read for 30 minutes", "Practice new skill", "Share what you learned"],
    color: "bg-blue-500",
  },
  {
    id: "relationship",
    title: "Strengthen Our Bond",
    description: "Deepen your connection and communication",
    category: "Relationship",
    icon: Heart,
    frequency: "daily",
    tasks: ["Quality time together", "Express gratitude", "Try something new together"],
    color: "bg-pink-500",
  },
  {
    id: "career",
    title: "Advance Our Careers",
    description: "Support each other's professional growth",
    category: "Career",
    icon: Briefcase,
    frequency: "weekly",
    tasks: ["Network with one person", "Learn new skill", "Update portfolio/resume"],
    color: "bg-purple-500",
  },
  {
    id: "home",
    title: "Improve Our Space",
    description: "Create a better living environment together",
    category: "Home & Lifestyle",
    icon: Home,
    frequency: "weekly",
    tasks: ["Organize one area", "Complete home project", "Plan improvements"],
    color: "bg-green-500",
  },
  {
    id: "achievement",
    title: "Achieve Big Dreams",
    description: "Work towards major life goals together",
    category: "Personal Growth",
    icon: Trophy,
    frequency: "weekly",
    tasks: ["Make progress on goal", "Plan next steps", "Celebrate milestones"],
    color: "bg-yellow-500",
  },
]

const frequencies = [
  { id: "daily", label: "Daily", description: "Every day commitment" },
  { id: "weekly", label: "Weekly", description: "3-4 times per week" },
  { id: "flexible", label: "Flexible", description: "When it works for both" },
]

export default function EnhancedGoalCreationWizard({ onComplete }: { onComplete?: () => void }) {
  const { partnerInfo, goalDrafts, isFromInvitation, addGoalDraft, clearGoalDrafts } = useInvitation()
  const {
    showGoalCreationWelcome,
    showTemplateSelection,
    showCustomizationTips,
    showGoalCreationSuccess,
    showFirstGoalCelebration,
  } = useMascotInteractions()

  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null)
  const [customGoal, setCustomGoal] = useState({
    title: "",
    description: "",
    category: "",
    frequency: "daily",
    tasks: [""],
  })
  const [isCreating, setIsCreating] = useState(false)

  const steps = [
    { id: "welcome", title: "Welcome" },
    { id: "template", title: "Choose Template" },
    { id: "customize", title: "Customize" },
    { id: "review", title: "Review" },
    { id: "success", title: "Success!" },
  ]

  // Show welcome mascot interaction when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      showGoalCreationWelcome()
    }, 1000)

    return () => clearTimeout(timer)
  }, [showGoalCreationWelcome])

  // Load goal drafts if available
  useEffect(() => {
    if (goalDrafts.length > 0 && !selectedTemplate) {
      const draft = goalDrafts[0]
      setSelectedTemplate({
        id: "custom",
        title: draft.title,
        description: draft.description,
        category: draft.category,
        icon: Target,
        frequency: draft.frequency,
        tasks: [],
        color: "bg-blue-500",
      })
      setCustomGoal({
        title: draft.title,
        description: draft.description,
        category: draft.category,
        frequency: draft.frequency,
        tasks: [""],
      })
    }
  }, [goalDrafts, selectedTemplate])

  const handleTemplateSelect = (template: GoalTemplate) => {
    setSelectedTemplate(template)
    setCustomGoal({
      title: template.title,
      description: template.description,
      category: template.category,
      frequency: template.frequency,
      tasks: template.tasks,
    })
    setCurrentStep(2)

    // Show customization tips after a short delay
    setTimeout(() => {
      showCustomizationTips()
    }, 1500)
  }

  const handleCustomizeGoal = () => {
    if (!selectedTemplate) return

    const updatedTemplate = {
      ...selectedTemplate,
      title: customGoal.title,
      description: customGoal.description,
      frequency: customGoal.frequency,
      tasks: customGoal.tasks.filter((task) => task.trim() !== ""),
    }
    setSelectedTemplate(updatedTemplate)
    setCurrentStep(3)
  }

  const handleCreateGoal = async () => {
    if (!selectedTemplate) return

    setIsCreating(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Clear goal drafts since we've created the goal
    clearGoalDrafts()

    // Show success celebration
    showGoalCreationSuccess()

    // Check if this is their first goal and show special celebration
    const isFirstGoal = !localStorage.getItem("duotrak-has-created-goal")
    if (isFirstGoal) {
      localStorage.setItem("duotrak-has-created-goal", "true")
      setTimeout(() => {
        showFirstGoalCelebration()
      }, 2000)
    }

    setCurrentStep(4)
    setIsCreating(false)
  }

  const addTask = () => {
    setCustomGoal((prev) => ({
      ...prev,
      tasks: [...prev.tasks, ""],
    }))
  }

  const removeTask = (index: number) => {
    setCustomGoal((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }))
  }

  const updateTask = (index: number, value: string) => {
    setCustomGoal((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => (i === index ? value : task)),
    }))
  }

  const renderWelcomeStep = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] rounded-full flex items-center justify-center">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-[var(--theme-accent-yellow)]" />
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-[var(--theme-foreground)]">
          {isFromInvitation ? "Create Your First Goal Together!" : "Let's Create a Shared Goal!"}
        </h2>

        <p className="text-lg text-[var(--theme-muted-foreground)] max-w-md mx-auto">
          {isFromInvitation
            ? `You and ${partnerInfo?.name || "your partner"} are about to embark on an amazing journey together. Let's start with your first shared goal!`
            : "Shared goals are more fun and you're more likely to succeed when you have someone cheering you on."}
        </p>
      </div>

      {partnerInfo && (
        <div className="flex items-center justify-center space-x-4 p-4 bg-[var(--theme-primary)]/10 rounded-lg border border-[var(--theme-primary)]/20">
          <Avatar className="w-12 h-12">
            <AvatarImage src={partnerInfo.avatar || "/placeholder.svg"} />
            <AvatarFallback>{partnerInfo.name?.charAt(0) || "P"}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-medium text-[var(--theme-foreground)]">Creating with {partnerInfo.name}</p>
            <p className="text-sm text-[var(--theme-muted-foreground)]">{partnerInfo.email}</p>
          </div>
        </div>
      )}

      {goalDrafts.length > 0 && (
        <div className="p-4 bg-[var(--theme-success)]/10 rounded-lg border border-[var(--theme-success)]/20">
          <p className="text-sm text-[var(--theme-success)] font-medium">
            💡 We found {goalDrafts.length} goal draft{goalDrafts.length > 1 ? "s" : ""} from your waiting room!
          </p>
          <p className="text-sm text-[var(--theme-success)]/80 mt-1">
            We'll help you turn {goalDrafts.length > 1 ? "them" : "it"} into your first shared goal.
          </p>
        </div>
      )}

      <Button
        onClick={() => setCurrentStep(1)}
        size="lg"
        className="bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-secondary)] hover:from-[var(--theme-primary-hover)] hover:to-[var(--theme-secondary-hover)]"
      >
        Let's Get Started
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </motion.div>
  )

  const renderTemplateStep = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--theme-foreground)] mb-2">Choose Your Goal Template</h2>
        <p className="text-[var(--theme-muted-foreground)]">
          Pick a template to get started, or create your own from scratch
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goalTemplates.map((template) => {
          const Icon = template.icon
          return (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-[var(--theme-card)] border-[var(--theme-border)] hover:border-[var(--theme-primary)]/50"
              onClick={() => {
                handleTemplateSelect(template)
                // Show template selection help after a delay
                setTimeout(() => {
                  showTemplateSelection()
                }, 500)
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-[var(--theme-foreground)]">{template.title}</CardTitle>
                    <Badge
                      variant="secondary"
                      className="text-xs bg-[var(--theme-accent)] text-[var(--theme-muted-foreground)]"
                    >
                      {template.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--theme-muted-foreground)] text-sm mb-3">{template.description}</p>
                <div className="flex items-center justify-between text-xs text-[var(--theme-muted-foreground)]">
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {template.frequency}
                  </span>
                  <span>{template.tasks.length} tasks</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={() => {
            setSelectedTemplate({
              id: "custom",
              title: "",
              description: "",
              category: "Custom",
              icon: Target,
              frequency: "daily",
              tasks: [""],
              color: "bg-gray-500",
            })
            setCurrentStep(2)
          }}
          className="border-[var(--theme-border)] hover:bg-[var(--theme-accent)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Goal
        </Button>
      </div>
    </motion.div>
  )

  const renderCustomizeStep = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--theme-foreground)] mb-2">Customize Your Goal</h2>
        <p className="text-[var(--theme-muted-foreground)]">Make it perfect for you and your partner</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--theme-foreground)] mb-2">Goal Title</label>
          <Input
            value={customGoal.title}
            onChange={(e) => setCustomGoal((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="What do you want to achieve together?"
            className="text-lg bg-[var(--theme-background)] border-[var(--theme-border)] text-[var(--theme-foreground)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--theme-foreground)] mb-2">Description</label>
          <Textarea
            value={customGoal.description}
            onChange={(e) => setCustomGoal((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your goal and why it matters to both of you..."
            rows={3}
            className="bg-[var(--theme-background)] border-[var(--theme-border)] text-[var(--theme-foreground)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--theme-foreground)] mb-2">Frequency</label>
          <div className="grid grid-cols-3 gap-3">
            {frequencies.map((freq) => (
              <Card
                key={freq.id}
                className={`cursor-pointer transition-all bg-[var(--theme-card)] border-[var(--theme-border)] ${
                  customGoal.frequency === freq.id
                    ? "ring-2 ring-[var(--theme-primary)] bg-[var(--theme-primary)]/10"
                    : "hover:bg-[var(--theme-accent)]"
                }`}
                onClick={() => setCustomGoal((prev) => ({ ...prev, frequency: freq.id }))}
              >
                <CardContent className="p-4 text-center">
                  <p className="font-medium text-[var(--theme-foreground)]">{freq.label}</p>
                  <p className="text-xs text-[var(--theme-muted-foreground)] mt-1">{freq.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--theme-foreground)] mb-2">Tasks</label>
          <div className="space-y-3">
            {customGoal.tasks.map((task, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={task}
                  onChange={(e) => updateTask(index, e.target.value)}
                  placeholder={`Task ${index + 1}`}
                  className="bg-[var(--theme-background)] border-[var(--theme-border)] text-[var(--theme-foreground)]"
                />
                {customGoal.tasks.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeTask(index)}
                    className="border-[var(--theme-border)] hover:bg-[var(--theme-accent)]"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addTask}
              className="w-full bg-transparent border-[var(--theme-border)] hover:bg-[var(--theme-accent)]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(1)}
          className="border-[var(--theme-border)] hover:bg-[var(--theme-accent)]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleCustomizeGoal}
          disabled={!customGoal.title.trim() || !customGoal.description.trim()}
          className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  )

  const renderReviewStep = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[var(--theme-foreground)] mb-2">Review Your Goal</h2>
        <p className="text-[var(--theme-muted-foreground)]">Make sure everything looks perfect before creating</p>
      </div>

      {selectedTemplate && (
        <Card className="border-2 border-[var(--theme-primary)]/30 bg-[var(--theme-card)]">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${selectedTemplate.color} rounded-lg flex items-center justify-center`}>
                <selectedTemplate.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-[var(--theme-foreground)]">{selectedTemplate.title}</CardTitle>
                <Badge variant="secondary" className="bg-[var(--theme-accent)] text-[var(--theme-muted-foreground)]">
                  {selectedTemplate.category}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[var(--theme-muted-foreground)]">{selectedTemplate.description}</p>

            <div className="flex items-center space-x-4 text-sm text-[var(--theme-muted-foreground)]">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {selectedTemplate.frequency}
              </span>
              <span>{selectedTemplate.tasks.length} tasks</span>
            </div>

            <div>
              <h4 className="font-medium text-[var(--theme-foreground)] mb-2">Tasks:</h4>
              <ul className="space-y-1">
                {selectedTemplate.tasks.map((task, index) => (
                  <li key={index} className="flex items-center text-sm text-[var(--theme-muted-foreground)]">
                    <CheckCircle className="w-4 h-4 mr-2 text-[var(--theme-success)]" />
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(2)}
          className="border-[var(--theme-border)] hover:bg-[var(--theme-accent)]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button
          onClick={handleCreateGoal}
          disabled={isCreating}
          className="bg-gradient-to-r from-[var(--theme-success)] to-[var(--theme-primary)] hover:from-[var(--theme-success-hover)] hover:to-[var(--theme-primary-hover)]"
        >
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Creating Goal...
            </>
          ) : (
            <>
              Create Goal
              <CheckCircle className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )

  const renderSuccessStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      <div className="space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center"
        >
          <div className="w-24 h-24 bg-gradient-to-r from-[var(--theme-success)] to-[var(--theme-primary)] rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        <h2 className="text-3xl font-bold text-[var(--theme-foreground)]">Goal Created Successfully! 🎉</h2>

        <p className="text-lg text-[var(--theme-muted-foreground)] max-w-md mx-auto">
          Your shared goal "{selectedTemplate?.title}" is now active.
          {partnerInfo && ` Both you and ${partnerInfo.name} can start working on it together!`}
        </p>
      </div>

      <div className="p-6 bg-gradient-to-r from-[var(--theme-success)]/10 to-[var(--theme-primary)]/10 rounded-lg border border-[var(--theme-success)]/20">
        <h3 className="font-semibold text-[var(--theme-foreground)] mb-2">What happens next?</h3>
        <ul className="text-sm text-[var(--theme-muted-foreground)] space-y-1">
          <li>✅ Your goal is now visible on both dashboards</li>
          <li>✅ You'll receive daily reminders and motivation</li>
          <li>✅ Track progress together and celebrate wins</li>
          <li>✅ Build accountability and strengthen your bond</li>
        </ul>
      </div>

      <Button
        onClick={onComplete}
        size="lg"
        className="bg-gradient-to-r from-[var(--theme-success)] to-[var(--theme-primary)] hover:from-[var(--theme-success-hover)] hover:to-[var(--theme-primary-hover)]"
      >
        Go to Dashboard
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </motion.div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderWelcomeStep()
      case 1:
        return renderTemplateStep()
      case 2:
        return renderCustomizeStep()
      case 3:
        return renderReviewStep()
      case 4:
        return renderSuccessStep()
      default:
        return renderWelcomeStep()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--theme-primary)]/5 to-[var(--theme-secondary)]/5 flex flex-col">
      {/* Progress Header */}
      {currentStep < 4 && (
        <div className="bg-[var(--theme-card)] shadow-sm border-b border-[var(--theme-border)]">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-[var(--theme-foreground)]">Create Shared Goal</h1>
              <span className="text-sm text-[var(--theme-muted-foreground)]">
                Step {currentStep + 1} of {steps.length - 1}
              </span>
            </div>

            <div className="flex justify-between">
              {steps.slice(0, -1).map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                      index < currentStep
                        ? "bg-[var(--theme-success)] text-white"
                        : index === currentStep
                          ? "bg-[var(--theme-primary)] text-white"
                          : "bg-[var(--theme-accent)] text-[var(--theme-muted-foreground)]"
                    }`}
                  >
                    {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className="text-xs text-[var(--theme-muted-foreground)] mt-1 hidden sm:block">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
