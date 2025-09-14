"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Bell, Moon, Sun, Shield, Clock, Palette, CheckCircle } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface PreferencesStepProps {
  onComplete: () => void
}

export default function PreferencesStep({ onComplete }: PreferencesStepProps) {
  const [preferences, setPreferences] = useState({
    notifications: true,
    notificationTime: "morning",
    theme: "system",
    privacy: "partner-only",
    createTaskNow: false,
  })

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  const handleComplete = () => {
    console.log("Preferences saved:", preferences)
    onComplete()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center"
        >
          <Palette className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Customize Your Experience</h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Let's set up your preferences to make DuoTrak work perfectly for you
        </p>
      </div>

      <div className="grid gap-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-500" />
              <span>Notifications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable notifications</p>
                <p className="text-sm text-gray-500">Get reminders and updates from your partner</p>
              </div>
              <Switch
                checked={preferences.notifications}
                onCheckedChange={(checked) => handlePreferenceChange("notifications", checked)}
              />
            </div>
            
            {preferences.notifications && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3"
              >
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Preferred notification time
                  </label>
                  <Select
                    value={preferences.notificationTime}
                    onValueChange={(value) => handlePreferenceChange("notificationTime", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (8:00 AM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (2:00 PM)</SelectItem>
                      <SelectItem value="evening">Evening (6:00 PM)</SelectItem>
                      <SelectItem value="custom">Custom time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sun className="w-5 h-5 text-yellow-500" />
              <span>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Choose your preferred theme</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "light", name: "Light", icon: Sun },
                  { id: "dark", name: "Dark", icon: Moon },
                  { id: "system", name: "System", icon: Clock },
                ].map((theme) => {
                  const Icon = theme.icon
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handlePreferenceChange("theme", theme.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        preferences.theme === theme.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-xs font-medium">{theme.name}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span>Privacy</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Who can see your goals and progress?</p>
              <Select
                value={preferences.privacy}
                onValueChange={(value) => handlePreferenceChange("privacy", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partner-only">Partner only</SelectItem>
                  <SelectItem value="friends">Partner and friends</SelectItem>
                  <SelectItem value="public">Public (leaderboards)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Task Creation Choice */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-purple-500" />
              <span>Get Started</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Would you like to create your first task now?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePreferenceChange("createTaskNow", true)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    preferences.createTaskNow
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm mb-1">Yes, let's do it!</div>
                  <div className="text-xs text-gray-500">Create a task and start tracking</div>
                </button>
                <button
                  onClick={() => handlePreferenceChange("createTaskNow", false)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    !preferences.createTaskNow
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm mb-1">I'll do it later</div>
                  <div className="text-xs text-gray-500">Explore the app first</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-6">
        <Button onClick={handleComplete} size="lg" className="px-8">
          Save Preferences & Continue
        </Button>
      </div>
    </motion.div>
  )
}
