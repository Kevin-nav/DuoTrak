"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageSquare, Edit3, Plus, Trash2, Copy, Eye, BarChart3, Clock, Users, Target, Zap, Heart, Trophy, AlertTriangle, Lightbulb, Save, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface MessageTemplate {
  id: string
  name: string
  type: 'reminder' | 'encouragement' | 'celebration' | 'nudge' | 'milestone' | 'recovery' | 'streak' | 'partner'
  category: 'task' | 'goal' | 'partner' | 'streak' | 'achievement' | 'system'
  title: string
  message: string
  variables: string[]
  tone: 'friendly' | 'motivational' | 'celebratory' | 'urgent' | 'supportive' | 'playful'
  timing: {
    optimal: number[]
    avoid: number[]
    contextual: string[]
  }
  conditions: {
    userState?: string[]
    streakStatus?: string[]
    goalProgress?: string[]
    partnerActivity?: string[]
    timeOfDay?: string[]
    dayOfWeek?: string[]
  }
  effectiveness: number
  usageCount: number
  lastUsed: string
  createdBy: 'system' | 'user' | 'ai'
  isActive: boolean
}

interface MessageTemplateSystemProps {
  onTemplateUpdate: (template: MessageTemplate) => void
  onTemplateCreate: (template: MessageTemplate) => void
  onTemplateDelete: (templateId: string) => void
}

export default function MessageTemplateSystem({
  onTemplateUpdate,
  onTemplateCreate,
  onTemplateDelete
}: MessageTemplateSystemProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([
    {
      id: 'morning-energy',
      name: 'Morning Energy Boost',
      type: 'encouragement',
      category: 'task',
      title: "Good morning, {userName}! ☀️",
      message: "Ready to tackle your {taskName}? You've got this! {partnerName} is rooting for you. 💪",
      variables: ['userName', 'taskName', 'partnerName'],
      tone: 'motivational',
      timing: {
        optimal: [6, 7, 8, 9],
        avoid: [22, 23, 0, 1, 2, 3, 4, 5],
        contextual: ['weekday_morning', 'high_energy_time']
      },
      conditions: {
        userState: ['active', 'motivated'],
        timeOfDay: ['morning'],
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      },
      effectiveness: 0.87,
      usageCount: 234,
      lastUsed: '2024-01-15T08:30:00Z',
      createdBy: 'system',
      isActive: true
    },
    {
      id: 'streak-fire',
      name: 'Streak Protection Alert',
      type: 'nudge',
      category: 'streak',
      title: "🔥 Don't break the chain!",
      message: "Your {streakCount}-day streak is on fire! Just {timeRemaining} left to keep it burning. You've come too far to stop now!",
      variables: ['streakCount', 'timeRemaining'],
      tone: 'urgent',
      timing: {
        optimal: [16, 17, 18, 19, 20],
        avoid: [0, 1, 2, 3, 4, 5, 6],
        contextual: ['streak_at_risk', 'evening_reminder']
      },
      conditions: {
        streakStatus: ['at_risk', 'active'],
        timeOfDay: ['afternoon', 'evening']
      },
      effectiveness: 0.93,
      usageCount: 156,
      lastUsed: '2024-01-14T18:45:00Z',
      createdBy: 'system',
      isActive: true
    },
    {
      id: 'duo-celebration',
      name: 'Duo Achievement Party',
      type: 'celebration',
      category: 'achievement',
      title: "🎉 Duo power activated!",
      message: "Amazing! You and {partnerName} both crushed {goalName} today. This is what teamwork looks like! 🚀",
      variables: ['partnerName', 'goalName'],
      tone: 'celebratory',
      timing: {
        optimal: [18, 19, 20, 21],
        avoid: [6, 7, 8, 9],
        contextual: ['both_completed', 'celebration_time']
      },
      conditions: {
        partnerActivity: ['completed_today'],
        userState: ['completed_today']
      },
      effectiveness: 0.96,
      usageCount: 89,
      lastUsed: '2024-01-13T19:20:00Z',
      createdBy: 'system',
      isActive: true
    },
    {
      id: 'gentle-recovery',
      name: 'Gentle Recovery Support',
      type: 'recovery',
      category: 'streak',
      title: "Every champion has setbacks 💙",
      message: "Yesterday didn't go as planned, but that's okay. Today is a fresh start, and {partnerName} believes in your comeback story.",
      variables: ['partnerName'],
      tone: 'supportive',
      timing: {
        optimal: [7, 8, 9, 10],
        avoid: [22, 23, 0, 1],
        contextual: ['after_missed_day', 'recovery_mode']
      },
      conditions: {
        userState: ['missed_yesterday', 'recovering'],
        timeOfDay: ['morning']
      },
      effectiveness: 0.78,
      usageCount: 67,
      lastUsed: '2024-01-12T08:15:00Z',
      createdBy: 'system',
      isActive: true
    },
    {
      id: 'weekend-motivation',
      name: 'Weekend Warrior',
      type: 'encouragement',
      category: 'task',
      title: "Weekend warrior mode! 🏃‍♀️",
      message: "Weekends are when champions are made. Your {taskName} is waiting - show it who's boss!",
      variables: ['taskName'],
      tone: 'playful',
      timing: {
        optimal: [9, 10, 11, 14, 15, 16],
        avoid: [22, 23, 0, 1, 2, 3, 4, 5, 6, 7],
        contextual: ['weekend_energy', 'flexible_schedule']
      },
      conditions: {
        dayOfWeek: ['Saturday', 'Sunday'],
        userState: ['active']
      },
      effectiveness: 0.82,
      usageCount: 123,
      lastUsed: '2024-01-14T10:30:00Z',
      createdBy: 'ai',
      isActive: true
    }
  ])

  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [previewData, setPreviewData] = useState({
    userName: 'Alex',
    partnerName: 'Jordan',
    taskName: 'Morning Workout',
    goalName: 'Fitness Journey',
    streakCount: '7',
    timeRemaining: '3 hours'
  })

  const availableVariables = [
    'userName', 'partnerName', 'taskName', 'goalName', 
    'streakCount', 'timeRemaining', 'completionRate', 
    'daysLeft', 'totalDays', 'currentLevel'
  ]

  const toneColors = {
    friendly: 'bg-blue-100 text-blue-800',
    motivational: 'bg-green-100 text-green-800',
    celebratory: 'bg-yellow-100 text-yellow-800',
    urgent: 'bg-red-100 text-red-800',
    supportive: 'bg-purple-100 text-purple-800',
    playful: 'bg-pink-100 text-pink-800'
  }

  const typeIcons = {
    reminder: Clock,
    encouragement: Heart,
    celebration: Trophy,
    nudge: AlertTriangle,
    milestone: Target,
    recovery: Lightbulb,
    streak: Zap,
    partner: Users
  }

  const previewMessage = useCallback((template: MessageTemplate) => {
    let title = template.title
    let message = template.message
    
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g')
      title = title.replace(regex, value)
      message = message.replace(regex, value)
    })
    
    return { title, message }
  }, [previewData])

  const handleCreateTemplate = () => {
    const newTemplate: MessageTemplate = {
      id: `template-${Date.now()}`,
      name: 'New Template',
      type: 'encouragement',
      category: 'task',
      title: 'New notification title',
      message: 'Your notification message here...',
      variables: [],
      tone: 'friendly',
      timing: {
        optimal: [9, 10, 11],
        avoid: [22, 23, 0, 1, 2, 3, 4, 5],
        contextual: []
      },
      conditions: {},
      effectiveness: 0,
      usageCount: 0,
      lastUsed: new Date().toISOString(),
      createdBy: 'user',
      isActive: true
    }
    
    setSelectedTemplate(newTemplate)
    setIsCreating(true)
    setIsEditing(true)
  }

  const handleSaveTemplate = (template: MessageTemplate) => {
    if (isCreating) {
      setTemplates(prev => [...prev, template])
      onTemplateCreate(template)
      setIsCreating(false)
    } else {
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t))
      onTemplateUpdate(template)
    }
    setIsEditing(false)
    setSelectedTemplate(null)
  }

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId))
    onTemplateDelete(templateId)
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null)
    }
  }

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 0.9) return 'text-green-600'
    if (effectiveness >= 0.8) return 'text-blue-600'
    if (effectiveness >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Message Templates</h2>
          <p className="text-gray-600 dark:text-gray-400">Create and manage personalized notification templates</p>
        </div>
        <Button onClick={handleCreateTemplate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="task">Tasks</TabsTrigger>
              <TabsTrigger value="streak">Streaks</TabsTrigger>
              <TabsTrigger value="partner">Partner</TabsTrigger>
              <TabsTrigger value="achievement">Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3">
              {templates.map(template => {
                const Icon = typeIcons[template.type] || MessageSquare
                const preview = previewMessage(template)
                
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${toneColors[template.tone]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {template.type}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${toneColors[template.tone]}`}>
                              {template.tone}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${getEffectivenessColor(template.effectiveness)}`}>
                          {(template.effectiveness * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">{template.usageCount} uses</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3 mb-3">
                      <div className="font-medium text-sm mb-1">{preview.title}</div>
                      <div className="text-sm text-gray-600">{preview.message}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Variables: {template.variables.length}</span>
                        <span>•</span>
                        <span>Optimal: {template.timing.optimal.slice(0, 3).join(', ')}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedTemplate(template)
                            setIsEditing(true)
                          }}
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Copy template logic
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTemplate(template.id)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </TabsContent>

            {/* Other tab contents would filter templates by category */}
            {['task', 'streak', 'partner', 'achievement'].map(category => (
              <TabsContent key={category} value={category} className="space-y-3">
                {templates
                  .filter(t => t.category === category)
                  .map(template => {
                    const Icon = typeIcons[template.type] || MessageSquare
                    const preview = previewMessage(template)
                    
                    return (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${toneColors[template.tone]}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-medium">{template.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs capitalize">
                                  {template.type}
                                </Badge>
                                <Badge variant="outline" className={`text-xs ${toneColors[template.tone]}`}>
                                  {template.tone}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-medium ${getEffectivenessColor(template.effectiveness)}`}>
                              {(template.effectiveness * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-500">{template.usageCount} uses</div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded p-3">
                          <div className="font-medium text-sm mb-1">{preview.title}</div>
                          <div className="text-sm text-gray-600">{preview.message}</div>
                        </div>
                      </motion.div>
                    )
                  })}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Template Editor/Preview */}
        <div className="space-y-4">
          {selectedTemplate ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {isEditing ? 'Edit Template' : 'Template Preview'}
                  </CardTitle>
                  {!isEditing && (
                    <Button
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <TemplateEditor
                    template={selectedTemplate}
                    availableVariables={availableVariables}
                    onSave={handleSaveTemplate}
                    onCancel={() => {
                      setIsEditing(false)
                      if (isCreating) {
                        setSelectedTemplate(null)
                        setIsCreating(false)
                      }
                    }}
                  />
                ) : (
                  <TemplatePreview
                    template={selectedTemplate}
                    previewData={previewData}
                    onPreviewDataChange={setPreviewData}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a template to preview or edit</p>
              </CardContent>
            </Card>
          )}

          {/* Template Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Template Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Total Templates</span>
                <span className="font-medium">{templates.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Templates</span>
                <span className="font-medium">{templates.filter(t => t.isActive).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg. Effectiveness</span>
                <span className="font-medium">
                  {(templates.reduce((acc, t) => acc + t.effectiveness, 0) / templates.length * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Most Used Type</span>
                <span className="font-medium capitalize">
                  {templates.reduce((acc, t) => {
                    acc[t.type] = (acc[t.type] || 0) + t.usageCount
                    return acc
                  }, {} as Record<string, number>)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Template Editor Component
function TemplateEditor({ 
  template, 
  availableVariables, 
  onSave, 
  onCancel 
}: {
  template: MessageTemplate
  availableVariables: string[]
  onSave: (template: MessageTemplate) => void
  onCancel: () => void
}) {
  const [editedTemplate, setEditedTemplate] = useState<MessageTemplate>(template)

  const handleSave = () => {
    onSave(editedTemplate)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="template-name">Template Name</Label>
        <Input
          id="template-name"
          value={editedTemplate.name}
          onChange={(e) => setEditedTemplate(prev => ({ ...prev, name: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="template-type">Type</Label>
          <Select
            value={editedTemplate.type}
            onValueChange={(value: any) => setEditedTemplate(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reminder">Reminder</SelectItem>
              <SelectItem value="encouragement">Encouragement</SelectItem>
              <SelectItem value="celebration">Celebration</SelectItem>
              <SelectItem value="nudge">Nudge</SelectItem>
              <SelectItem value="milestone">Milestone</SelectItem>
              <SelectItem value="recovery">Recovery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="template-tone">Tone</Label>
          <Select
            value={editedTemplate.tone}
            onValueChange={(value: any) => setEditedTemplate(prev => ({ ...prev, tone: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="motivational">Motivational</SelectItem>
              <SelectItem value="celebratory">Celebratory</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="supportive">Supportive</SelectItem>
              <SelectItem value="playful">Playful</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="template-title">Title</Label>
        <Input
          id="template-title"
          value={editedTemplate.title}
          onChange={(e) => setEditedTemplate(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="template-message">Message</Label>
        <Textarea
          id="template-message"
          value={editedTemplate.message}
          onChange={(e) => setEditedTemplate(prev => ({ ...prev, message: e.target.value }))}
          rows={3}
        />
      </div>

      <div>
        <Label>Available Variables</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {availableVariables.map(variable => (
            <Badge
              key={variable}
              variant="outline"
              className="cursor-pointer hover:bg-blue-100"
              onClick={() => {
                // Add variable to message
                const textarea = document.getElementById('template-message') as HTMLTextAreaElement
                if (textarea) {
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const text = textarea.value
                  const before = text.substring(0, start)
                  const after = text.substring(end, text.length)
                  const newText = before + `{${variable}}` + after
                  setEditedTemplate(prev => ({ ...prev, message: newText }))
                }
              }}
            >
              {variable}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Template
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </div>
  )
}

// Template Preview Component
function TemplatePreview({ 
  template, 
  previewData, 
  onPreviewDataChange 
}: {
  template: MessageTemplate
  previewData: any
  onPreviewDataChange: (data: any) => void
}) {
  const previewMessage = () => {
    let title = template.title
    let message = template.message
    
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g')
      title = title.replace(regex, value as string)
      message = message.replace(regex, value as string)
    })
    
    return { title, message }
  }

  const preview = previewMessage()

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="font-medium mb-2">{preview.title}</div>
        <div className="text-gray-600">{preview.message}</div>
      </div>

      {/* Preview Data Controls */}
      <div>
        <Label>Preview Data</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Object.entries(previewData).map(([key, value]) => (
            <div key={key}>
              <Label htmlFor={`preview-${key}`} className="text-xs capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
              <Input
                id={`preview-${key}`}
                value={value as string}
                onChange={(e) => onPreviewDataChange({
                  ...previewData,
                  [key]: e.target.value
                })}
                className="text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Template Stats */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Effectiveness</span>
          <span className="font-medium">{(template.effectiveness * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Usage Count</span>
          <span className="font-medium">{template.usageCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Variables</span>
          <span className="font-medium">{template.variables.length}</span>
        </div>
        <div className="flex justify-between">
          <span>Created By</span>
          <span className="font-medium capitalize">{template.createdBy}</span>
        </div>
      </div>
    </div>
  )
}
