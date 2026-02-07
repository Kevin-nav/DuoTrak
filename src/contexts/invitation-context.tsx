"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface PartnerInfo {
  name: string
  email: string
  avatar?: string
  status: "pending" | "accepted" | "active"
}

interface GoalDraft {
  title: string
  description: string
  category: string
  frequency: string
}

interface InvitationContextType {
  partnerInfo: PartnerInfo | null
  goalDrafts: GoalDraft[]
  isFromInvitation: boolean
  invitationToken: string | null
  setPartnerInfo: (info: PartnerInfo) => void
  addGoalDraft: (draft: GoalDraft) => void
  removeGoalDraft: (index: number) => void;
  clearGoalDrafts: () => void
  setInvitationToken: (token: string) => void
  clearAllInvitationData: () => void
}

const InvitationContext = createContext<InvitationContextType | undefined>(undefined)

interface InvitationProviderProps {
  children: ReactNode
}

export function InvitationProvider({ children }: InvitationProviderProps) {
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null)
  const [goalDrafts, setGoalDrafts] = useState<GoalDraft[]>([])
  const [isFromInvitation, setIsFromInvitation] = useState(false)
  const [invitationToken, setInvitationToken] = useState<string | null>(null)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedPartnerInfo = localStorage.getItem("duotrak-partner-info")
    const savedGoalDrafts = localStorage.getItem("duotrak-goal-drafts")
    const savedInvitationToken = localStorage.getItem("duotrak-invitation-token")

    if (savedPartnerInfo) {
      try {
        setPartnerInfo(JSON.parse(savedPartnerInfo))
        setIsFromInvitation(true)
      } catch (error) {
        console.warn("Failed to load partner info:", error)
      }
    }

    if (savedGoalDrafts) {
      try {
        setGoalDrafts(JSON.parse(savedGoalDrafts))
      } catch (error) {
        console.warn("Failed to load goal drafts:", error)
      }
    }

    if (savedInvitationToken) {
      setInvitationToken(savedInvitationToken)
      setIsFromInvitation(true)
    }
  }, [])

  // Save partner info to localStorage
  useEffect(() => {
    if (partnerInfo) {
      localStorage.setItem("duotrak-partner-info", JSON.stringify(partnerInfo))
    }
  }, [partnerInfo])

  // Save goal drafts to localStorage
  useEffect(() => {
    localStorage.setItem("duotrak-goal-drafts", JSON.stringify(goalDrafts))
  }, [goalDrafts])

  // Save invitation token to localStorage
  useEffect(() => {
    if (invitationToken) {
      localStorage.setItem("duotrak-invitation-token", invitationToken)
    }
  }, [invitationToken])

  const addGoalDraft = (draft: GoalDraft) => {
    setGoalDrafts((prev) => [...prev, draft])
  }

  const removeGoalDraft = (index: number) => {
    setGoalDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const clearGoalDrafts = () => {
    setGoalDrafts([])
    localStorage.removeItem("duotrak-goal-drafts")
  }

  const handleSetInvitationToken = (token: string) => {
    setInvitationToken(token)
    setIsFromInvitation(true)
  }

  const contextValue: InvitationContextType = {
    partnerInfo,
    goalDrafts,
    isFromInvitation,
    invitationToken,
    setPartnerInfo,
    addGoalDraft,
    removeGoalDraft,
    clearGoalDrafts,
    setInvitationToken: handleSetInvitationToken,
    clearAllInvitationData: () => {
      setPartnerInfo(null)
      setGoalDrafts([])
      setInvitationToken(null)
      setIsFromInvitation(false)
      localStorage.removeItem("duotrak-partner-info")
      localStorage.removeItem("duotrak-goal-drafts")
      localStorage.removeItem("duotrak-invitation-token")
      localStorage.removeItem("inviterOnboardingStep")
    }
  }

  return <InvitationContext.Provider value={contextValue}>{children}</InvitationContext.Provider>
}

export function useInvitation() {
  const context = useContext(InvitationContext)
  if (context === undefined) {
    throw new Error("useInvitation must be used within an InvitationProvider")
  }
  return context
}
