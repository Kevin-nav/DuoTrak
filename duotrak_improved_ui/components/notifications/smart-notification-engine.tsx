"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Brain, Clock, Target, Users, Zap, TrendingUp, MessageSquare, Calendar, BarChart3, Settings, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UserPattern {
  userId: string
  mostActiveHours: number[]
  preferredNotificationTypes: string[]
  responseRates: { [key: string]: number }
  completionTimes: { [key: string]: number }
  streakPatterns: {
    bestDays: string[]
    strugglingDays: string[]
    recoveryTime: number
  }
  partnerInteractionStyle: 'supportive' | 'competitive' | 'casual'
  motivationTriggers: string[]
  lastUpdated: string
}

interface NotificationTemplate {
  id: string
  type: 'reminder' | 'encouragement' | 'celebration' | 'nudge' | 'milestone' | 'recovery'
  category: 'task' | 'goal' | 'partner' | 'streak' | 'achievement'
  templates: {
    title: string
    message: string
    variables: string[]
    tone: 'friendly' | 'motivational' | 'celebratory' | 'urgent' | 'supportive'
    timing: {
      optimal: number[]
      avoid: number[]
      contextual: string[]
    }
  }[]
  effectiveness: number
  usageCount: number
}

interface SmartNotification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  scheduledTime: Date
  actualSentTime?: Date
  opened: boolean
  actionTaken: boolean
  effectiveness: number
  context: {
    userState: string
    partnerActivity: string
    goalProgress: number
    streakStatus: number
    timeOfDay: string
    dayOfWeek: string
  }
}

interface SmartNotificationEngineProps {
  userId: string
  partnerId?: string
  onSendNotification: (notification: SmartNotification) => void
  onUpdateUserPattern: (pattern: UserPattern) => void
}

export default function SmartNotificationEngine({
  userId,
  partnerId,
  onSendNotification,
  onUpdateUserPattern
}: SmartNotificationEngineProps) {
  const [userPattern, setUserPattern] = useState<UserPattern>({
    userId,
    mostActiveHours: [7, 8, 12, 18, 19, 21],
    preferredNotificationTypes: ['encouragement', 'reminder', 'celebration'],
    responseRates: {
      'morning': 0.85,
      'afternoon': 0.65,
      'evening': 0.78,
      'night': 0.45
    },
    completionTimes: {
      'workout': 45,
      'meditation': 15,
      'reading': 30,
      'journaling': 20
    },
    streakPatterns: {
      bestDays: ['Monday', 'Tuesday', 'Wednesday'],
      strugglingDays: ['Friday', 'Saturday'],
      recoveryTime: 2
    },
    partnerInteractionStyle: 'supportive',
    motivationTriggers: ['progress_visualization', 'partner_comparison', 'streak_protection'],
    lastUpdated: new Date().toISOString()
  })

  const [notificationTemplates] = useState<NotificationTemplate[]>([
    {
      id: 'morning-motivation',
      type: 'encouragement',
      category: 'task',
      templates: [
        {
          title: "Good morning, {userName}! 🌅",
          message: "Ready to crush your {taskName} goal? {partnerName} is cheering you on!",
          variables: ['userName', 'taskName', 'partnerName'],
          tone: 'motivational',
          timing: {
            optimal: [6, 7, 8, 9],
            avoid: [22, 23, 0, 1, 2, 3, 4, 5],
            contextual: ['weekday_morning', 'high_energy_time']
          }
        },
        {
          title: "Rise and shine! ☀️",
          message: "Your {streakCount}-day streak is waiting for today's {taskName}. Let's keep it going!",
          variables: ['streakCount', 'taskName'],
          tone: 'friendly',
          timing: {
            optimal: [6, 7, 8],
            avoid: [20, 21, 22, 23],
            contextual: ['active_streak', 'morning_person']
          }
        }
      ],
      effectiveness: 0.82,
      usageCount: 156
    },
    {
      id: 'streak-protection',
      type: 'nudge',
      category: 'streak',
      templates: [
        {
          title: "Don't break the chain! 🔥",
          message: "Your {streakCount}-day streak is at risk. Just {timeRemaining} left to complete {taskName}!",
          variables: ['streakCount', 'timeRemaining', 'taskName'],
          tone: 'urgent',
          timing: {
            optimal: [16, 17, 18, 19, 20],
            avoid: [0, 1, 2, 3, 4, 5, 6],
            contextual: ['streak_at_risk', 'evening_reminder']
          }
        }
      ],
      effectiveness: 0.91,
      usageCount: 89
    },
    {
      id: 'partner-celebration',
      type: 'celebration',
      category: 'achievement',
      templates: [
        {
          title: "Incredible teamwork! 🎉",
          message: "You and {partnerName} both completed {goalName} today. Your duo power is unstoppable!",
          variables: ['partnerName', 'goalName'],
          tone: 'celebratory',
          timing: {
            optimal: [18, 19, 20, 21],
            avoid: [6, 7, 8, 9],
            contextual: ['both_completed', 'celebration_time']
          }
        }
      ],
      effectiveness: 0.95,
      usageCount: 67
    },
    {
      id: 'recovery-support',
      type: 'recovery',
      category: 'streak',
      templates: [
        {
          title: "Every champion has setbacks 💪",
          message: "Yesterday didn't go as planned, but today is a fresh start. {partnerName} believes in you!",
          variables: ['partnerName'],
          tone: 'supportive',
          timing: {
            optimal: [7, 8, 9, 10],
            avoid: [22, 23, 0, 1],
            contextual: ['after_missed_day', 'recovery_mode']
          }
        }
      ],
      effectiveness: 0.73,
      usageCount: 34
    }
  ])

  const [engineStats, setEngineStats] = useState({
    totalNotificationsSent: 1247,
    averageResponseRate: 0.78,
    bestPerformingTime: '7:30 AM',
    mostEffectiveTemplate: 'streak-protection',
    learningAccuracy: 0.84,
    userSatisfactionScore: 4.6
  })

  const [recentOptimizations, setRecentOptimizations] = useState([
    {
      type: 'timing',
      description: 'Shifted morning reminders 30 minutes earlier based on completion patterns',
      impact: '+12% response rate',
      timestamp: '2 hours ago'
    },
    {
      type: 'messaging',
      description: 'Increased partner mentions in encouragement messages',
      impact: '+8% engagement',
      timestamp: '1 day ago'
    },
    {
      type: 'frequency',
      description: 'Reduced weekend notifications based on low activity patterns',
      impact: '+15% satisfaction',
      timestamp: '3 days ago'
    }
  ])

  // Smart timing optimization
  const calculateOptimalTime = useCallback((notificationType: string, context: any) => {
    const now = new Date()
    const currentHour = now.getHours()
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
    
    // Get user's most active hours
    const activeHours = userPattern.mostActiveHours
    
    // Get response rates for different times
    const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : currentHour < 21 ? 'evening' : 'night'
    const responseRate = userPattern.responseRates[timeOfDay] || 0.5
    
    // Calculate optimal time based on multiple factors
    let optimalHour = activeHours[0] // Default to first active hour
    
    if (notificationType === 'reminder' && context.taskType) {
      // For task reminders, consider typical completion times
      const completionTime = userPattern.completionTimes[context.taskType] || 30
      optimalHour = Math.max(6, Math.min(20, currentHour + Math.ceil(completionTime / 60)))
    } else if (notificationType === 'encouragement') {
      // Encouragement works best during active hours
      optimalHour = activeHours.find(hour => hour > currentHour) || activeHours[0]
    } else if (notificationType === 'celebration') {
      // Celebrations work best in evening
      optimalHour = Math.max(18, Math.min(21, currentHour))
    }
    
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), optimalHour, 0, 0)
  }, [userPattern])

  // Template selection with personalization
  const selectOptimalTemplate = useCallback((type: string, context: any) => {
    const relevantTemplates = notificationTemplates.filter(t => t.type === type)
    if (relevantTemplates.length === 0) return null
    
    // Score templates based on effectiveness and context match
    const scoredTemplates = relevantTemplates.flatMap(template => 
      template.templates.map(t => ({
        ...t,
        templateId: template.id,
        score: template.effectiveness * (
          // Bonus for matching user's preferred tone
          (userPattern.partnerInteractionStyle === 'supportive' && t.tone === 'supportive' ? 1.2 : 1) *
          // Bonus for optimal timing
          (t.timing.optimal.includes(new Date().getHours()) ? 1.1 : 1) *
          // Penalty for overuse
          (template.usageCount > 100 ? 0.9 : 1)
        )
      }))
    )
    
    // Select highest scoring template
    return scoredTemplates.sort((a, b) => b.score - a.score)[0]
  }, [notificationTemplates, userPattern])

  // Personalize message with variables
  const personalizeMessage = useCallback((template: any, context: any) => {
    let title = template.title
    let message = template.message
    
    const variables = {
      userName: 'Alex', // Would come from user data
      partnerName: 'Jordan', // Would come from partner data
      taskName: context.taskName || 'daily goal',
      goalName: context.goalName || 'shared goal',
      streakCount: context.streakCount || 5,
      timeRemaining: context.timeRemaining || '3 hours'
    }
    
    // Replace variables in title and message
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g')
      title = title.replace(regex, value.toString())
      message = message.replace(regex, value.toString())
    })
    
    return { title, message }
  }, [])

  // Learn from user interactions
  const updateUserPattern = useCallback((interaction: any) => {
    const updatedPattern = { ...userPattern }
    
    // Update response rates
    const timeOfDay = new Date(interaction.timestamp).getHours() < 12 ? 'morning' : 
                     new Date(interaction.timestamp).getHours() < 17 ? 'afternoon' : 
                     new Date(interaction.timestamp).getHours() < 21 ? 'evening' : 'night'
    
    const currentRate = updatedPattern.responseRates[timeOfDay] || 0.5
    const newRate = interaction.responded ? 
      Math.min(1, currentRate + 0.05) : 
      Math.max(0, currentRate - 0.02)
    
    updatedPattern.responseRates[timeOfDay] = newRate
    
    // Update preferred notification types
    if (interaction.responded && interaction.actionTaken) {
      const typeIndex = updatedPattern.preferredNotificationTypes.indexOf(interaction.type)
      if (typeIndex === -1) {
        updatedPattern.preferredNotificationTypes.push(interaction.type)
      }
    }
    
    updatedPattern.lastUpdated = new Date().toISOString()
    setUserPattern(updatedPattern)
    onUpdateUserPattern(updatedPattern)
  }, [userPattern, onUpdateUserPattern])

  // Generate smart notification
  const generateSmartNotification = useCallback((type: string, context: any) => {
    const template = selectOptimalTemplate(type, context)
    if (!template) return null
    
    const personalizedContent = personalizeMessage(template, context)
    const optimalTime = calculateOptimalTime(type, context)
    
    const notification: SmartNotification = {
      id: `smart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title: personalizedContent.title,
      message: personalizedContent.message,
      scheduledTime: optimalTime,
      opened: false,
      actionTaken: false,
      effectiveness: 0,
      context: {
        userState: context.userState || 'active',
        partnerActivity: context.partnerActivity || 'unknown',
        goalProgress: context.goalProgress || 0,
        streakStatus: context.streakStatus || 0,
        timeOfDay: optimalTime.getHours() < 12 ? 'morning' : 
                  optimalTime.getHours() < 17 ? 'afternoon' : 
                  optimalTime.getHours() < 21 ? 'evening' : 'night',
        dayOfWeek: optimalTime.toLocaleDateString('en-US', { weekday: 'long' })
      }
    }
    
    return notification
  }, [userId, selectOptimalTemplate, personalizeMessage, calculateOptimalTime])

  return (
    <div className="space-y-6">
      {/* Engine Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Smart Notification Engine
            <Badge variant="secondary" className="ml-2">AI-Powered</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{engineStats.totalNotificationsSent}</div>
              <div className="text-sm text-gray-600">Notifications Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{(engineStats.averageResponseRate * 100).toFixed(0)}%</div>
              <div className="text-sm text-gray-600">Response Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{(engineStats.learningAccuracy * 100).toFixed(0)}%</div>
              <div className="text-sm text-gray-600">Learning Accuracy</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>User Satisfaction</span>
              <span>{engineStats.userSatisfactionScore}/5.0</span>
            </div>
            <Progress value={(engineStats.userSatisfactionScore / 5) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patterns">User Patterns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* User Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Learned User Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Active Hours */}
              <div>
                <h4 className="font-medium mb-2">Most Active Hours</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div
                      key={i}
                      className={`px-2 py-1 rounded text-xs ${
                        userPattern.mostActiveHours.includes(i)
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {i.toString().padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Rates */}
              <div>
                <h4 className="font-medium mb-2">Response Rates by Time</h4>
                <div className="space-y-2">
                  {Object.entries(userPattern.responseRates).map(([time, rate]) => (
                    <div key={time} className="flex items-center justify-between">
                      <span className="capitalize">{time}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={rate * 100} className="w-20 h-2" />
                        <span className="text-sm font-medium">{(rate * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Streak Patterns */}
              <div>
                <h4 className="font-medium mb-2">Streak Patterns</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Best Days</div>
                    <div className="flex flex-wrap gap-1">
                      {userPattern.streakPatterns.bestDays.map(day => (
                        <Badge key={day} variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Struggling Days</div>
                    <div className="flex flex-wrap gap-1">
                      {userPattern.streakPatterns.strugglingDays.map(day => (
                        <Badge key={day} variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Motivation Triggers */}
              <div>
                <h4 className="font-medium mb-2">Motivation Triggers</h4>
                <div className="flex flex-wrap gap-2">
                  {userPattern.motivationTriggers.map(trigger => (
                    <Badge key={trigger} variant="outline" className="text-xs">
                      {trigger.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          {notificationTemplates.map(template => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg capitalize">{template.type} Templates</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{template.category}</Badge>
                    <Badge variant="outline">{(template.effectiveness * 100).toFixed(0)}% effective</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {template.templates.map((t, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-gray-50">
                      <div className="font-medium text-sm mb-1">{t.title}</div>
                      <div className="text-sm text-gray-600 mb-2">{t.message}</div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Tone: {t.tone}</span>
                        <span>Optimal: {t.timing.optimal.join(', ')}h</span>
                        <span>Variables: {t.variables.length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Recent Optimizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentOptimizations.map((opt, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div className={`p-2 rounded-full ${
                      opt.type === 'timing' ? 'bg-blue-100 text-blue-600' :
                      opt.type === 'messaging' ? 'bg-green-100 text-green-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {opt.type === 'timing' ? <Clock className="w-4 h-4" /> :
                       opt.type === 'messaging' ? <MessageSquare className="w-4 h-4" /> :
                       <TrendingUp className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{opt.description}</div>
                      <div className="text-xs text-gray-500 mt-1">{opt.timestamp}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      {opt.impact}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Optimization Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto-Optimization</div>
                  <div className="text-sm text-gray-600">Let AI continuously improve notification timing and content</div>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Learning Rate</div>
                  <div className="text-sm text-gray-600">How quickly the system adapts to your behavior</div>
                </div>
                <Badge variant="secondary">Balanced</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Privacy Mode</div>
                  <div className="text-sm text-gray-600">Limit data collection for pattern learning</div>
                </div>
                <Badge variant="outline">Standard</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Open Rate</span>
                  <span className="font-medium">84%</span>
                </div>
                <div className="flex justify-between">
                  <span>Action Rate</span>
                  <span className="font-medium">67%</span>
                </div>
                <div className="flex justify-between">
                  <span>Optimal Timing Accuracy</span>
                  <span className="font-medium">91%</span>
                </div>
                <div className="flex justify-between">
                  <span>Template Effectiveness</span>
                  <span className="font-medium">78%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Notifications Sent</span>
                  <span className="font-medium text-green-600">↑ 12%</span>
                </div>
                <div className="flex justify-between">
                  <span>User Engagement</span>
                  <span className="font-medium text-green-600">↑ 8%</span>
                </div>
                <div className="flex justify-between">
                  <span>Goal Completion</span>
                  <span className="font-medium text-green-600">↑ 15%</span>
                </div>
                <div className="flex justify-between">
                  <span>Partner Interaction</span>
                  <span className="font-medium text-blue-600">↑ 5%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Best Performing Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notificationTemplates
                  .sort((a, b) => b.effectiveness - a.effectiveness)
                  .slice(0, 3)
                  .map((template, index) => (
                    <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium capitalize">{template.type}</div>
                        <div className="text-sm text-gray-600">{template.category} notifications</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{(template.effectiveness * 100).toFixed(0)}%</div>
                        <div className="text-xs text-gray-500">{template.usageCount} uses</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
