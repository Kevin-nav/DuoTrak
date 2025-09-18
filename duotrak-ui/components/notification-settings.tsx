"use client"
import { Bell, Clock, MessageSquare, Target, TrendingUp, Users, Smartphone, Mail, Volume2, Moon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface NotificationSettings {
  // Delivery Methods
  pushNotifications: boolean
  emailNotifications: boolean
  inAppOnly: boolean

  // Notification Types
  taskReminders: boolean
  verificationRequests: boolean
  partnerMessages: boolean
  goalMilestones: boolean
  streakUpdates: boolean
  weeklyReports: boolean

  // Timing Preferences
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string

  // Frequency Controls
  reminderFrequency: "low" | "medium" | "high"
  batchNotifications: boolean

  // Partner-Specific
  partnerNudges: boolean
  partnerAchievements: boolean
  partnerVerifications: boolean

  // Sound & Vibration
  soundEnabled: boolean
  vibrationEnabled: boolean
  customSounds: boolean
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: false,
    inAppOnly: false,
    taskReminders: true,
    verificationRequests: true,
    partnerMessages: true,
    goalMilestones: true,
    streakUpdates: true,
    weeklyReports: false,
    quietHoursEnabled: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    reminderFrequency: "medium",
    batchNotifications: false,
    partnerNudges: true,
    partnerAchievements: true,
    partnerVerifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    customSounds: false,
  })

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = () => {
    // Save settings to backend
    console.log("Saving notification settings:", settings)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notification Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Customize how and when you receive notifications</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Delivery Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Delivery Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications" className="font-medium">
                  Push Notifications
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications on your device</p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive important updates via email</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="in-app-only" className="font-medium">
                  In-App Only
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Only show notifications when app is open</p>
              </div>
              <Switch
                id="in-app-only"
                checked={settings.inAppOnly}
                onCheckedChange={(checked) => updateSetting("inAppOnly", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <div>
                    <Label className="font-medium">Task Reminders</Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Daily task notifications</p>
                  </div>
                </div>
                <Switch
                  checked={settings.taskReminders}
                  onCheckedChange={(checked) => updateSetting("taskReminders", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <div>
                    <Label className="font-medium">Verification Requests</Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Partner verification needed</p>
                  </div>
                </div>
                <Switch
                  checked={settings.verificationRequests}
                  onCheckedChange={(checked) => updateSetting("verificationRequests", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  <div>
                    <Label className="font-medium">Partner Messages</Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Chat and nudges</p>
                  </div>
                </div>
                <Switch
                  checked={settings.partnerMessages}
                  onCheckedChange={(checked) => updateSetting("partnerMessages", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-yellow-500" />
                  <div>
                    <Label className="font-medium">Goal Milestones</Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Achievement celebrations</p>
                  </div>
                </div>
                <Switch
                  checked={settings.goalMilestones}
                  onCheckedChange={(checked) => updateSetting("goalMilestones", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <div>
                    <Label className="font-medium">Streak Updates</Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Streak milestones</p>
                  </div>
                </div>
                <Switch
                  checked={settings.streakUpdates}
                  onCheckedChange={(checked) => updateSetting("streakUpdates", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <div>
                    <Label className="font-medium">Weekly Reports</Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Progress summaries</p>
                  </div>
                </div>
                <Switch
                  checked={settings.weeklyReports}
                  onCheckedChange={(checked) => updateSetting("weeklyReports", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timing Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="w-5 h-5" />
              Timing Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="quiet-hours" className="font-medium">
                  Quiet Hours
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pause notifications during specified hours</p>
              </div>
              <Switch
                id="quiet-hours"
                checked={settings.quietHoursEnabled}
                onCheckedChange={(checked) => updateSetting("quietHoursEnabled", checked)}
              />
            </div>

            {settings.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div>
                  <Label className="text-sm font-medium">Start Time</Label>
                  <Select
                    value={settings.quietHoursStart}
                    onValueChange={(value) => updateSetting("quietHoursStart", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, "0")
                        return (
                          <SelectItem key={hour} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Time</Label>
                  <Select
                    value={settings.quietHoursEnd}
                    onValueChange={(value) => updateSetting("quietHoursEnd", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = i.toString().padStart(2, "0")
                        return (
                          <SelectItem key={hour} value={`${hour}:00`}>
                            {hour}:00
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Separator />

            <div>
              <Label className="font-medium">Reminder Frequency</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                How often should we remind you about tasks?
              </p>
              <Select
                value={settings.reminderFrequency}
                onValueChange={(value: "low" | "medium" | "high") => updateSetting("reminderFrequency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minimal reminders</SelectItem>
                  <SelectItem value="medium">Medium - Balanced approach</SelectItem>
                  <SelectItem value="high">High - Frequent reminders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="batch-notifications" className="font-medium">
                  Batch Notifications
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Group similar notifications together</p>
              </div>
              <Switch
                id="batch-notifications"
                checked={settings.batchNotifications}
                onCheckedChange={(checked) => updateSetting("batchNotifications", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Partner-Specific Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Partner Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="partner-nudges" className="font-medium">
                  Partner Nudges
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive encouragement from your partner</p>
              </div>
              <Switch
                id="partner-nudges"
                checked={settings.partnerNudges}
                onCheckedChange={(checked) => updateSetting("partnerNudges", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="partner-achievements" className="font-medium">
                  Partner Achievements
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Celebrate your partner's milestones</p>
              </div>
              <Switch
                id="partner-achievements"
                checked={settings.partnerAchievements}
                onCheckedChange={(checked) => updateSetting("partnerAchievements", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="partner-verifications" className="font-medium">
                  Verification Requests
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">When your partner needs verification</p>
              </div>
              <Switch
                id="partner-verifications"
                checked={settings.partnerVerifications}
                onCheckedChange={(checked) => updateSetting("partnerVerifications", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sound & Vibration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Sound & Vibration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="sound-enabled" className="font-medium">
                  Sound Notifications
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Play sounds for notifications</p>
              </div>
              <Switch
                id="sound-enabled"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSetting("soundEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="vibration-enabled" className="font-medium">
                  Vibration
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vibrate for notifications</p>
              </div>
              <Switch
                id="vibration-enabled"
                checked={settings.vibrationEnabled}
                onCheckedChange={(checked) => updateSetting("vibrationEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="custom-sounds" className="font-medium">
                  Custom Sounds
                </Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">Use different sounds for different types</p>
              </div>
              <Switch
                id="custom-sounds"
                checked={settings.customSounds}
                onCheckedChange={(checked) => updateSetting("customSounds", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} className="px-8">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
