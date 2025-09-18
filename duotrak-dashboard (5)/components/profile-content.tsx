"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Settings, Palette, Bell, Shield, HelpCircle, LogOut, Edit3, Camera, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeSwitcher } from "./theme/theme-switcher"

export default function ProfileContent() {
  const [user] = useState({
    id: "user-1",
    username: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    profilePicture: "/placeholder.svg?height=120&width=120",
    bio: "Always striving for better! 💪",
    currentStreak: 25,
    longestStreak: 120,
    totalTasksCompleted: 500,
    goalsConquered: 5,
    timezone: "America/New_York",
    notificationsEnabled: true,
    badges: [
      { id: "1", name: "Week Warrior", icon: "🏆", description: "Completed 7 days in a row", earned: "2024-01-15" },
      { id: "2", name: "Century Club", icon: "💯", description: "Reached 100-day streak", earned: "2024-01-10" },
      { id: "3", name: "Goal Getter", icon: "🎯", description: "Completed 5 goals", earned: "2024-01-05" },
      {
        id: "4",
        name: "Team Player",
        icon: "🤝",
        description: "Helped partner achieve milestone",
        earned: "2024-01-01",
      },
      { id: "5", name: "Consistency King", icon: "👑", description: "30 days without missing", earned: "2023-12-25" },
    ],
    partner: {
      id: "partner-1",
      username: "John Doe",
      profilePicture: "/placeholder.svg?height=60&width=60",
      initials: "JD",
    },
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Profile Header */}
      <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-[var(--theme-primary)]">
                <AvatarImage src={user.profilePicture || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl font-bold bg-[var(--theme-accent)] text-[var(--theme-foreground)]">
                  {user.username
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]"
              >
                <Camera className="w-4 h-4 text-white" />
              </Button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
                <h1 className="text-2xl font-bold text-[var(--theme-foreground)]">{user.username}</h1>
                <Button variant="ghost" size="sm">
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[var(--theme-secondary)] mb-3">{user.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge variant="secondary" className="bg-[var(--theme-accent)] text-[var(--theme-foreground)]">
                  🔥 {user.currentStreak} Day Streak
                </Badge>
                <Badge variant="secondary" className="bg-[var(--theme-accent)] text-[var(--theme-foreground)]">
                  🎯 {user.goalsConquered} Goals Completed
                </Badge>
                <Badge variant="secondary" className="bg-[var(--theme-accent)] text-[var(--theme-foreground)]">
                  👥 Partnered
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Snapshot */}
      <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-foreground)]">Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--theme-primary)]">{user.currentStreak}</div>
              <div className="text-sm text-[var(--theme-secondary)]">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--theme-primary)]">{user.longestStreak}</div>
              <div className="text-sm text-[var(--theme-secondary)]">Longest Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--theme-primary)]">{user.totalTasksCompleted}</div>
              <div className="text-sm text-[var(--theme-secondary)]">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--theme-primary)]">{user.goalsConquered}</div>
              <div className="text-sm text-[var(--theme-secondary)]">Goals Conquered</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--theme-foreground)]">
            <Palette className="w-5 h-5 text-[var(--theme-primary)]" />
            Theme & Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--theme-foreground)]">Customize Theme</h3>
              <p className="text-sm text-[var(--theme-secondary)]">
                Choose your preferred theme and sync with your partner
              </p>
            </div>
            <ThemeSwitcher />
          </div>
        </CardContent>
      </Card>

      {/* Settings & Preferences */}
      <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-foreground)] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--theme-primary)]" />
            Settings & Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Notifications */}
          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-[var(--theme-muted)] transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--theme-accent)]">
                <Bell className="w-5 h-5 text-[var(--theme-primary)]" />
              </div>
              <div>
                <h3 className="font-medium text-[var(--theme-foreground)]">Notifications</h3>
                <p className="text-sm text-[var(--theme-secondary)]">Manage your notification preferences</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch defaultChecked={user.notificationsEnabled} />
            </div>
          </div>

          <Separator />

          {/* Privacy & Security */}
          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-[var(--theme-muted)] transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--theme-accent)]">
                <Shield className="w-5 h-5 text-[var(--theme-primary)]" />
              </div>
              <div>
                <h3 className="font-medium text-[var(--theme-foreground)]">Privacy & Security</h3>
                <p className="text-sm text-[var(--theme-secondary)]">Control your privacy settings</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-[var(--theme-primary)] hover:bg-[var(--theme-accent)]">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Separator />

          {/* Help & Support */}
          <div className="flex items-center justify-between p-4 rounded-lg hover:bg-[var(--theme-muted)] transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--theme-accent)]">
                <HelpCircle className="w-5 h-5 text-[var(--theme-primary)]" />
              </div>
              <div>
                <h3 className="font-medium text-[var(--theme-foreground)]">Help & Support</h3>
                <p className="text-sm text-[var(--theme-secondary)]">Get help and contact support</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-[var(--theme-primary)] hover:bg-[var(--theme-accent)]">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Partner Information */}
      <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--theme-foreground)]">Partner Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.partner.profilePicture || "/placeholder.svg"} />
              <AvatarFallback className="bg-[var(--theme-accent)] text-[var(--theme-foreground)]">
                {user.partner.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium text-[var(--theme-foreground)]">{user.partner.username}</h3>
              <p className="text-sm text-[var(--theme-secondary)]">Connected partner</p>
            </div>
            <Button variant="outline" size="sm">
              View Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="pt-4"
      >
        <Button
          variant="outline"
          className="w-full flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 bg-transparent"
          onClick={() => console.log("Sign out")}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </motion.div>
    </motion.div>
  )
}
