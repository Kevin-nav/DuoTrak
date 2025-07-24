"use client"

import { motion } from "framer-motion"
import { Settings, Mail, Edit3, Globe, Bell, BellOff } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import MouseGlowEffect from "./mouse-glow-effect"
import TimezoneDisplay from "./timezone-display"
import { useUser } from "@/contexts/UserContext"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from "firebase/auth"

interface AccountSettingsProps {
  email: string
  timezone: string
  notificationsEnabled: boolean
}

export default function AccountSettings({ email, timezone, notificationsEnabled }: AccountSettingsProps) {
  const { userDetails, refetchUserDetails } = useUser()
  const [currentEmail, setCurrentEmail] = useState(email)
  const [currentTimezone, setCurrentTimezone] = useState(timezone)
  const [currentNotifications, setCurrentNotifications] = useState(notificationsEnabled)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState(email)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currentPasswordForReauth, setCurrentPasswordForReauth] = useState("") // For re-authentication

  useEffect(() => {
    setCurrentEmail(email)
    setNewEmail(email)
    setCurrentTimezone(timezone)
    setCurrentNotifications(notificationsEnabled)
  }, [email, timezone, notificationsEnabled])

  const timezones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
    { value: "Europe/Paris", label: "Central European Time (CET)" },
    { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
    { value: "Australia/Sydney", label: "Sydney (AET)" },
    { value: "Australia/Sydney", label: "Newcastle (AET)" },
  ]

  const handleEmailSave = async () => {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      toast.error("No authenticated user found.")
      return
    }

    if (!currentPasswordForReauth) {
      toast.error("Please enter your current password to confirm.")
      return
    }

    try {
      // 1. Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email!, currentPasswordForReauth)
      await reauthenticateWithCredential(user, credential)

      // 2. Update email in Firebase
      await updateEmail(user, newEmail)

      // 3. Update email in backend (if necessary for other features)
      await apiFetch("/api/v1/users/me", {
        method: "PUT",
        body: JSON.stringify({ email: newEmail }),
      })

      setCurrentEmail(newEmail)
      setIsEmailDialogOpen(false)
      refetchUserDetails() // Refresh user data in context
      toast.success("Email updated successfully!")
      setCurrentPasswordForReauth("") // Clear password field
    } catch (error: any) {
      console.error("Failed to update email:", error)
      let errorMessage = "Failed to update email."
      if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please re-enter your current password and try again. For security, this action requires recent authentication."
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid current password."
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use by another account."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "The new email address is not valid."
      }
      toast.error(errorMessage)
    }
  }

  const handlePasswordSave = async () => {
    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      toast.error("No authenticated user found.")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.")
      return
    }

    if (!currentPassword) {
      toast.error("Please enter your current password.")
      return
    }

    try {
      // 1. Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email!, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // 2. Update password in Firebase
      await updatePassword(user, newPassword)

      setIsPasswordDialogOpen(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password updated successfully!")
    } catch (error: any) {
      console.error("Failed to update password:", error)
      let errorMessage = "Failed to update password."
      if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please re-enter your current password and try again. For security, this action requires recent authentication."
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid current password."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "The new password is too weak. Please choose a stronger password."
      }
      toast.error(errorMessage)
    }
  }

  const handleTimezoneChange = async (value: string) => {
    try {
      await apiFetch("/api/v1/users/me", {
        method: "PUT",
        body: JSON.stringify({ timezone: value }),
      })
      setCurrentTimezone(value)
      refetchUserDetails() // Refresh user data in context
      toast.success("Timezone updated successfully!")
    } catch (error: any) {
      console.error("Failed to update timezone:", error)
      let errorMessage = "Failed to update timezone."
      if (error.response && error.response.status) {
        errorMessage = `Failed to update timezone: Server responded with status ${error.response.status}.`
      } else if (error.message) {
        errorMessage = `Failed to update timezone: ${error.message}.`
      }
      toast.error(errorMessage)
    }
  }

  const handleNotificationsToggle = async (enabled: boolean) => {
    try {
      await apiFetch("/api/v1/users/me", {
        method: "PUT",
        body: JSON.stringify({ notifications_enabled: enabled }),
      })
      setCurrentNotifications(enabled)
      refetchUserDetails() // Refresh user data in context
      toast.success("Notification settings updated!")
    } catch (error: any) {
      console.error("Failed to update notification settings:", error)
      let errorMessage = "Failed to update notification settings."
      if (error.response && error.response.status) {
        errorMessage = `Failed to update notification settings: Server responded with status ${error.response.status}.`
      } else if (error.message) {
        errorMessage = `Failed to update notification settings: ${error.message}.`
      }
      toast.error(errorMessage)
    }
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
                      <div>
                        <label className="block text-sm font-medium text-charcoal dark:text-gray-200 mb-2">
                          Current Password (for verification)
                        </label>
                        <Input
                          type="password"
                          value={currentPasswordForReauth}
                          onChange={(e) => setCurrentPasswordForReauth(e.target.value)}
                          placeholder="Enter your current password"
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
                  <TimezoneDisplay timezone={currentTimezone} />
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
