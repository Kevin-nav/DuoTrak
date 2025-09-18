"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Users, Calendar, Trophy } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface DateRange {
  start: Date | null
  end: Date | null
  label: string
}

interface GoalProgressOverviewProps {
  dateRange: DateRange
  showPartnerComparison: boolean
}

export default function GoalProgressOverview({ 
  dateRange, 
  showPartnerComparison 
}: GoalProgressOverviewProps) {
  // Mock goals data
  const goalsData = [
    {
      id: "goal-1",
      title: "Morning Wellness Routine",
      description: "Complete meditation and exercise every morning",
      category: "Health & Wellness",
      progress: 78,
      partnerProgress: 82,
      status: "active",
      daysRemaining: 23,
      streak: 12,
      milestones: [
        { name: "First Week", completed: true },
        { name: "30 Days", completed: true },
        { name: "60 Days", completed: false },
        { name: "90 Days", completed: false }
      ]
    },
    {
      id: "goal-2", 
      title: "Reading Challenge",
      description: "Read for 30 minutes daily",
      category: "Personal Growth",
      progress: 45,
      partnerProgress: 67,
      status: "active",
      daysRemaining: 45,
      streak: 5,
      milestones: [
        { name: "First Book", completed: true },
        { name: "Second Book", completed: false },
        { name: "Third Book", completed: false }
      ]
    },
    {
      id: "goal-3",
      title: "Hydration Habit", 
      description: "Drink 8 glasses of water daily",
      category: "Health & Wellness",
      progress: 100,
      partnerProgress: 95,
      status: "completed",
      daysRemaining: 0,
      streak: 89,
      milestones: [
        { name: "30 Days", completed: true },
        { name: "60 Days", completed: true },
        { name: "90 Days", completed: true }
      ]
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      case "paused": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
    }
  }

  return (
    <Card className="bg-[var(--theme-card)] border-[var(--theme-border)] h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[var(--theme-foreground)]">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-[var(--theme-primary)]" />
            <span>Goal Progress</span>
            {showPartnerComparison && (
              <Badge variant="secondary" className="ml-2">
                <Users className="w-3 h-3 mr-1" />
                vs Partner
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm">
            View All Goals
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {goalsData.map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 bg-[var(--theme-accent)] rounded-lg space-y-3"
          >
            {/* Goal Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-semibold text-[var(--theme-foreground)]">
                  {goal.title}
                </h4>
                <p className="text-xs text-[var(--theme-secondary)]">
                  {goal.description}
                </p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {goal.category}
                  </Badge>
                  <Badge className={`text-xs ${getStatusColor(goal.status)}`}>
                    {goal.status}
                  </Badge>
                </div>
              </div>
              
              <div className="text-right text-xs text-[var(--theme-secondary)]">
                {goal.status === "active" && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{goal.daysRemaining} days left</span>
                  </div>
                )}
                {goal.status === "completed" && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Trophy className="w-3 h-3" />
                    <span>Completed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--theme-secondary)]">Your Progress</span>
                <span className="font-medium text-[var(--theme-foreground)]">
                  {goal.progress}%
                </span>
              </div>
              <Progress value={goal.progress} className="h-2" />
              
              {showPartnerComparison && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--theme-secondary)]">Partner Progress</span>
                    <span className="font-medium text-[var(--theme-foreground)]">
                      {goal.partnerProgress}%
                    </span>
                  </div>
                  <Progress value={goal.partnerProgress} className="h-2" />
                </>
              )}
            </div>

            {/* Milestones */}
            <div className="flex items-center space-x-2">
              {goal.milestones.map((milestone, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    milestone.completed 
                      ? "bg-green-500" 
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                  title={milestone.name}
                />
              ))}
              <span className="text-xs text-[var(--theme-secondary)] ml-2">
                {goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones
              </span>
            </div>
          </motion.div>
        ))}

        {/* Summary Stats */}
        <div className="pt-4 border-t border-[var(--theme-border)]">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-[var(--theme-foreground)]">
                {goalsData.filter(g => g.status === "active").length}
              </div>
              <div className="text-xs text-[var(--theme-secondary)]">Active Goals</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {goalsData.filter(g => g.status === "completed").length}
              </div>
              <div className="text-xs text-[var(--theme-secondary)]">Completed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--theme-foreground)]">
                {Math.round(goalsData.reduce((sum, goal) => sum + goal.progress, 0) / goalsData.length)}%
              </div>
              <div className="text-xs text-[var(--theme-secondary)]">Avg Progress</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
