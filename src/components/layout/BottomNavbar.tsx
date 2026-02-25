"use client"

import { motion } from "framer-motion"
import { Home, Target, Users, User, TrendingUp, BookOpenText } from 'lucide-react'
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
    { id: "journal", label: "Journal", icon: BookOpenText, path: "/journal" },
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
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--theme-border)] bg-[var(--theme-card)]/95 px-2 py-1.5 shadow-lg backdrop-blur-md sm:px-4 sm:py-2"
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-0.5 sm:justify-around">
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
              className={`relative flex min-w-0 flex-1 flex-col items-center space-y-0.5 rounded-lg px-1.5 py-1.5 transition-all duration-300 sm:flex-none sm:space-y-1 sm:px-3 sm:py-2 ${
                isActive
                  ? "text-[var(--theme-primary-foreground)]"
                  : "text-[var(--theme-muted-foreground)] hover:bg-[var(--theme-muted)] hover:text-[var(--theme-foreground)]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeBackground"
                  className="absolute inset-0 rounded-lg bg-[var(--theme-primary)]"
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
                <Icon
                  className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    isActive ? "text-[var(--theme-primary-foreground)]" : "text-[var(--theme-muted-foreground)]"
                  }`}
                />
              </motion.div>

              <motion.span
                className={`relative z-10 truncate text-[10px] font-medium leading-tight sm:text-xs ${
                  isActive ? "text-[var(--theme-primary-foreground)]" : "text-[var(--theme-muted-foreground)]"
                }`}
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
                  className="absolute -bottom-1 h-1 w-1 rounded-full bg-[var(--theme-primary-foreground)]"
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
