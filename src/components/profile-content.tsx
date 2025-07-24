"use client"

import { motion } from "framer-motion"
import ProfileHeader from "./profile-header"
import ProgressSnapshot from "./progress-snapshot"
import PartnerDisplay from "./partner-display"
import AccountSettings from "./account-settings"
import SupportSection from "./support-section"
import { useUser } from "@/contexts/UserContext"
import { Loader2 } from "lucide-react"

export default function ProfileContent() {
  const { userDetails: user, isLoading } = useUser()

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Prepare partner data for PartnerDisplay
  const partnerData = user.partner_id
    ? {
        id: user.partner_id,
        username: user.partner_full_name || "Partner",
        profilePicture: "/placeholder.svg?height=60&width=60", // Placeholder for now
        initials: user.partner_full_name?.charAt(0) || "P",
      }
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="space-y-8"
    >
      {/* Profile Header */}
      <ProfileHeader
        username={user.full_name || user.email}
        profilePicture={user.profile_picture_url || "/placeholder.svg?height=120&width=120"}
        bio={user.bio || ""}
        currentStreak={user.current_streak}
      />

      {/* Progress Snapshot */}
      <ProgressSnapshot
        longestStreak={user.longest_streak}
        totalTasksCompleted={user.total_tasks_completed}
        goalsConquered={user.goals_conquered}
        badges={user.badges.map(ub => ({ ...ub.badge, earned: ub.earned_at }))}
      />

      {/* Partner Display */}
      <PartnerDisplay partner={partnerData} />

      {/* Account Settings */}
      <AccountSettings
        email={user.email}
        timezone={user.timezone}
        notificationsEnabled={user.notifications_enabled}
      />

      {/* Support Section */}
      <SupportSection />
    </motion.div>
  )
}
