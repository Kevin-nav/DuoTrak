"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Clock, TrendingUp, Calendar, BarChart3, Brain, Zap, Sun, Moon, Coffee, Sunset, Activity, Target, Settings, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface TimeSlot {
  hour: number
  responseRate: number
  completionRate: number
  engagementScore: number
  notificationCount: number
  lastUpdated: string
}

interface DayPattern {
  dayOfWeek: string
  bestTimes: number[]
  worstTimes: number[]
  averageResponseRate: number
  totalNotifications: number
  patterns: {
    morning: number
    afternoon: number
    evening: number
    night: number
  }
}

interface OptimizationRule {
  id: string
  name: string
  description: string
  condition: string
  action: string
  priority: 'high' | 'medium' | 'low'
  isActive: boolean
  effectiveness: number
  timesApplied: number
}

interface TimingOptimizerProps {
  userId: string
  onOptimizationUpdate: (rules: OptimizationRule[]) => void
}

export default function TimingOptimizer({ userId, onOptimizationUpdate }: TimingOptimizerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { hour: 0, responseRate: 0.12, completionRate: 0.08, engagementScore: 0.1, notificationCount: 23, lastUpdated: '2024-01-15T00:00:00Z' },
    { hour: 1, responseRate: 0.08, completionRate: 0.05, engagementScore: 0.06, notificationCount: 12, lastUpdated: '2024-01-15T01:00:00Z' },
    { hour: 2, responseRate: 0.05, completionRate: 0.03, engagementScore: 0.04, notificationCount: 8, lastUpdated: '2024-01-15T02:00:00Z' },
    { hour: 3, responseRate: 0.04, completionRate: 0.02, engagementScore: 0.03, notificationCount: 5, lastUpdated: '2024-01-15T03:00:00Z' },
    { hour: 4, responseRate: 0.06, completionRate: 0.04, engagementScore: 0.05, notificationCount: 7, lastUpdated: '2024-01-15T04:00:00Z' },
    { hour: 5, responseRate: 0.15, completionRate: 0.12, engagementScore: 0.13, notificationCount: 18, lastUpdated: '2024-01-15T05:00:00Z' },
    { hour: 6, responseRate: 0.45, completionRate: 0.38, engagementScore: 0.42, notificationCount: 67, lastUpdated: '2024-01-15T06:00:00Z' },
    { hour: 7, responseRate: 0.78, completionRate: 0.72, engagementScore: 0.75, notificationCount: 134, lastUpdated: '2024-01-15T07:00:00Z' },
    { hour: 8, responseRate: 0.85, completionRate: 0.81, engagementScore: 0.83, notificationCount: 156, lastUpdated: '2024-01-15T08:00:00Z' },
    { hour: 9, responseRate: 0.72, completionRate: 0.68, engagementScore: 0.70, notificationCount: 98, lastUpdated: '2024-01-15T09:00:00Z' },
    { hour: 10, responseRate: 0.65, completionRate: 0.61, engagementScore: 0.63, notificationCount: 87, lastUpdated: '2024-01-15T10:00:00Z' },
    { hour: 11, responseRate: 0.58, completionRate: 0.54, engagementScore: 0.56, notificationCount: 76, lastUpdated: '2024-01-15T11:00:00Z' },
    { hour: 12, responseRate: 0.68, completionRate: 0.64, engagementScore: 0.66, notificationCount: 89, lastUpdated: '2024-01-15T12:00:00Z' },
    { hour: 13, responseRate: 0.52, completionRate: 0.48, engagementScore: 0.50, notificationCount: 65, lastUpdated: '2024-01-15T13:00:00Z' },
    { hour: 14, responseRate: 0.48, completionRate: 0.44, engagementScore: 0.46, notificationCount: 58, lastUpdated: '2024-01-15T14:00:00Z' },
    { hour: 15, responseRate: 0.55, completionRate: 0.51, engagementScore: 0.53, notificationCount: 71, lastUpdated: '2024-01-15T15:00:00Z' },
    { hour: 16, responseRate: 0.62, completionRate: 0.58, engagementScore: 0.60, notificationCount: 82, lastUpdated: '2024-01-15T16:00:00Z' },
    { hour: 17, responseRate: 0.71, completionRate: 0.67, engagementScore: 0.69, notificationCount: 95, lastUpdated: '2024-01-15T17:00:00Z' },
    { hour: 18, responseRate: 0.79, completionRate: 0.75, engagementScore: 0.77, notificationCount: 112, lastUpdated: '2024-01-15T18:00:00Z' },
    { hour: 19, responseRate: 0.82, completionRate: 0.78, engagementScore: 0.80, notificationCount: 124, lastUpdated: '2024-01-15T19:00:00Z' },
    { hour: 20, responseRate: 0.76, completionRate: 0.72, engagementScore: 0.74, notificationCount: 108, lastUpdated: '2024-01-15T20:00:00Z' },
    { hour: 21, responseRate: 0.68, completionRate: 0.64, engagementScore: 0.66, notificationCount: 89, lastUpdated: '2024-01-15T21:00:00Z' },
    { hour: 22, responseRate: 0.45, completionRate: 0.41, engagementScore: 0.43, notificationCount: 56, lastUpdated: '2024-01-15T22:00:00Z' },
    { hour: 23, responseRate: 0.28, completionRate: 0.24, engagementScore: 0.26, notificationCount: 34, lastUpdated: '2024-01-15T23:00:00Z' }
  ])

  const [dayPatterns, setDayPatterns] = useState<DayPattern[]>([
    {
      dayOfWeek: 'Monday',
      bestTimes: [7, 8, 18, 19],
      worstTimes: [2, 3, 4, 23],
      averageResponseRate: 0.72,
      totalNotifications: 145,
      patterns: { morning: 0.78, afternoon: 0.65, evening: 0.81, night: 0.32 }
    },
    {
      dayOfWeek: 'Tuesday',
      bestTimes: [7, 8, 12, 18],
      worstTimes: [1, 2, 3, 4],
      averageResponseRate: 0.75,
      totalNotifications: 152,
      patterns: { morning: 0.82, afternoon: 0.68, evening: 0.79, night: 0.28 }
    },
    {
      dayOfWeek: 'Wednesday',
      bestTimes: [8, 9, 17, 19],
      worstTimes: [0, 1, 2, 3],
      averageResponseRate: 0.73,
      totalNotifications: 148,
      patterns: { morning: 0.79, afternoon: 0.67, evening: 0.82, night: 0.25 }
    },
    {
      dayOfWeek: 'Thursday',
      bestTimes: [7, 8, 18, 20],
      worstTimes: [2, 3, 4, 5],
      averageResponseRate: 0.71,
      totalNotifications: 143,
      patterns: { morning: 0.76, afternoon: 0.64, evening: 0.78, night: 0.31 }
    },
    {
      dayOfWeek: 'Friday',
      bestTimes: [8, 9, 17, 18],
      worstTimes: [1, 2, 3, 23],
      averageResponseRate: 0.68,
      totalNotifications: 134,
      patterns: { morning: 0.74, afternoon: 0.61, evening: 0.75, night: 0.35 }
    },
    {
      dayOfWeek: 'Saturday',
      bestTimes: [9, 10, 11, 20],
      worstTimes: [2, 3, 4, 5],
      averageResponseRate: 0.58,
      totalNotifications: 98,
      patterns: { morning: 0.62, afternoon: 0.56, evening: 0.64, night: 0.42 }
    },
    {
      dayOfWeek: 'Sunday',
      bestTimes: [10, 11, 19, 20],
      worstTimes: [1, 2, 3, 4],
      averageResponseRate: 0.61,
      totalNotifications: 105,
      patterns: { morning: 0.65, afternoon: 0.58, evening: 0.67, night: 0.38 }
    }
  ])

  const [optimizationRules, setOptimizationRules] = useState<OptimizationRule[]>([
    {
      id: 'morning-peak',
      name: 'Morning Peak Optimization',
      description: 'Send motivational notifications during high-response morning hours',
      condition: 'responseRate > 0.75 AND hour BETWEEN 7-9',
      action: 'Prioritize encouragement and reminder notifications',
      priority: 'high',
      isActive: true,
      effectiveness: 0.89,
      timesApplied: 234
    },
    {
      id: 'evening-engagement',
      name: 'Evening Engagement Boost',
      description: 'Optimize evening notifications for reflection and planning',
      condition: 'hour BETWEEN 18-20 AND dayOfWeek NOT IN [Saturday, Sunday]',
      action: 'Send progress updates and celebration notifications',
      priority: 'high',
      isActive: true,
      effectiveness: 0.82,
      timesApplied: 187
    },
    {
      id: 'weekend-adjustment',
      name: 'Weekend Schedule Adjustment',
      description: 'Delay notifications on weekends to respect leisure time',
      condition: 'dayOfWeek IN [Saturday, Sunday] AND hour < 9',
      action: 'Delay notifications by 2-3 hours',
      priority: 'medium',
      isActive: true,
      effectiveness: 0.76,
      timesApplied: 156
    },
    {
      id: 'low-response-avoid',
      name: 'Low Response Avoidance',
      description: 'Avoid sending notifications during consistently low-response times',
      condition: 'responseRate < 0.3 AND hour BETWEEN 0-5',
      action: 'Reschedule to next optimal time slot',
      priority: 'high',
      isActive: true,
      effectiveness: 0.94,
      timesApplied: 298
    },
    {
      id: 'streak-protection',
      name: 'Streak Protection Timing',
      description: 'Send urgent streak protection notifications at optimal times',
      condition: 'notificationType = streak_protection AND timeRemaining < 4 hours',
      action: 'Send immediately if responseRate > 0.5, otherwise delay to next peak',
      priority: 'high',
      isActive: true,
      effectiveness: 0.91,
      timesApplied: 89
    },
    {
      id: 'partner-sync',
      name: 'Partner Activity Synchronization',
      description: 'Align notifications with partner activity patterns',
      condition: 'partnerActive = true AND responseRate > 0.6',
      action: 'Send collaborative notifications immediately',
      priority: 'medium',
      isActive: true,
      effectiveness: 0.78,
      timesApplied: 145
    }
  ])

  const [optimizerStats, setOptimizerStats] = useState({
    totalOptimizations: 1109,
    averageImprovement: 0.23,
    bestPerformingRule: 'low-response-avoid',
    currentAccuracy: 0.87,
    learningProgress: 0.92,
    lastOptimization: '2 hours ago'
  })

  const [isLearning, setIsLearning] = useState(true)
  const [autoOptimize, setAutoOptimize] = useState(true)

  const getTimeIcon = (hour: number) => {
    if (hour >= 6 && hour < 12) return Sun
    if (hour >= 12 && hour < 17) return Coffee
    if (hour >= 17 && hour < 21) return Sunset
    return Moon
  }

  const getTimeLabel = (hour: number) => {
    if (hour >= 6 && hour < 12) return 'Morning'
    if (hour >= 12 && hour < 17) return 'Afternoon'
    if (hour >= 17 && hour < 21) return 'Evening'
    return 'Night'
  }

  const getResponseRateColor = (rate: number) => {
    if (rate >= 0.8) return 'bg-green-500'
    if (rate >= 0.6) return 'bg-blue-500'
    if (rate >= 0.4) return 'bg-yellow-500'
    if (rate >= 0.2) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const calculateOptimalTime = useCallback((notificationType: string, currentHour: number) => {
    const relevantSlots = timeSlots.filter(slot => {
      if (notificationType === 'urgent') return slot.responseRate > 0.5
      if (notificationType === 'celebration') return slot.engagementScore > 0.6
      return slot.responseRate > 0.4
    })

    const futureSlots = relevantSlots.filter(slot => slot.hour > currentHour)
    if (futureSlots.length === 0) {
      // If no future slots today, get best slot for tomorrow
      return relevantSlots.sort((a, b) => b.responseRate - a.responseRate)[0]
    }

    return futureSlots.sort((a, b) => b.responseRate - a.responseRate)[0]
  }, [timeSlots])

  const runOptimization = useCallback(() => {
    // Simulate running optimization algorithms
    setIsLearning(true)
    
    setTimeout(() => {
      // Update stats to show improvement
      setOptimizerStats(prev => ({
        ...prev,
        totalOptimizations: prev.totalOptimizations + Math.floor(Math.random() * 10) + 1,
        averageImprovement: Math.min(0.95, prev.averageImprovement + 0.02),
        currentAccuracy: Math.min(0.98, prev.currentAccuracy + 0.01),
        lastOptimization: 'Just now'
      }))
      
      setIsLearning(false)
    }, 3000)
  }, [])

  const toggleRule = (ruleId: string) => {
    setOptimizationRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Timing Optimizer</h2>
          <p className="text-gray-600 dark:text-gray-400">AI-powered notification timing optimization</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={runOptimization}
            disabled={isLearning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLearning ? 'animate-spin' : ''}`} />
            {isLearning ? 'Optimizing...' : 'Run Optimization'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{optimizerStats.totalOptimizations}</div>
            <div className="text-sm text-gray-600">Total Optimizations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">+{(optimizerStats.averageImprovement * 100).toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Avg Improvement</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{(optimizerStats.currentAccuracy * 100).toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Prediction Accuracy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{(optimizerStats.learningProgress * 100).toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Learning Progress</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hourly" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hourly">Hourly Patterns</TabsTrigger>
          <TabsTrigger value="daily">Daily Patterns</TabsTrigger>
          <TabsTrigger value="rules">Optimization Rules</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Hourly Patterns */}
        <TabsContent value="hourly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                24-Hour Response Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                {timeSlots.map(slot => {
                  const Icon = getTimeIcon(slot.hour)
                  return (
                    <motion.div
                      key={slot.hour}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: slot.hour * 0.02 }}
                      className="relative group"
                    >
                      <div className={`p-3 rounded-lg border text-center cursor-pointer transition-all hover:shadow-md ${
                        slot.responseRate > 0.7 ? 'bg-green-50 border-green-200' :
                        slot.responseRate > 0.5 ? 'bg-blue-50 border-blue-200' :
                        slot.responseRate > 0.3 ? 'bg-yellow-50 border-yellow-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <Icon className="w-4 h-4 mx-auto mb-1 text-gray-600" />
                        <div className="text-xs font-medium">{slot.hour.toString().padStart(2, '0')}:00</div>
                        <div className="text-xs text-gray-500">{(slot.responseRate * 100).toFixed(0)}%</div>
                        
                        {/* Progress bar */}
                        <div className="mt-2">
                          <div className={`h-1 rounded-full ${getResponseRateColor(slot.responseRate)}`} 
                               style={{ width: `${slot.responseRate * 100}%` }} />
                        </div>
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div>Response: {(slot.responseRate * 100).toFixed(1)}%</div>
                        <div>Completion: {(slot.completionRate * 100).toFixed(1)}%</div>
                        <div>Engagement: {(slot.engagementScore * 100).toFixed(1)}%</div>
                        <div>Count: {slot.notificationCount}</div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Excellent (80%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Good (60-79%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Fair (40-59%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>Poor (20-39%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Very Poor (<20%)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Peak Times Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Peak Performance Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {timeSlots
                    .filter(slot => slot.responseRate > 0.7)
                    .sort((a, b) => b.responseRate - a.responseRate)
                    .slice(0, 5)
                    .map(slot => {
                      const Icon = getTimeIcon(slot.hour)
                      return (
                        <div key={slot.hour} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-gray-600" />
                            <span className="font-medium">{slot.hour.toString().padStart(2, '0')}:00</span>
                            <Badge variant="secondary">{getTimeLabel(slot.hour)}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-green-600">{(slot.responseRate * 100).toFixed(0)}%</div>
                            <div className="text-xs text-gray-500">{slot.notificationCount} sent</div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Avoid These Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {timeSlots
                    .filter(slot => slot.responseRate < 0.3)
                    .sort((a, b) => a.responseRate - b.responseRate)
                    .slice(0, 5)
                    .map(slot => {
                      const Icon = getTimeIcon(slot.hour)
                      return (
                        <div key={slot.hour} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-gray-600" />
                            <span className="font-medium">{slot.hour.toString().padStart(2, '0')}:00</span>
                            <Badge variant="outline">{getTimeLabel(slot.hour)}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-red-600">{(slot.responseRate * 100).toFixed(0)}%</div>
                            <div className="text-xs text-gray-500">{slot.notificationCount} sent</div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Daily Patterns */}
        <TabsContent value="daily" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dayPatterns.map(day => (
              <Card key={day.dayOfWeek}>
                <CardHeader>
                  <CardTitle className="text-lg">{day.dayOfWeek}</CardTitle>
                  <div className="text-sm text-gray-600">
                    Avg Response: {(day.averageResponseRate * 100).toFixed(0)}%
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Time Period Performance */}
                  <div className="space-y-2">
                    {Object.entries(day.patterns).map(([period, rate]) => (
                      <div key={period} className="flex items-center justify-between">
                        <span className="capitalize text-sm">{period}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={rate * 100} className="w-16 h-2" />
                          <span className="text-sm font-medium">{(rate * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Best Times */}
                  <div>
                    <div className="text-sm font-medium mb-2">Best Times</div>
                    <div className="flex flex-wrap gap-1">
                      {day.bestTimes.map(hour => (
                        <Badge key={hour} variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {hour.toString().padStart(2, '0')}:00
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Worst Times */}
                  <div>
                    <div className="text-sm font-medium mb-2">Avoid Times</div>
                    <div className="flex flex-wrap gap-1">
                      {day.worstTimes.map(hour => (
                        <Badge key={hour} variant="outline" className="text-xs bg-red-100 text-red-800">
                          {hour.toString().padStart(2, '0')}:00
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t">
                    {day.totalNotifications} notifications sent
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Optimization Rules */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Active Optimization Rules</h3>
              <p className="text-sm text-gray-600">Rules that automatically optimize notification timing</p>
            </div>
            <Badge variant="secondary">
              {optimizationRules.filter(r => r.isActive).length} Active
            </Badge>
          </div>

          <div className="space-y-3">
            {optimizationRules.map(rule => (
              <Card key={rule.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <Badge 
                            variant={rule.priority === 'high' ? 'destructive' : rule.priority === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {rule.priority} priority
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium">Condition:</span> <code className="bg-gray-100 px-1 rounded">{rule.condition}</code>
                        </div>
                        <div>
                          <span className="font-medium">Action:</span> {rule.action}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="font-medium text-green-600">{(rule.effectiveness * 100).toFixed(0)}%</div>
                      <div className="text-xs text-gray-500">effective</div>
                      <div className="text-xs text-gray-500 mt-1">{rule.timesApplied} times applied</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-optimize" className="font-medium">Auto-Optimization</Label>
                  <p className="text-sm text-gray-600">Automatically optimize timing based on user behavior</p>
                </div>
                <Switch
                  id="auto-optimize"
                  checked={autoOptimize}
                  onCheckedChange={setAutoOptimize}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="learning-mode" className="font-medium">Learning Mode</Label>
                  <p className="text-sm text-gray-600">Continuously learn from user interactions</p>
                </div>
                <Switch
                  id="learning-mode"
                  checked={isLearning}
                  onCheckedChange={setIsLearning}
                />
              </div>

              <div>
                <Label className="font-medium">Learning Sensitivity</Label>
                <p className="text-sm text-gray-600 mb-3">How quickly the system adapts to changes</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm">Conservative</span>
                  <Progress value={75} className="flex-1" />
                  <span className="text-sm">Aggressive</span>
                </div>
              </div>

              <div>
                <Label className="font-medium">Minimum Confidence Threshold</Label>
                <p className="text-sm text-gray-600 mb-3">Only apply optimizations above this confidence level</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm">60%</span>
                  <Progress value={80} className="flex-1" />
                  <span className="text-sm">95%</span>
                </div>
                <div className="text-center mt-2">
                  <Badge variant="secondary">Current: 80%</Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="font-medium">Data Collection</Label>
                    <p className="text-sm text-gray-600">Control what data is used for optimization</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Response Times</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completion Rates</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Engagement Scores</span>
                    <Badge variant="secondary">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Partner Activity</span>
                    <Badge variant="outline">Limited</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Optimization Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">87%</div>
                  <div className="text-sm text-gray-600">Prediction Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+23%</div>
                  <div className="text-sm text-gray-600">Response Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">1,109</div>
                  <div className="text-sm text-gray-600">Optimizations Applied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">92%</div>
                  <div className="text-sm text-gray-600">Learning Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
