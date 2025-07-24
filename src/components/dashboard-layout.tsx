"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Home, Target, Users, TrendingUp, User, Circle } from "lucide-react"
import { useState } from "react"
import NotificationSystem from "./notification-system"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState("home")

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "goals", label: "Goals", icon: Target },
    { id: "partner", label: "Partner", icon: Users },
    { id: "progress", label: "Progress", icon: TrendingUp },
  ]

  const handleMarkAsRead = (notificationId: string) => {
    console.log("Mark as read:", notificationId)
    // Handle mark as read logic
  }

  const handleMarkAllAsRead = () => {
    console.log("Mark all as read")
    // Handle mark all as read logic
  }

  const handleNotificationAction = (notificationId: string, action: string) => {
    console.log("Notification action:", notificationId, action)
    // Handle notification action logic
  }

  const handleArchive = (notificationId: string) => {
    console.log("Archive notification:", notificationId)
    // Handle archive logic
  }

  const handleSnooze = (notificationId: string, duration: string) => {
    console.log("Snooze notification:", notificationId, duration)
    // Handle snooze logic
  }

  const handleBulkAction = (notificationIds: string[], action: string) => {
    console.log("Bulk action:", action, notificationIds)
    // Handle bulk action logic
  }

  return (
    <div className="min-h-screen bg-off-white dark:bg-gray-950 flex flex-col">
      {/* Top Navigation Bar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-cool-gray dark:border-gray-700 px-4 py-3"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo and Brand */}
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              <Circle className="w-8 h-8 text-primary-blue fill-current" />
              <Circle className="w-6 h-6 text-primary-blue fill-current absolute top-1 left-1 opacity-60" />
            </div>
            <h1 className="text-xl font-bold text-charcoal dark:text-gray-100">DuoTrak</h1>
          </motion.div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-3">
            <NotificationSystem
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onNotificationAction={handleNotificationAction}
              onArchive={handleArchive}
              onSnooze={handleSnooze}
              onBulkAction={handleBulkAction}
            />

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => (window.location.href = "/profile")}
              className="p-1 rounded-full bg-primary-blue hover:bg-primary-blue-hover transition-colors"
            >
              <User className="w-6 h-6 text-white" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 pt-16 pb-20 px-4 bg-pearl-gray dark:bg-gray-900 overflow-y-auto"
      >
        <div className="max-w-4xl mx-auto py-6">{children}</div>
      </motion.main>

      {/* Bottom Navigation Bar */}
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-cool-gray dark:border-gray-700 px-4 py-2"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-accent-light-blue dark:bg-primary-blue/20 text-primary-blue"
                    : "text-stone-gray dark:text-gray-400 hover:text-charcoal dark:hover:text-gray-200 hover:bg-pearl-gray dark:hover:bg-gray-800"
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? "text-primary-blue" : ""}`} />
                <span className={`text-xs font-medium ${isActive ? "text-primary-blue" : ""}`}>{item.label}</span>
              </motion.button>
            )
          })}
        </div>
      </motion.nav>
    </div>
  )
}
