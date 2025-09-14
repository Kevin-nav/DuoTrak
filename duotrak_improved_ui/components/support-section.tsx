"use client"

import { motion } from "framer-motion"
import { HelpCircle, Shield, FileText, LogOut, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
import MouseGlowEffect from "./mouse-glow-effect"

export default function SupportSection() {
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const handleLogout = () => {
    // Handle logout logic here
    console.log("User logged out")
    setIsLogoutDialogOpen(false)
    // Redirect to login page
    window.location.href = "/login"
  }

  const supportLinks = [
    {
      label: "Help & Support",
      icon: HelpCircle,
      href: "/help",
      description: "Get help with using DuoTrak",
    },
    {
      label: "Privacy Policy",
      icon: Shield,
      href: "/privacy",
      description: "Learn how we protect your data",
    },
    {
      label: "Terms of Service",
      icon: FileText,
      href: "/terms",
      description: "Read our terms and conditions",
    },
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
    >
      <div className="flex items-center mb-6">
        <Info className="w-5 h-5 mr-2 text-primary-blue" />
        <h3 className="text-xl font-bold text-charcoal dark:text-gray-100">Support & About</h3>
      </div>

      <div className="space-y-4">
        {/* Support Links */}
        {supportLinks.map((link, index) => {
          const Icon = link.icon
          return (
            <MouseGlowEffect key={link.label} glowColor="#19A1E5" intensity="low">
              <motion.a
                href={link.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="flex items-center justify-between p-4 bg-pearl-gray dark:bg-gray-700 rounded-xl border border-cool-gray dark:border-gray-600 hover:border-primary-blue dark:hover:border-primary-blue transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 text-stone-gray dark:text-gray-400 group-hover:text-primary-blue transition-colors" />
                  <div>
                    <p className="font-medium text-charcoal dark:text-gray-100">{link.label}</p>
                    <p className="text-sm text-stone-gray dark:text-gray-300">{link.description}</p>
                  </div>
                </div>
              </motion.a>
            </MouseGlowEffect>
          )
        })}

        {/* App Version */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center p-4 bg-pearl-gray dark:bg-gray-700 rounded-xl border border-cool-gray dark:border-gray-600"
        >
          <p className="text-sm text-stone-gray dark:text-gray-300">
            <span className="font-medium">DuoTrak</span> v1.0.0
          </p>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-4 border-t border-cool-gray dark:border-gray-600"
        >
          <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full text-error-red border-error-red hover:bg-error-red hover:text-white transition-colors bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Logout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-stone-gray dark:text-gray-300">
                  Are you sure you want to log out of DuoTrak? You'll need to sign in again to access your account.
                </p>
                <div className="flex space-x-2 justify-end">
                  <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleLogout} className="bg-error-red hover:bg-error-red/90 text-white">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </motion.section>
  )
}
