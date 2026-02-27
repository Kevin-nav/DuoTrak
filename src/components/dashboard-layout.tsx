"use client"

import type React from "react"
import { motion } from "framer-motion"

interface DashboardLayoutProps {
  children: React.ReactNode;
  maxWidthClass?: string;
}

export default function DashboardLayout({ children, maxWidthClass = "max-w-4xl" }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--theme-muted)] font-sans text-[var(--theme-foreground)]">
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="px-3 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8"
      >
        <div className={`mx-auto w-full py-3 sm:py-6 ${maxWidthClass}`}>{children}</div>
      </motion.main>
    </div>
  )
}
