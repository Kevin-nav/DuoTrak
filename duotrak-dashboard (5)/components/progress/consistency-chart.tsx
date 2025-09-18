"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface DateRange {
  start: Date | null
  end: Date | null
  label: string
}

interface ConsistencyChartProps {
  dateRange: DateRange
  showPartnerComparison: boolean
}

export default function ConsistencyChart({ 
  dateRange, 
  showPartnerComparison 
}: ConsistencyChartProps) {
  // Generate mock chart data
  const generateChartData = () => {
    const data = []
    const days = 30
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const userPercentage = Math.max(0, Math.min(100, 70 + Math.sin(i / 5) * 20 + (Math.random() - 0.5) * 30))
      const partnerPercentage = Math.max(0, Math.min(100, 65 + Math.sin((i + 10) / 6) * 25 + (Math.random() - 0.5) * 25))
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        user: Math.round(userPercentage),
        partner: Math.round(partnerPercentage)
      })
    }
    
    return data
  }

  const chartData = generateChartData()
  const maxValue = 100

  return (
    <Card className="bg-[var(--theme-card)] border-[var(--theme-border)] h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-[var(--theme-foreground)]">
          <TrendingUp className="w-5 h-5 text-[var(--theme-primary)]" />
          <span>Consistency Trend</span>
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
          {/* Chart Area */}
          <div className="relative h-48 bg-[var(--theme-accent)] rounded-lg p-4">
            <svg className="w-full h-full" viewBox="0 0 400 160">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((value) => (
                <g key={value}>
                  <line
                    x1="0"
                    y1={160 - (value / 100) * 160}
                    x2="400"
                    y2={160 - (value / 100) * 160}
                    stroke="currentColor"
                    strokeOpacity="0.1"
                    strokeWidth="1"
                  />
                  <text
                    x="5"
                    y={160 - (value / 100) * 160 - 5}
                    fontSize="10"
                    fill="currentColor"
                    opacity="0.5"
                  >
                    {value}%
                  </text>
                </g>
              ))}

              {/* User line */}
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                d={`M ${chartData.map((point, index) => 
                  `${(index / (chartData.length - 1)) * 380 + 10},${160 - (point.user / 100) * 160}`
                ).join(' L ')}`}
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Partner line */}
              {showPartnerComparison && (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                  d={`M ${chartData.map((point, index) => 
                    `${(index / (chartData.length - 1)) * 380 + 10},${160 - (point.partner / 100) * 160}`
                  ).join(' L ')}`}
                  fill="none"
                  stroke="rgb(147, 51, 234)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {chartData.map((point, index) => (
                <g key={index}>
                  <motion.circle
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                    cx={(index / (chartData.length - 1)) * 380 + 10}
                    cy={160 - (point.user / 100) * 160}
                    r="4"
                    fill="rgb(59, 130, 246)"
                    className="cursor-pointer hover:r-6 transition-all"
                  />
                  
                  {showPartnerComparison && (
                    <motion.circle
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index + 0.5, duration: 0.3 }}
                      cx={(index / (chartData.length - 1)) * 380 + 10}
                      cy={160 - (point.partner / 100) * 160}
                      r="4"
                      fill="rgb(147, 51, 234)"
                      className="cursor-pointer hover:r-6 transition-all"
                    />
                  )}
                </g>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-[var(--theme-foreground)]">You</span>
            </div>
            {showPartnerComparison && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-[var(--theme-foreground)]">Partner</span>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--theme-border)]">
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--theme-foreground)]">
                {Math.round(chartData.reduce((sum, point) => sum + point.user, 0) / chartData.length)}%
              </div>
              <div className="text-xs text-[var(--theme-secondary)]">Your Average</div>
            </div>
            {showPartnerComparison && (
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--theme-foreground)]">
                  {Math.round(chartData.reduce((sum, point) => sum + point.partner, 0) / chartData.length)}%
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
