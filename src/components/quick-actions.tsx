"use client"

import { motion, Variants } from "framer-motion"
import { Plus, List, TrendingUp, MessageCircle, UserPlus, BookOpenText, Share2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface QuickActionsProps {
  hasPartner?: boolean
}

export default function QuickActions({ hasPartner = false }: QuickActionsProps) {
  const router = useRouter()
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4,
      },
    },
  }

  const itemVariants: Variants = {
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

  const buttonVariants: Variants = {
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
      path: "/goals/new",
    },
    {
      id: "view-goals",
      label: "View All Goals",
      icon: List,
      description: "See all your active goals",
      path: "/goals",
    },
    {
      id: "view-progress",
      label: "View Progress",
      icon: TrendingUp,
      description: "Check your overall progress and analytics",
      path: "/progress",
    },
    {
      id: "partner-chat",
      label: hasPartner ? "Open Partner Chat" : "Invite a Partner",
      icon: hasPartner ? MessageCircle : UserPlus,
      description: hasPartner ? "Jump into full-screen chat instantly" : "Add a partner to unlock duo chat",
      path: hasPartner ? "/partner/chat" : "/invite-partner",
    },
    {
      id: "journal-write",
      label: "Write Journal Entry",
      icon: BookOpenText,
      description: "Capture today's reflection quickly",
      path: "/journal",
    },
    {
      id: "journal-share",
      label: "Share Reflection",
      icon: Share2,
      description: "Open private journal and share with partner",
      path: "/journal",
    },
  ]

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
    >
      <motion.h2 variants={itemVariants} className="text-xl font-bold text-charcoal dark:text-gray-100 mb-6">
        Quick Actions
      </motion.h2>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.button
              key={action.id}
              onClick={() => router.push(action.path)}
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{
                scale: 1.02,
                boxShadow: "0 4px 12px rgba(25, 161, 229, 0.15)",
              }}
              whileTap={{ scale: 0.98 }}
              className="group bg-primary-blue hover:bg-primary-blue-hover text-white p-4 rounded-lg font-medium transition-all duration-200 text-left"
            >
              <div className="flex items-start space-x-3">
                <motion.div whileHover={{ rotate: 5 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-1 group-hover:text-white transition-colors">{action.label}</p>
                  <p className="text-white/80 text-xs leading-relaxed">{action.description}</p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Additional Quick Action - Emergency/Priority */}
      <motion.div variants={itemVariants} className="mt-4 pt-4 border-t border-cool-gray dark:border-gray-600">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full bg-accent-light-blue dark:bg-primary-blue/10 hover:bg-primary-blue/10 dark:hover:bg-primary-blue/20 text-primary-blue border border-primary-blue/20 dark:border-primary-blue/30 p-3 rounded-lg font-medium transition-all duration-200 text-sm"
        >
          Need help? Contact Support
        </motion.button>
      </motion.div>
    </motion.section>
  )
}
