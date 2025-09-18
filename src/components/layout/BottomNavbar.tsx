"use client"

import { motion } from "framer-motion"
import { Home, Target, Users, User, TrendingUp } from 'lucide-react'
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function BottomNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState("home")

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/dashboard" },
    { id: "goals", label: "Goals", icon: Target, path: "/goals" },
    { id: "progress", label: "Progress", icon: TrendingUp, path: "/progress" },
    { id: "partner", label: "Partner", icon: Users, path: "/partner" },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
  ]

  useEffect(() => {
    const currentNav = navItems.find((item) => pathname.startsWith(item.path))
    if (currentNav) {
      setActiveTab(currentNav.id)
    }
  }, [pathname])

  const handleNavigation = (item: (typeof navItems)[0]) => {
    setActiveTab(item.id)
    router.push(item.path)
  }

  return (
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

              <motion.span
                className={`text-xs font-medium relative z-10 ${isActive ? "text-[var(--theme-primary)]" : ""}`}
                animate={isActive ? { y: [0, -2, 0] } : {}}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {item.label}
              </motion.span>

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
  )
}