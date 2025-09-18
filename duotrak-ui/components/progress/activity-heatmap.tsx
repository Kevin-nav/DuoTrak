"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface DateRange {
  start: Date | null
  end: Date | null
  label: string
}

interface ActivityHeatmapProps {
  dateRange: DateRange
  showPartnerComparison: boolean
}

export default function ActivityHeatmap({ 
  dateRange, 
  showPartnerComparison 
}: ActivityHeatmapProps) {
  // Generate mock heatmap data
  const generateHeatmapData = () => {
    const data = []
    const today = new Date()
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      const completionPercentage = Math.floor(Math.random() * 101)
      const partnerCompletionPercentage = showPartnerComparison ? Math.floor(Math.random() * 101) : 0
      
      data.push({
        date: date.toISOString().split('T')[0],
        completion: completionPercentage,
        partnerCompletion: partnerCompletionPercentage,
        level: getIntensityLevel(completionPercentage)
      })
    }
    
    return data
  }

  const getIntensityLevel = (percentage: number) => {
    if (percentage === 0) return 0
    if (percentage <= 25) return 1
    if (percentage <= 50) return 2
    if (percentage <= 75) return 3
    return 4
  }

  const getIntensityColor = (level: number, isPartner = false) => {
    const userColors = [
      "bg-gray-100 dark:bg-gray-800",
      "bg-blue-100 dark:bg-blue-900/30",
      "bg-blue-300 dark:bg-blue-700/50", 
      "bg-blue-500 dark:bg-blue-600/70",
      "bg-blue-700 dark:bg-blue-500"
    ]
    
    const partnerColors = [
      "bg-gray-100 dark:bg-gray-800",
      "bg-purple-100 dark:bg-purple-900/30",
      "bg-purple-300 dark:bg-purple-700/50",
      "bg-purple-500 dark:bg-purple-600/70", 
      "bg-purple-700 dark:bg-purple-500"
    ]
    
    return isPartner ? partnerColors[level] : userColors[level]
  }

  const heatmapData = generateHeatmapData()
  const weeks = []
  
  // Group data into weeks
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7))
  }

  return (
    <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-[var(--theme-foreground)]">
          <Calendar className="w-5 h-5 text-[var(--theme-primary)]" />
          <span>Daily Activity Heatmap</span>
          {showPartnerComparison && (
            <Badge variant="secondary" className="ml-2">
              <Users className="w-3 h-3 mr-1" />
              vs Partner
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* User Heatmap */}
        <div>
          <h4 className="text-sm font-medium text-[var(--theme-foreground)] mb-2">
            Your Activity
          </h4>
          <div className="flex space-x-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col space-y-1">
                {week.map((day, dayIndex) => (
                  <motion.div
                    key={`${weekIndex}-${dayIndex}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                    className={`w-3 h-3 rounded-sm ${getIntensityColor(day.level)} cursor-pointer hover:ring-2 hover:ring-[var(--theme-primary)] transition-all`}
                    title={`${day.date}: ${day.completion}% completion`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Partner Heatmap */}
        {showPartnerComparison && (
          <div>
            <h4 className="text-sm font-medium text-[var(--theme-foreground)] mb-2">
              Partner Activity
            </h4>
            <div className="flex space-x-1">
              {weeks.map((week, weekIndex) => (
                <div key={`partner-${weekIndex}`} className="flex flex-col space-y-1">
                  {week.map((day, dayIndex) => (
                    <motion.div
                      key={`partner-${weekIndex}-${dayIndex}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 + 0.2 }}
                      className={`w-3 h-3 rounded-sm ${getIntensityColor(getIntensityLevel(day.partnerCompletion), true)} cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all`}
                      title={`${day.date}: ${day.partnerCompletion}% completion`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-[var(--theme-secondary)]">
          <span>Less</span>
          <div className="flex items-center space-x-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-3 h-3 rounded-sm ${getIntensityColor(level)}`}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  )
}
