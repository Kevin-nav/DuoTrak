"use client"

import SmartNotificationEngine from "@/components/notifications/smart-notification-engine"
import MessageTemplateSystem from "@/components/notifications/message-template-system"
import TimingOptimizer from "@/components/notifications/timing-optimizer"
import UserPatternLearning from "@/components/notifications/user-pattern-learning"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SmartNotificationsPage() {
  const handleNotificationSend = (notification: any) => {
    console.log("Sending smart notification:", notification)
    // Handle notification sending logic
  }

  const handleUserPatternUpdate = (pattern: any) => {
    console.log("Updating user pattern:", pattern)
    // Handle pattern update logic
  }

  const handleTemplateUpdate = (template: any) => {
    console.log("Updating template:", template)
    // Handle template update logic
  }

  const handleTemplateCreate = (template: any) => {
    console.log("Creating template:", template)
    // Handle template creation logic
  }

  const handleTemplateDelete = (templateId: string) => {
    console.log("Deleting template:", templateId)
    // Handle template deletion logic
  }

  const handleOptimizationUpdate = (rules: any) => {
    console.log("Updating optimization rules:", rules)
    // Handle optimization rules update logic
  }

  const handlePatternUpdate = (patterns: any) => {
    console.log("Updating behavior patterns:", patterns)
    // Handle behavior patterns update logic
  }

  const handleInsightGenerated = (insight: any) => {
    console.log("New insight generated:", insight)
    // Handle new insight logic
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Smart Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            AI-powered notification system with intelligent timing, personalized messaging, and behavioral learning
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="engine" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="engine">Notification Engine</TabsTrigger>
            <TabsTrigger value="templates">Message Templates</TabsTrigger>
            <TabsTrigger value="timing">Timing Optimizer</TabsTrigger>
            <TabsTrigger value="learning">Pattern Learning</TabsTrigger>
          </TabsList>

          <TabsContent value="engine">
            <SmartNotificationEngine
              userId="user-123"
              partnerId="partner-456"
              onSendNotification={handleNotificationSend}
              onUpdateUserPattern={handleUserPatternUpdate}
            />
          </TabsContent>

          <TabsContent value="templates">
            <MessageTemplateSystem
              onTemplateUpdate={handleTemplateUpdate}
              onTemplateCreate={handleTemplateCreate}
              onTemplateDelete={handleTemplateDelete}
            />
          </TabsContent>

          <TabsContent value="timing">
            <TimingOptimizer
              userId="user-123"
              onOptimizationUpdate={handleOptimizationUpdate}
            />
          </TabsContent>

          <TabsContent value="learning">
            <UserPatternLearning
              userId="user-123"
              onPatternUpdate={handlePatternUpdate}
              onInsightGenerated={handleInsightGenerated}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
