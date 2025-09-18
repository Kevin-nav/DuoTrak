"use client"

import { motion } from "framer-motion"
import { Users, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import MouseGlowEffect from "./mouse-glow-effect"

interface Partner {
  id: string
  username: string
  profilePicture: string
  initials: string
}

interface PartnerDisplayProps {
  partner: Partner | null
}

export default function PartnerDisplay({ partner }: PartnerDisplayProps) {
  const handleViewPartnerProfile = () => {
    if (partner) {
      // Navigate to Partner View page, defaulting to Partner's Day tab
      window.location.href = "/partner"
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-charcoal dark:text-gray-100 flex items-center">
          <Users className="w-5 h-5 mr-2 text-primary-blue" />
          Your Partner
        </h3>
      </div>

      {partner ? (
        <MouseGlowEffect glowColor="#19A1E5" intensity="medium">
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between p-4 bg-pearl-gray dark:bg-gray-700 rounded-xl border border-cool-gray dark:border-gray-600 hover:border-primary-blue dark:hover:border-primary-blue transition-all duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={partner.profilePicture || "/placeholder.svg"}
                  alt={`${partner.username}'s profile`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary-blue shadow-sm"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <p className="font-semibold text-charcoal dark:text-gray-100">{partner.username}</p>
                <p className="text-sm text-stone-gray dark:text-gray-300">Accountability Partner</p>
              </div>
            </div>

            <Button
              onClick={handleViewPartnerProfile}
              variant="outline"
              size="sm"
              className="text-primary-blue border-primary-blue hover:bg-primary-blue hover:text-white bg-transparent"
            >
              View Partner Profile
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>
        </MouseGlowEffect>
      ) : (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-stone-gray dark:text-gray-400 mx-auto mb-3 opacity-50" />
          <p className="text-stone-gray dark:text-gray-400 mb-2">No partner yet</p>
          <p className="text-sm text-stone-gray dark:text-gray-400 mb-4">
            Find an accountability partner to boost your motivation!
          </p>
          <Button className="bg-primary-blue hover:bg-primary-blue-hover text-white">Find a Partner</Button>
        </div>
      )}
    </motion.section>
  )
}
