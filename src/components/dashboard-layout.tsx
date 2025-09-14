"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Home, Target, Users, User, Circle, TrendingUp } from 'lucide-react'
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import NotificationSystem from "./notification-system"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("home")

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "goals", label: "Goals", icon: Target, path: "/goals" },
    { id: "progress", label: "Progress", icon: TrendingUp, path: "/progress" },
    { id: "partner", label: "Partner", icon: Users, path: "/partner" },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
  ]

  // Update active tab based on current pathname
  useEffect(() => {
    const currentNav = navItems.find((item) => item.path === pathname)
    if (currentNav) {
      setActiveTab(currentNav.id)
    }
  }, [pathname])

  const handleNavigation = (item: (typeof navItems)[0]) => {
    setActiveTab(item.id)
    router.push(item.path)
  }

  const handleMarkAsRead = (notificationId: string) => {
    console.log("Mark as read:", notificationId)
  }

  const handleMarkAllAsRead = () => {
    console.log("Mark all as read")
  }

  const handleNotificationAction = (notificationId: string, action: string) => {
    console.log("Notification action:", notificationId, action)
  }

  const handleArchive = (notificationId: string) => {
    console.log("Archive notification:", notificationId)
  }

  const handleSnooze = (notificationId: string, duration: string) => {
    console.log("Snooze notification:", notificationId, duration)
  }

  const handleBulkAction = (notificationIds: string[], action: string) => {
    console.log("Bulk action:", action, notificationIds)
  }

  return (
    <div className="min-h-screen bg-[var(--theme-muted)] flex flex-col">
      {/* Top Navigation Bar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--theme-background)] border-b border-[var(--theme-border)] px-4 py-3"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo and Brand */}
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              <Circle className="w-8 h-8 text-[var(--theme-primary)] fill-current" />
              <Circle className="w-6 h-6 text-[var(--theme-primary)] fill-current absolute top-1 left-1 opacity-60" />
            </div>
            <h1 className="text-xl font-bold text-[var(--theme-foreground)]">DuoTrak</h1>
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
              onClick={() => router.push("/profile")}
              className="p-2 rounded-full bg-[var(--theme-primary)] hover:opacity-90 transition-opacity"
            >
              <User className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 pt-16 pb-20 px-4 bg-[var(--theme-muted)] overflow-y-auto"
      >
        <div className="max-w-4xl mx-auto py-6">{children}</div>
      </motion.main>

      {/* Bottom Navigation Bar */}
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--theme-background)] border-t border-[var(--theme-border)] px-4 py-2 shadow-lg"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigation(item)}
                whileHover={{
                  scale: 1.05,
                  y: -2,
                }}
                whileTap={{
                  scale: 0.95,
                  y: 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 17,
                }}
                className={`relative flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-300 ${
                  isActive
                    ? "text-[var(--theme-primary)]"
                    : "text-[var(--theme-secondary)] hover:text-[var(--theme-foreground)]"
                }`}
              >
                {/* Active Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeBackground"
                    className="absolute inset-0 bg-[var(--theme-accent)] rounded-lg"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}

                {/* Icon with bounce animation */}
                <motion.div
                  animate={
                    isActive
                      ? {
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.6,
                    ease: "easeInOut",
                  }}
                  className="relative z-10"
                >
                  <Icon className={`w-6 h-6 ${isActive ? "text-[var(--theme-primary)]" : ""}`} />
                </motion.div>

                {/* Label with slide up animation */}
                <motion.span
                  className={`text-xs font-medium relative z-10 ${isActive ? "text-[var(--theme-primary)]" : ""}`}
                  animate={isActive ? { y: [0, -2, 0] } : {}}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  {item.label}
                </motion.span>

                {/* Active dot indicator */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -bottom-1 w-1 h-1 bg-[var(--theme-primary)] rounded-full"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      delay: 0.2,
                    }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.nav>
    </div>
  )
}