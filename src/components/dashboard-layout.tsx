"use client"

import type React from "react"
import { motion } from "framer-motion"
import Image from 'next/image';
import { Home, Target, Users, User, Circle, TrendingUp, BookOpenText } from 'lucide-react'
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
    { id: "journal", label: "Journal", icon: BookOpenText, path: "/journal" },
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

  return (
    <div className="min-h-screen bg-[var(--theme-muted)] flex flex-col font-sans text-[var(--theme-foreground)]">
      {/* Top Navigation Bar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 bg-[var(--theme-background)]/80 backdrop-blur-md border-b border-[var(--theme-border)] px-4 py-3"
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo and Brand */}
          <motion.div
            className="flex items-center space-x-3 cursor-pointer"
            whileHover={{ opacity: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={() => router.push("/")}
          >
            {/* Logo placeholder - ensure it looks good on beige */}
            <div className="w-8 h-8 rounded-lg bg-[var(--theme-primary)] flex items-center justify-center text-white font-bold text-sm">
              DT
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--theme-foreground)]">DuoTrak</h1>
          </motion.div>

          {/* Right Side Icons */}
          <div className="flex items-center space-x-4">
            <NotificationSystem />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => router.push("/profile")}
              className="p-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-background)] hover:bg-[var(--theme-muted)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--theme-primary)] flex items-center justify-center text-[var(--theme-primary-foreground)]">
                <User className="w-4 h-4" />
              </div>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content Area */}
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 pt-20 pb-24 px-4 bg-[var(--theme-muted)] overflow-y-auto"
      >
        <div className="max-w-4xl mx-auto py-6">{children}</div>
      </motion.main>

      {/* Bottom Navigation Bar */}
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--theme-background)]/90 backdrop-blur-lg border-t border-[var(--theme-border)] px-4 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
      >
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`relative flex h-14 min-w-0 flex-1 flex-col items-center justify-center space-y-1 rounded-xl transition-all duration-300 ${isActive
                    ? "text-[var(--theme-primary)]"
                    : "text-[var(--theme-muted-foreground)] hover:text-[var(--theme-foreground)] hover:bg-[var(--theme-secondary)]"
                  }`}
              >
                {/* Active Indicator - Subtle Dot */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-[var(--theme-accent)] rounded-xl -z-10"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}

                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-colors duration-300 ${isActive ? "text-[var(--theme-primary)]" : "text-[var(--theme-muted-foreground)]"}`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />

                  {/* Active Dot */}
                  {isActive && (
                    <motion.div
                      layoutId="activeDot"
                      className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[var(--theme-primary)] rounded-full"
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>

                <span className={`whitespace-nowrap text-[11px] leading-none ${isActive ? "text-[var(--theme-primary)]" : ""}`}>
                  {item.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.nav>
    </div>
  )
}
