"use client"

import { useRouter } from "next/navigation"
import EnhancedGoalCreationWizard from "@/components/onboarding/enhanced-goal-creation-wizard"

export default function CreateGoalPage() {
  const router = useRouter()

  const handleComplete = () => {
    router.push("/")
  }

  return <EnhancedGoalCreationWizard onComplete={handleComplete} />
}
