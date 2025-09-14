"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, TrendingUp, User, Clock, Target, Zap, Activity, Calendar, MessageSquare, BarChart3, Eye, Lightbulb, RefreshCw, Settings, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface BehaviorPattern {
  id: string
  name: string
  description: string
  confidence: number
  dataPoints: number
  lastUpdated: string
  trend: 'improving' | 'stable' | 'declining'
  insights: string[]
  recommendations: string[]
}

interface LearningInsight {
  id: string
  type: 'timing' | 'content' | 'frequency' | 'context'
  title: string
  description: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
  actionable: boolean
  implemented: boolean
  createdAt: string
}

interface UserSegment {
  id: string
  name: string
  characteristics: string[]
  size: number
  averageEngagement: number
  preferredTiming: number[]
  commonPatterns: string[]
}

interface LearningMetrics {
  totalDataPoints: number
  patternsIdentified: number
  predictionAccuracy: number
  learningVelocity: number
  confidenceScore: number
  lastModelUpdate: string
}

interface UserPatternLearningProps {
  userId: string
  onPatternUpdate: (patterns: BehaviorPattern[]) => void
  onInsightGenerated: (insight: LearningInsight) => void
}

export default function UserPatternLearning({
  userId,
  onPatternUpdate,
  onInsightGenerated
}: UserPatternLearningProps) {
  const [behaviorPatterns, setBehaviorPatterns] = useState<BehaviorPattern[]>([
    {
      id: 'morning-motivation',
      name: 'Morning Motivation Seeker',
      description: 'Responds best to encouraging messages in early morning hours',
      confidence: 0.89,
      dataPoints: 234,
      lastUpdated: '2024-01-15T08:30:00Z',
      trend: 'improving',
      insights: [
        'Peak response time: 7:30-8:30 AM',
        'Prefers motivational tone over urgent',
        'Higher engagement with partner mentions'
      ],
      recommendations: [
        'Send daily motivation at 7:45 AM',
        'Include partner encouragement in messages',
        'Use energetic emojis and positive language'
      ]
    },
    {
      id: 'evening-reflector',
      name: 'Evening Reflection Pattern',
      description: 'Engages with progress updates and planning in evening hours',
      confidence: 0.76,
      dataPoints: 187,
      lastUpdated: '2024-01-14T19:45:00Z',
      trend: 'stable',
      insights: [
        'Most active 6-8 PM for reflection',
        'Responds well to progress summaries',
        'Prefers detailed over brief messages'
      ],
      recommendations: [
        'Send weekly progress at 7 PM',
        'Include detailed achievement breakdowns',
        'Ask reflective questions to boost engagement'
      ]
    },
    {
      id: 'streak-protector',
      name: 'Streak Protection Anxiety',
      description: 'Shows high stress response to streak-at-risk notifications',
      confidence: 0.92,
      dataPoints: 156,
      lastUpdated: '2024-01-15T16:20:00Z',
      trend: 'improving',
      insights: [
        'Immediate action when streak threatened',
        'Prefers gentle reminders over urgent alerts',
        'Best response 2-3 hours before deadline'
      ],
      recommendations: [
        'Send gentle reminders 3 hours before deadline',
        'Use supportive rather than urgent language',
        'Provide easy completion options'
      ]
    },
    {
      id: 'weekend-warrior',
      name: 'Weekend Schedule Flexibility',
      description: 'Different engagement patterns on weekends vs weekdays',
      confidence: 0.68,
      dataPoints: 98,
      lastUpdated: '2024-01-13T11:15:00Z',
      trend: 'stable',
      insights: [
        'Later wake-up times on weekends',
        'More flexible with timing',
        'Higher engagement with leisure activities'
      ],
      recommendations: [
        'Delay weekend notifications by 2 hours',
        'Focus on enjoyable rather than urgent tasks',
        'Suggest weekend-specific activities'
      ]
    },
    {
      id: 'partner-dependent',
      name: 'Partner Activity Correlation',
      description: 'Engagement strongly correlates with partner activity levels',
      confidence: 0.84,
      dataPoints: 203,
      lastUpdated: '2024-01-15T14:10:00Z',
      trend: 'improving',
      insights: [
        'Higher completion when partner is active',
        'Responds to partner achievement notifications',
        'Competitive motivation works well'
      ],
      recommendations: [
        'Send notifications when partner is active',
        'Include partner progress comparisons',
        'Use collaborative language and challenges'
      ]
    }
  ])

  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([
    {
      id: 'timing-optimization',
      type: 'timing',
      title: 'Optimal Notification Window Identified',
      description: 'User shows 34% higher response rate when notifications are sent between 7:30-8:15 AM',
      confidence: 0.91,
      impact: 'high',
      actionable: true,
      implemented: true,
      createdAt: '2024-01-15T09:00:00Z'
    },
    {
      id: 'content-preference',
      type: 'content',
      title: 'Partner Mention Boost',
      description: 'Messages mentioning partner show 28% higher engagement rates',
      confidence: 0.87,
      impact: 'high',
      actionable: true,
      implemented: true,
      createdAt: '2024-01-14T15:30:00Z'
    },
    {
      id: 'frequency-adjustment',
      type: 'frequency',
      title: 'Weekend Frequency Reduction',
      description: 'User prefers 40% fewer notifications on weekends for better satisfaction',
      confidence: 0.73,
      impact: 'medium',
      actionable: true,
      implemented: false,
      createdAt: '2024-01-13T12:20:00Z'
    },
    {
      id: 'context-awareness',
      type: 'context',
      title: 'Weather Impact on Outdoor Activities',
      description: 'Outdoor task completion drops 45% on rainy days, suggesting need for alternative suggestions',
      confidence: 0.68,
      impact: 'medium',
      actionable: true,
      implemented: false,
      createdAt: '2024-01-12T16:45:00Z'
    }
  ])

  const [userSegments] = useState<UserSegment[]>([
    {
      id: 'morning-achievers',
      name: 'Morning Achievers',
      characteristics: ['Early risers', 'High morning energy', 'Prefer structured routines'],
      size: 34,
      averageEngagement: 0.82,
      preferredTiming: [6, 7, 8, 9],
      commonPatterns: ['morning-motivation', 'streak-protector']
    },
    {
      id: 'evening-planners',
      name: 'Evening Planners',
      characteristics: ['Night owls', 'Reflective', 'Detail-oriented'],
      size: 28,
      averageEngagement: 0.76,
      preferredTiming: [18, 19, 20, 21],
      commonPatterns: ['evening-reflector', 'partner-dependent']
    },
    {
      id: 'flexible-adapters',
      name: 'Flexible Adapters',
      characteristics: ['Variable schedules', 'Context-sensitive', 'Adaptable'],
      size: 22,
      averageEngagement: 0.71,
      preferredTiming: [10, 11, 15, 16, 19, 20],
      commonPatterns: ['weekend-warrior', 'partner-dependent']
    }
  ])

  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics>({
    totalDataPoints: 1247,
    patternsIdentified: 23,
    predictionAccuracy: 0.87,
    learningVelocity: 0.92,
    confidenceScore: 0.84,
    lastModelUpdate: '2024-01-15T10:30:00Z'
  })

  const [isLearning, setIsLearning] = useState(false)
  const [autoLearning, setAutoLearning] = useState(true)

  const runLearningCycle = useCallback(() => {
    setIsLearning(true)
    
    // Simulate learning process
    setTimeout(() => {
      // Update metrics
      setLearningMetrics(prev => ({
        ...prev,
        totalDataPoints: prev.totalDataPoints + Math.floor(Math.random() * 20) + 5,
        patternsIdentified: prev.patternsIdentified + Math.floor(Math.random() * 3),
        predictionAccuracy: Math.min(0.98, prev.predictionAccuracy + 0.01),
        learningVelocity: Math.min(0.95, prev.learningVelocity + 0.005),
        lastModelUpdate: new Date().toISOString()
      }))
      
      // Potentially generate new insight
      if (Math.random() > 0.7) {
        const newInsight: LearningInsight = {
          id: `insight-${Date.now()}`,
          type: ['timing', 'content', 'frequency', 'context'][Math.floor(Math.random() * 4)] as any,
          title: 'New Pattern Detected',
          description: 'A new behavioral pattern has been identified from recent user interactions',
          confidence: 0.6 + Math.random() * 0.3,
          impact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any,
          actionable: true,
          implemented: false,
          createdAt: new Date().toISOString()
        }
        
        setLearningInsights(prev => [newInsight, ...prev])
        onInsightGenerated(newInsight)
      }
      
      setIsLearning(false)
    }, 3000)
  }, [onInsightGenerated])

  const implementInsight = (insightId: string) => {
    setLearningInsights(prev => 
      prev.map(insight => 
        insight.id === insightId 
          ? { ...insight, implemented: true }
          : insight
      )
    )
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-blue-600'
    if (confidence >= 0.4) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'declining': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
      default: return <Activity className="w-4 h-4 text-blue-500" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Pattern Learning</h2>
          <p className="text-gray-600 dark:text-gray-400">AI-powered behavioral pattern recognition and optimization</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-learning">Auto Learning</Label>
            <Switch
              id="auto-learning"
              checked={autoLearning}
              onCheckedChange={setAutoLearning}
            />
          </div>
          <Button
            onClick={runLearningCycle}
            disabled={isLearning}
            className="flex items-center gap-2"
          >
            <Brain className={`w-4 h-4 ${isLearning ? 'animate-pulse' : ''}`} />
            {isLearning ? 'Learning...' : 'Run Learning Cycle'}
          </Button>
        </div>
      </div>

      {/* Learning Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{learningMetrics.totalDataPoints}</div>
            <div className="text-sm text-gray-600">Data Points</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{learningMetrics.patternsIdentified}</div>
            <div className="text-sm text-gray-600">Patterns Found</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{(learningMetrics.predictionAccuracy * 100).toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Accuracy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{(learningMetrics.learningVelocity * 100).toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Learning Speed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{(learningMetrics.confidenceScore * 100).toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Confidence</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patterns">Behavior Patterns</TabsTrigger>
          <TabsTrigger value="insights">Learning Insights</TabsTrigger>
          <TabsTrigger value="segments">User Segments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Behavior Patterns */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {behaviorPatterns.map(pattern => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{pattern.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{pattern.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(pattern.trend)}
                        <Badge variant="secondary" className={getConfidenceColor(pattern.confidence)}>
                          {(pattern.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Confidence Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Confidence Level</span>
                        <span>{(pattern.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={pattern.confidence * 100} className="h-2" />
                    </div>

                    {/* Key Insights */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Key Insights
                      </h4>
                      <ul className="space-y-1">
                        {pattern.insights.slice(0, 3).map((insight, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Recommendations
                      </h4>
                      <ul className="space-y-1">
                        {pattern.recommendations.slice(0, 2).map((rec, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <div className="w-1 h-1 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                      <span>{pattern.dataPoints} data points</span>
                      <span>Updated {new Date(pattern.lastUpdated).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Learning Insights */}
        <TabsContent value="insights" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Recent Learning Insights</h3>
              <p className="text-sm text-gray-600">Actionable insights discovered from user behavior analysis</p>
            </div>
            <Badge variant="secondary">
              {learningInsights.filter(i => !i.implemented).length} Pending
            </Badge>
          </div>

          <div className="space-y-3">
            {learningInsights.map(insight => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className={`${insight.implemented ? 'opacity-75' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-full ${
                            insight.type === 'timing' ? 'bg-blue-100 text-blue-600' :
                            insight.type === 'content' ? 'bg-green-100 text-green-600' :
                            insight.type === 'frequency' ? 'bg-purple-100 text-purple-600' :
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {insight.type === 'timing' ? <Clock className="w-4 h-4" /> :
                             insight.type === 'content' ? <MessageSquare className="w-4 h-4" /> :
                             insight.type === 'frequency' ? <BarChart3 className="w-4 h-4" /> :
                             <Target className="w-4 h-4" />}
                          </div>
                          <div>
                            <h4 className="font-medium">{insight.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {insight.type}
                              </Badge>
                              <Badge variant="secondary" className={`text-xs ${getImpactColor(insight.impact)}`}>
                                {insight.impact} impact
                              </Badge>
                              {insight.implemented && (
                                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Implemented
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                            <span>Created: {new Date(insight.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          {insight.actionable && !insight.implemented && (
                            <Button
                              size="sm"
                              onClick={() => implementInsight(insight.id)}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Implement
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* User Segments */}
        <TabsContent value="segments" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userSegments.map(segment => (
              <Card key={segment.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{segment.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{segment.size}% of users</Badge>
                    <Badge variant="outline">{(segment.averageEngagement * 100).toFixed(0)}% engagement</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Characteristics */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Characteristics</h4>
                    <div className="space-y-1">
                      {segment.characteristics.map((char, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-1 h-1 bg-blue-500 rounded-full" />
                          {char}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Timing */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Preferred Times</h4>
                    <div className="flex flex-wrap gap-1">
                      {segment.preferredTiming.map(hour => (
                        <Badge key={hour} variant="outline" className="text-xs">
                          {hour.toString().padStart(2, '0')}:00
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Common Patterns */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Common Patterns</h4>
                    <div className="space-y-1">
                      {segment.commonPatterns.map((pattern, index) => (
                        <Badge key={index} variant="secondary" className="text-xs mr-1 mb-1">
                          {pattern.replace('-', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Engagement Score */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Engagement Score</span>
                      <span>{(segment.averageEngagement * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={segment.averageEngagement * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Pattern Recognition</span>
                      <span>{(learningMetrics.predictionAccuracy * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={learningMetrics.predictionAccuracy * 100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Learning Velocity</span>
                      <span>{(learningMetrics.learningVelocity * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={learningMetrics.learningVelocity * 100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Confidence Score</span>
                      <span>{(learningMetrics.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={learningMetrics.confidenceScore * 100} className="h-2" />
                  </div>
                </div>

                <div className="pt-4 border-t text-sm text-gray-600">
                  <div className="flex justify-between mb-1">
                    <span>Last Model Update</span>
                    <span>{new Date(learningMetrics.lastModelUpdate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Scheduled Update</span>
                    <span>In 6 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pattern Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Pattern Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {behaviorPatterns.map(pattern => (
                    <div key={pattern.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          pattern.confidence > 0.8 ? 'bg-green-500' :
                          pattern.confidence > 0.6 ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`} />
                        <span className="text-sm">{pattern.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{(pattern.confidence * 100).toFixed(0)}%</div>
                        <div className="text-xs text-gray-500">{pattern.dataPoints} points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Insights Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Insights Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{learningInsights.length}</div>
                    <div className="text-sm text-gray-600">Total Insights</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {learningInsights.filter(i => i.implemented).length}
                    </div>
                    <div className="text-sm text-gray-600">Implemented</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {['timing', 'content', 'frequency', 'context'].map(type => {
                    const count = learningInsights.filter(i => i.type === type).length
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{type}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Model Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Model Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Prediction Accuracy</span>
                    <span className="font-medium text-green-600">87.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">False Positive Rate</span>
                    <span className="font-medium text-blue-600">4.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Model Confidence</span>
                    <span className="font-medium text-purple-600">84.1%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Training Data Quality</span>
                    <span className="font-medium text-orange-600">91.7%</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Model Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Learning Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Learning Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: '2 hours ago', activity: 'Identified new timing preference pattern', type: 'pattern' },
                  { time: '5 hours ago', activity: 'Updated user segment classification', type: 'segment' },
                  { time: '8 hours ago', activity: 'Generated content optimization insight', type: 'insight' },
                  { time: '12 hours ago', activity: 'Refined prediction model accuracy', type: 'model' },
                  { time: '1 day ago', activity: 'Discovered weekend behavior variation', type: 'pattern' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={`p-2 rounded-full ${
                      item.type === 'pattern' ? 'bg-blue-100 text-blue-600' :
                      item.type === 'segment' ? 'bg-green-100 text-green-600' :
                      item.type === 'insight' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {item.type === 'pattern' ? <Target className="w-4 h-4" /> :
                       item.type === 'segment' ? <User className="w-4 h-4" /> :
                       item.type === 'insight' ? <Lightbulb className="w-4 h-4" /> :
                       <Brain className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.activity}</div>
                      <div className="text-xs text-gray-500">{item.time}</div>
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
