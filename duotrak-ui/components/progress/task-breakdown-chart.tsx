"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Users } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface DateRange {
  start: Date | null
  end: Date | null
  label: string
}

interface TaskBreakdownChartProps {
  dateRange: DateRange
  showPartnerComparison: boolean
}

export default function TaskBreakdownChart({ 
  dateRange, 
  showPartnerComparison 
}: TaskBreakdownChartProps) {
  // Mock task data
  const taskData = [
    {
      name: "Meditation",
      userCompletion: 92,
      partnerCompletion: 88,
      color: "bg-blue-500"
    },
    {
      name: "Exercise", 
      userCompletion: 85,
      partnerCompletion: 78,
      color: "bg-green-500"
    },
    {
      name: "Reading",
      userCompletion: 60,
      partnerCompletion: 95,
      color: "bg-purple-500"
    },
    {
      name: "Hydration",
      userCompletion: 78,
      partnerCompletion: 82,
      color: "bg-cyan-500"
    },
    {
      name: "Journaling",
      userCompletion: 45,
      partnerCompletion: 67,
      color: "bg-orange-500"
    }
  ]

  return (
    <Card className="bg-[var(--theme-card)] border-[var(--theme-border)] h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-[var(--theme-foreground)]">
          <Target className="w-5 h-5 text-[var(--theme-primary)]" />
          <span>Task Performance</span>
          {showPartnerComparison && (
            <Badge variant="secondary" className="ml-2">
              <Users className="w-3 h-3 mr-1" />
              vs Partner
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {taskData.map((task, index) => (
            <motion.div
              key={task.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--theme-foreground)]">
                  {task.name}
                </span>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-[var(--theme-foreground)]">
                    {task.userCompletion}%
                  </span>
                  {showPartnerComparison && (
                    <span className="text-[var(--theme-secondary)]">
                      vs {task.partnerCompletion}%
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                {/* User Progress Bar */}
                <div className="w-full bg-[var(--theme-border)] rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${task.userCompletion}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                    className={`${task.color} h-2 rounded-full`}
                  />
                </div>
                
                {/* Partner Progress Bar */}
                {showPartnerComparison && (
                  <div className="w-full bg-[var(--theme-border)] rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${task.partnerCompletion}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 + 0.2 }}
                      className="bg-purple-400 h-2 rounded-full opacity-70"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-[var(--theme-border)]">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-[var(--theme-foreground)]">
                {Math.round(taskData.reduce((sum, task) => sum + task.userCompletion, 0) / taskData.length)}%
              </div>
              <div className="text-xs text-[var(--theme-secondary)]">Your Average</div>
            </div>
            {showPartnerComparison && (
              <div>
                <div className="text-lg font-bold text-[var(--theme-foreground)]">
                  {Math.round(taskData.reduce((sum, task) => sum + task.partnerCompletion, 0) / taskData.length)}%
                </div>
                <div className="text-xs text-[var(--theme-secondary)]">Partner Average</div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
