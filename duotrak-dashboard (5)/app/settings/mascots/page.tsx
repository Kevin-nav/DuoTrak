"use client"

import DashboardLayout from "@/components/dashboard-layout"
import MascotSettingsPanel from "@/components/mascots/mascot-settings-panel"

export default function MascotSettingsPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[var(--theme-background)] pt-16 pb-20">
        <MascotSettingsPanel />
      </div>
    </DashboardLayout>
  )
}
