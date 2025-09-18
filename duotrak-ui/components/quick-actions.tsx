"use client"

import { motion } from "framer-motion"
import { Plus, List, TrendingUp } from "lucide-react"

export default function QuickActions() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  }

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  }

  const actions = [
    {
      id: "create-goal",
      label: "Create New Shared Goal",
      icon: Plus,
      description: "Start a new goal with your partner",
    },
    {
      id: "view-goals",
      label: "View All Goals",
      icon: List,
      description: "See all your active goals",
    },
    {
      id: "view-progress",
      label: "View Progress",
      icon: TrendingUp,
      description: "Check your overall progress and analytics",
    },
  ]

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-card rounded-xl p-6 shadow-sm border border-border"
    >
      <motion.h2 variants={itemVariants} className="text-xl font-bold text-foreground mb-6">
        Quick Actions
      </motion.h2>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.id}
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 4px 12px hsl(var(--primary) / 0.15)",
              }}
              whileTap={{ scale: 0.98 }}
              className="group bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-lg font-medium transition-all duration-200 text-left"
            >
              <div className="flex items-start space-x-3">
                <motion.div whileHover={{ rotate: 5 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-1 group-hover:text-primary-foreground transition-colors">
                    {action.label}
                  </p>
                  <p className="text-primary-foreground/80 text-xs leading-relaxed">{action.description}</p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Additional Quick Action - Emergency/Priority */}
      <motion.div variants={itemVariants} className="mt-4 pt-4 border-t border-border">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 p-3 rounded-lg font-medium transition-all duration-200 text-sm"
        >
          Need help? Contact Support
        </motion.button>
      </motion.div>
    </motion.section>
  )
}
