"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export default function CreateGoalLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="w-16 h-16 mx-auto"
        >
          <Sparkles className="w-16 h-16 text-blue-500" />
        </motion.div>
        <h2 className="text-xl font-semibold text-gray-900">Preparing your goal creation wizard...</h2>
        <p className="text-gray-600">Getting everything ready for you and your partner</p>
      </div>
    </div>
  )
}
