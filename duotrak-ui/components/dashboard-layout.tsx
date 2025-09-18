"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Home, Target, Users, TrendingUp, User, Settings, Menu, X } from "lucide-react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeSwitcher } from "./theme/theme-switcher"
import NotificationSystem from "./notification-system"

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Partner", href: "/partner", icon: Users },
  { name: "Progress", href: "/progress", icon: TrendingUp },
  { name: "Profile", href: "/profile", icon: User },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const mockNotifications = [
    {
      id: "1",
      type: "task-verified" as const,
      title: "Task Verified ✅",
      message: "Your partner verified your completion of Morning Workout",
      timestamp: "5 minutes ago",
      read: false,
      partnerName: "John",
      taskName: "Morning Workout",
    },
  ]

  const handleNotificationAction = (id: string, action: string) => {
    console.log(`Notification ${id}: ${action}`)
  }

  const handleMarkAsRead = (id: string) => {
    console.log(`Mark as read: ${id}`)
  }

  const handleMarkAllAsRead = () => {
    console.log("Mark all as read")
  }

  const handleArchive = (id: string) => {
    console.log(`Archive: ${id}`)
  }

  const handleSnooze = (id: string, duration: string) => {
    console.log(`Snooze ${id} for ${duration}`)
  }

  const handleBulkAction = (ids: string[], action: string) => {
    console.log(`Bulk ${action}:`, ids)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : "-100%",
        }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border lg:translate-x-0 lg:static lg:inset-0"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-duo rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DT</span>
              </div>
              <span className="text-xl font-bold text-foreground">DuoTrak</span>
            </Link>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">You</p>
                  <p className="text-xs text-muted-foreground">Free Plan</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 border-b border-border">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center space-x-4">
            <NotificationSystem
              notifications={mockNotifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onNotificationAction={handleNotificationAction}
              onArchive={handleArchive}
              onSnooze={handleSnooze}
              onBulkAction={handleBulkAction}
            />
            <ThemeSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
