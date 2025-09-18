"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import InvitationLanding from "@/components/invitation/invitation-landing"
import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface InvitationData {
  inviterName: string
  inviterAvatar?: string
  goalTitle?: string
  goalDescription?: string
  goalDuration?: number
  isValid: boolean
  isExpired: boolean
}

// Safe string utility
const safeString = (value: any): string => {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  return String(value)
}

export default function InvitationPage() {
  const router = useRouter()
  const params = useParams()

  // Safely extract token
  const token = (() => {
    try {
      const rawToken = params.token
      if (Array.isArray(rawToken)) {
        return safeString(rawToken[0])
      }
      return safeString(rawToken)
    } catch (error) {
      console.error("Error extracting token:", error)
      return ""
    }
  })()

  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvitationData = async () => {
      try {
        if (!token) {
          throw new Error("Invalid invitation token")
        }

        // Simulate API call to fetch invitation data
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data - replace with actual API call
        const mockData: InvitationData = {
          inviterName: "Alex Johnson",
          inviterAvatar: "/diverse-group.png",
          goalTitle: "30-Day Fitness Challenge",
          goalDescription: "Let's get fit together with daily workouts and healthy habits!",
          goalDuration: 30,
          isValid: true,
          isExpired: false,
        }

        setInvitationData(mockData)
      } catch (err) {
        console.error("Error fetching invitation:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to load invitation details"
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitationData()
  }, [token])

  const handleAccept = async () => {
    try {
      if (!token || !invitationData) {
        throw new Error("Invalid invitation data")
      }

      // Store invitation token in session/localStorage for auth flow
      try {
        sessionStorage.setItem("invitation_token", token)
        sessionStorage.setItem("invitation_data", JSON.stringify(invitationData))
      } catch (storageError) {
        console.warn("Failed to store invitation data:", storageError)
        // Continue anyway - the token in URL should be sufficient
      }

      // Redirect to signup/login with invitation context
      const encodedToken = encodeURIComponent(token)
      router.push(`/auth/signup?invitation=${encodedToken}`)
    } catch (error) {
      console.error("Failed to accept invitation:", error)
      setError("Failed to accept invitation. Please try again.")
    }
  }

  const handleDecline = () => {
    try {
      // Clear any stored invitation data
      try {
        sessionStorage.removeItem("invitation_token")
        sessionStorage.removeItem("invitation_data")
      } catch (storageError) {
        console.warn("Failed to clear invitation data:", storageError)
      }

      // Redirect to landing page
      router.push("/landing")
    } catch (error) {
      console.error("Error declining invitation:", error)
      // Still redirect even if there's an error
      window.location.href = "/landing"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading invitation...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !invitationData || !invitationData.isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {invitationData?.isExpired ? "Invitation Expired" : "Invalid Invitation"}
              </h2>
              <p className="text-gray-600 mb-6">
                {invitationData?.isExpired
                  ? "This invitation has expired. Please ask your partner to send a new one."
                  : error || "This invitation link is not valid or has been used already."}
              </p>
              <button
                onClick={() => router.push("/landing")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Go to DuoTrak
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <InvitationLanding
      inviterName={invitationData.inviterName}
      inviterAvatar={invitationData.inviterAvatar}
      goalTitle={invitationData.goalTitle}
      goalDescription={invitationData.goalDescription}
      goalDuration={invitationData.goalDuration}
      invitationToken={token}
      onAccept={handleAccept}
      onDecline={handleDecline}
    />
  )
}
