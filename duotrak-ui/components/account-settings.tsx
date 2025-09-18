"use client"

import { motion } from "framer-motion"
import { Settings, Mail, Edit3, Globe, Bell, BellOff } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import MouseGlowEffect from "./mouse-glow-effect"

interface AccountSettingsProps {
  email: string
  timezone: string
  notificationsEnabled: boolean
}

export default function AccountSettings({ email, timezone, notificationsEnabled }: AccountSettingsProps) {
  const [currentEmail, setCurrentEmail] = useState(email)
  const [currentTimezone, setCurrentTimezone] = useState(timezone)
  const [currentNotifications, setCurrentNotifications] = useState(notificationsEnabled)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState(email)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const timezones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
    { value: "Europe/Paris", label: "Central European Time (CET)" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
    { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
  ]

  const handleEmailSave = () => {
    setCurrentEmail(newEmail)
    setIsEmailDialogOpen(false)
    // Handle email update logic here
  }

  const handlePasswordSave = () => {
    if (newPassword === confirmPassword) {
      // Handle password update logic here
      setIsPasswordDialogOpen(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
  }

  const handleTimezoneChange = (value: string) => {
    setCurrentTimezone(value)
    // Handle timezone update logic here
  }

  const handleNotificationsToggle = (enabled: boolean) => {
    setCurrentNotifications(enabled)
    // Handle notifications toggle logic here
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
    >
      <div className="flex items-center mb-6">
        <Settings className="w-5 h-5 mr-2 text-primary-blue" />
        <h3 className="text-xl font-bold text-charcoal dark:text-gray-100">Account Settings</h3>
      </div>

      <div className="space-y-6">
        {/* General Account Section */}
        <div>
          <h4 className="text-lg font-semibold text-charcoal dark:text-gray-100 mb-4">General Account</h4>
          <div className="space-y-4">
            {/* Email Address */}
            <MouseGlowEffect glowColor="#19A1E5" intensity="low">
              <div className="flex items-center justify-between p-4 bg-pearl-gray dark:bg-gray-700 rounded-xl border border-cool-gray dark:border-gray-600 hover:border-primary-blue dark:hover:border-primary-blue transition-colors">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-stone-gray dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-charcoal dark:text-gray-100">Email Address</p>
                    <p className="text-sm text-stone-gray dark:text-gray-300">{currentEmail}</p>
                  </div>
                </div>
                <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Email Address</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-charcoal dark:text-gray-200 mb-2">
                          New Email Address
                        </label>
                        <Input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter new email address"
                        />
                      </div>
                      <div className="flex space-x-2 justify-end">
                        <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleEmailSave} className="bg-primary-blue hover:bg-primary-blue-hover">
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </MouseGlowEffect>

            {/* Change Password */}
            <MouseGlowEffect glowColor="#19A1E5" intensity="low">
              <div className="flex items-center justify-between p-4 bg-pearl-gray dark:bg-gray-700 rounded-xl border border-cool-gray dark:border-gray-600 hover:border-primary-blue dark:hover:border-primary-blue transition-colors">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-stone-gray dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-charcoal dark:text-gray-100">Password</p>
                    <p className="text-sm text-stone-gray dark:text-gray-300">••••••••</p>
                  </div>
                </div>
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-charcoal dark:text-gray-200 mb-2">
                          Current Password
                        </label>
                        <Input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal dark:text-gray-200 mb-2">
                          New Password
                        </label>
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-charcoal dark:text-gray-200 mb-2">
                          Confirm New Password
                        </label>
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                      </div>
                      <div className="flex space-x-2 justify-end">
                        <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          onClick={handlePasswordSave}
                          disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                          className="bg-primary-blue hover:bg-primary-blue-hover"
                        >
                          Update Password
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </MouseGlowEffect>
          </div>
        </div>

        {/* Time & Notifications Section */}
        <div>
          <h4 className="text-lg font-semibold text-charcoal dark:text-gray-100 mb-4">Time & Notifications</h4>
          <div className="space-y-4">
            {/* Timezone Setting */}
            <MouseGlowEffect glowColor="#19A1E5" intensity="low">
              <div className="flex items-center justify-between p-4 bg-pearl-gray dark:bg-gray-700 rounded-xl border border-cool-gray dark:border-gray-600 hover:border-primary-blue dark:hover:border-primary-blue transition-colors">
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-stone-gray dark:text-gray-400" />
                  <div>
                    <p className="font-medium text-charcoal dark:text-gray-100">Timezone</p>
                    <p className="text-sm text-stone-gray dark:text-gray-300">
                      {timezones.find((tz) => tz.value === currentTimezone)?.label || currentTimezone}
                    </p>
                  </div>
                </div>
                <Select value={currentTimezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </MouseGlowEffect>

            {/* General Notifications Toggle */}
            <MouseGlowEffect glowColor="#19A1E5" intensity="low">
              <div className="flex items-center justify-between p-4 bg-pearl-gray dark:bg-gray-700 rounded-xl border border-cool-gray dark:border-gray-600 hover:border-primary-blue dark:hover:border-primary-blue transition-colors">
                <div className="flex items-center space-x-3">
                  {currentNotifications ? (
                    <Bell className="w-5 h-5 text-stone-gray dark:text-gray-400" />
                  ) : (
                    <BellOff className="w-5 h-5 text-stone-gray dark:text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-charcoal dark:text-gray-100">General Notifications</p>
                    <p className="text-sm text-stone-gray dark:text-gray-300">
                      {currentNotifications ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
                <Switch checked={currentNotifications} onCheckedChange={handleNotificationsToggle} />
              </div>
            </MouseGlowEffect>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
