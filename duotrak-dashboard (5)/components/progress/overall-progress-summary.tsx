"use client"

import { motion } from "framer-motion"
import { Flame, Target, Trophy, Calendar, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DateRange {
  start: Date | null
  end: Date | null
  label: string
}

interface OverallProgressSummaryProps {
  dateRange: DateRange
  showPartnerComparison: boolean
}

export default function OverallProgressSummary({ 
  dateRange, 
  showPartnerComparison 
}: OverallProgressSummaryProps) {
  // Mock data - in real app this would be filtered by dateRange
  const mockData = {
    currentStreak: 45,
    longestStreak: 120,
    totalTasksCompleted: 789,
    goalsConquered: 3,
    completionRate: 87,
    partnerData: showPartnerComparison ? {
      currentStreak: 38,
      longestStreak: 95,
      totalTasksCompleted: 654,
      goalsConquered: 2,
      completionRate: 82
    } : null
  }

  const stats = [
    {
      icon: Flame,
      label: "Current Streak",
      value: mockData.currentStreak,
      partnerValue: mockData.partnerData?.currentStreak,
      suffix: "days",
      color: "text-orange-500"
    },
    {
      icon: Trophy,
      label: "Longest Streak", 
      value: mockData.longestStreak,
      partnerValue: mockData.partnerData?.longestStreak,
      suffix: "days",
      color: "text-yellow-500"
    },
    {
      icon: Target,
      label: "Tasks Completed",
      value: mockData.totalTasksCompleted,
      partnerValue: mockData.partnerData?.totalTasksCompleted,
      suffix: "",
      color: "text-green-500"
    },
    {
      icon: Calendar,
      label: "Goals Conquered",
      value: mockData.goalsConquered,
      partnerValue: mockData.partnerData?.goalsConquered,
      suffix: "",
      color: "text-blue-500"
    }
  ]

  return (
    <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[var(--theme-foreground)]">
            Progress Overview
          </h3>
          {showPartnerComparison && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>vs Partner</span>
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-4 bg-[var(--theme-accent)] rounded-lg"
            >
              <div className="flex items-center justify-center mb-2">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              
              <div className="space-y-1">
                <div className="text-2xl font-bold text-[var(--theme-foreground)]">
                  {stat.value.toLocaleString()}{stat.suffix}
                </div>
                
                {showPartnerComparison && stat.partnerValue !== undefined && (
                  <div className="flex items-center justify-center space-x-2 text-sm">
                    <span className="text-[var(--theme-secondary)]">
                      vs {stat.partnerValue.toLocaleString()}{stat.suffix}
                    </span>
                    {stat.value > stat.partnerValue ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : stat.value < stat.partnerValue ? (
                      <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
                    ) : null}
                  </div>
                )}
                
                <div className="text-xs text-[var(--theme-secondary)]">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Completion Rate */}
        <div className="mt-6 p-4 bg-[var(--theme-accent)] rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--theme-foreground)]">
              Overall Completion Rate
            </span>
            <span className="text-lg font-bold text-[var(--theme-primary)]">
              {mockData.completionRate}%
            </span>
          </div>
          
          <div className="w-full bg-[var(--theme-border)] rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${mockData.completionRate}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-[var(--theme-primary)] h-2 rounded-full"
            />
          </div>
          
          {showPartnerComparison && mockData.partnerData && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--theme-secondary)]">
                  Partner Completion Rate
                </span>
                <span className="text-lg font-bold text-purple-500">
                  {mockData.partnerData.completionRate}%
                </span>
              </div>
              
              <div className="w-full bg-[var(--theme-border)] rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${mockData.partnerData.completionRate}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                  className="bg-purple-500 h-2 rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
