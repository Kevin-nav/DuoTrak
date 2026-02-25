"use client"

import type React from "react"
import { motion } from "framer-motion"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--theme-muted)] font-sans text-[var(--theme-foreground)]">
      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="px-4 pb-24 pt-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto w-full max-w-4xl py-6">{children}</div>
      </motion.main>
    </div>
  )
}
