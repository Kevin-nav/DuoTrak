"use client"

import DashboardLayout from "@/components/dashboard-layout"
import ProgressPage from "@/components/progress/progress-page"
import XPSystem from "@/components/xp/xp-system"
import { useState } from "react"

export default function Progress() {
  const [showXPSystem, setShowXPSystem] = useState(true)

  // Mock XP data
  const mockXPData = {
    userXP: {
      currentXP: 2450,
      currentLevel: 12,
      xpToNextLevel: 150,
      totalXP: 2450,
      weeklyXP: 340,
      dailyXP: 85
    },
    partnerXP: {
      currentXP: 2180,
      currentLevel: 11,
      totalXP: 2180,
      weeklyXP: 290,
      dailyXP: 65
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* XP System */}
        {showXPSystem && (
          <XPSystem 
            userXP={mockXPData.userXP}
            partnerXP={mockXPData.partnerXP}
            showComparison={true}
            partnerName="Alex"
          />
        )}
        
        {/* Progress Page */}
        <ProgressPage />
      </div>
    </DashboardLayout>
  )
}
