"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import InteractiveWaitingRoom from "@/components/onboarding/interactive-waiting-room"
import { useInvitation } from "@/contexts/invitation-context"

export default function WaitingRoomPage() {
  const router = useRouter()
  const { partnershipStatus } = useInvitation()

  useEffect(() => {
    // Redirect if partnership is confirmed
    if (partnershipStatus === "confirmed" || partnershipStatus === "active") {
      router.push("/auth/partnership-confirmation")
    }
  }, [partnershipStatus, router])

  return <InteractiveWaitingRoom />
}
