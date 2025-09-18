"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Target, Users, Calendar, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useMascotInteractions } from "@/hooks/use-mascot-interactions"

export default function DashboardContent() {
  const { showWelcomeMessage, showStreakMilestone, showPartnerSync, showTaskCompletion, showMotivationalBoost } =
    useMascotInteractions()

  // Show welcome message when dashboard loads
  useEffect(() => {
    const timer = setTimeout(() => {
      showWelcomeMessage("Alex")
    }, 2000)

    return () => clearTimeout(timer)
  }, [showWelcomeMessage])

  // Show motivational boost based on time of day
  useEffect(() => {
    const hour = new Date().getHours()
    let timeOfDay: "morning" | "afternoon" | "evening" = "morning"

    if (hour >= 12 && hour < 17) timeOfDay = "afternoon"
    else if (hour >= 17) timeOfDay = "evening"

    const timer = setTimeout(() => {
      showMotivationalBoost(timeOfDay)
    }, 8000)

    return () => clearTimeout(timer)
  }, [showMotivationalBoost])

  // Mock data
  const stats = {
    currentStreak: 7,
    totalGoals: 12,
    completedToday: 3,
    partnerStreak: 5,
  }

  const goals = [
    {
      id: 1,
      title: "Morning Workout",
      progress: 85,
      streak: 7,
      isShared: true,
      partner: "Sarah",
      dueToday: true,
    },
    {
      id: 2,
      title: "Read 30 Minutes",
      progress: 60,
      streak: 4,
      isShared: false,
      dueToday: true,
    },
    {
      id: 3,
      title: "Meditation",
      progress: 100,
      streak: 12,
      isShared: true,
      partner: "Sarah",
      dueToday: false,
    },
  ]

  const handleGoalComplete = (goalId: number) => {
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    // Show task completion mascot
    showTaskCompletion(goal.title, goal.isShared)

    // Trigger streak milestone if it's a special day
    if (stats.currentStreak === 7) {
      setTimeout(() => {
        showStreakMilestone(7, true)
      }, 3000)
    }
  }

  const handlePartnerActivity = () => {
    showPartnerSync("Sarah")
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Welcome back!</h1>
        <p className="text-[var(--theme-secondary)]">Let's make today count together</p>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--theme-foreground)]">Current Streak</CardTitle>
            <Target className="h-4 w-4 text-[var(--theme-secondary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--theme-primary)]">{stats.currentStreak} days</div>
            <p className="text-xs text-[var(--theme-secondary)]">Keep it going! 🔥</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--theme-foreground)]">Total Goals</CardTitle>
            <Calendar className="h-4 w-4 text-[var(--theme-secondary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--theme-foreground)]">{stats.totalGoals}</div>
            <p className="text-xs text-[var(--theme-secondary)]">Active goals</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--theme-foreground)]">Completed Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-[var(--theme-secondary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completedToday}</div>
            <p className="text-xs text-[var(--theme-secondary)]">Tasks done</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[var(--theme-foreground)]">Partner Streak</CardTitle>
            <Users className="h-4 w-4 text-[var(--theme-secondary)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.partnerStreak} days</div>
            <p className="text-xs text-[var(--theme-secondary)]">Together strong</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Goals */}
      <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-[var(--theme-foreground)]">
            <Target className="h-5 w-5" />
            <span>Today's Goals</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: goal.id * 0.1 }}
              className="flex items-center justify-between p-4 bg-[var(--theme-accent)] rounded-lg"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-[var(--theme-foreground)]">{goal.title}</h3>
                  {goal.isShared && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      with {goal.partner}
                    </Badge>
                  )}
                  {goal.streak > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {goal.streak} day streak 🔥
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--theme-secondary)]">Progress</span>
                    <span className="text-[var(--theme-foreground)]">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              </div>

              <div className="ml-4 space-x-2">
                {goal.dueToday && goal.progress < 100 && (
                  <Button
                    size="sm"
                    onClick={() => handleGoalComplete(goal.id)}
                    className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/90 text-[var(--theme-primary-foreground)]"
                  >
                    Complete
                  </Button>
                )}
                {goal.progress === 100 && <Badge className="bg-green-100 text-green-800">✓ Done</Badge>}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Partner Activity */}
      <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-[var(--theme-foreground)]">
            <Users className="h-5 w-5" />
            <span>Partner Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  S
                </div>
                <div>
                  <p className="font-medium text-[var(--theme-foreground)]">Sarah completed "Morning Workout"</p>
                  <p className="text-sm text-[var(--theme-secondary)]">2 minutes ago</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handlePartnerActivity}>
                Celebrate 🎉
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  S
                </div>
                <div>
                  <p className="font-medium text-[var(--theme-foreground)]">Sarah is on a 5-day streak!</p>
                  <p className="text-sm text-[var(--theme-secondary)]">Keep up the momentum together</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
