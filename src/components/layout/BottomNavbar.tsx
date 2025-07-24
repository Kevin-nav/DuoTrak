"use client"

import { motion } from "framer-motion"
import { Home, Target, Users, TrendingUp } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { id: "dashboard", href: "/dashboard", label: "Home", icon: Home },
  { id: "goals", href: "/goals", label: "Goals", icon: Target },
  { id: "partner", href: "/partner", label: "Partner", icon: Users },
  { id: "progress", href: "/progress", label: "Progress", icon: TrendingUp },
]

export default function BottomNavbar() {
  const pathname = usePathname()

  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 px-4 py-2"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link href={item.href} key={item.id} className="flex-1">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? "text-primary-blue"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? "text-primary-blue" : ""}`} />
                <span className={`text-xs font-medium ${isActive ? "font-semibold" : ""}`}>{item.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}

