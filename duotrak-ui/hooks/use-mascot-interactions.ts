"use client"

import { useCallback } from "react"
import { useMascot } from "@/contexts/mascot-context"
import type { MascotInteraction } from "@/types/mascot"

export function useMascotInteractions() {
  const { showInteraction } = useMascot()

  // Goal Creation Flow Interactions
  const showGoalCreationWelcome = useCallback(() => {
    const interaction: MascotInteraction = {
      id: "goal-creation-welcome",
      type: "both",
      context: "motivation",
      expression: "excited",
      pose: "lightbulb",
      message: "Ready to create something amazing together? We're here to help you every step of the way! 🌟",
      priority: "medium",
      frequency: "daily",
      position: "top-center",
      duration: 6000,
      autoHide: true,
      showCloseButton: true,
    }
    return showInteraction(interaction)
  }, [showInteraction])

  const showTemplateSelection = useCallback(() => {
    const interaction: MascotInteraction = {
      id: "template-selection-help",
      type: "both",
      context: "motivation",
      expression: "supportive",
      pose: "lightbulb",
      message: "Pick a template that excites you both! You can always customize it to make it perfect. 💡",
      priority: "low",
      frequency: "once",
      position: "bottom-right",
      duration: 5000,
      autoHide: true,
      showCloseButton: true,
    }
    return showInteraction(interaction)
  }, [showInteraction])

  const showCustomizationTips = useCallback(() => {
    const interaction: MascotInteraction = {
      id: "customization-tips",
      type: "both",
      context: "teamwork",
      expression: "encouraging",
      pose: "hugging",
      message: "Make it yours! The best goals are the ones that truly matter to both of you. 🤝",
      priority: "low",
      frequency: "once",
      position: "top-right",
      duration: 5000,
      autoHide: true,
      showCloseButton: true,
    }
    return showInteraction(interaction)
  }, [showInteraction])

  const showGoalCreationSuccess = useCallback(() => {
    const interaction: MascotInteraction = {
      id: "goal-creation-success",
      type: "both",
      context: "celebration",
      expression: "celebratory",
      pose: "party",
      message: "🎉 Fantastic! Your first shared goal is ready! We can't wait to celebrate your wins together!",
      priority: "high",
      frequency: "unlimited",
      position: "center",
      duration: 8000,
      autoHide: false,
      showCloseButton: true,
    }
    return showInteraction(interaction)
  }, [showInteraction])

  // Dashboard Interactions
  const showWelcomeBack = useCallback(() => {
    const interaction: MascotInteraction = {
      id: "welcome-back",
      type: "both",
      context: "motivation",
      expression: "happy",
      pose: "lightbulb",
      message: "Welcome back! Ready to make today amazing? Your goals are waiting for you! ✨",
      priority: "medium",
      frequency: "daily",
      position: "top-right",
      duration: 6000,
      autoHide: true,
      showCloseButton: true,
    }
    return showInteraction(interaction)
  }, [showInteraction])

  const showStreakCelebration = useCallback(
    (streakCount: number) => {
      const interaction: MascotInteraction = {
        id: `streak-celebration-${streakCount}`,
        type: "both",
        context: "streak",
        expression: "celebratory",
        pose: "high-five",
        message: `🔥 ${streakCount} days strong! You two are absolutely crushing it! Keep that fire burning!`,
        priority: "high",
        frequency: "unlimited",
        position: "center",
        duration: 7000,
        autoHide: true,
        showCloseButton: true,
      }
      return showInteraction(interaction)
    },
    [showInteraction],
  )

  const showTaskCompletion = useCallback(
    (taskName: string) => {
      const interaction: MascotInteraction = {
        id: `task-completion-${Date.now()}`,
        type: "both",
        context: "celebration",
        expression: "excited",
        pose: "party",
        message: `Great job completing "${taskName}"! Every step forward is worth celebrating! 🎉`,
        priority: "medium",
        frequency: "unlimited",
        position: "bottom-right",
        duration: 5000,
        autoHide: true,
        showCloseButton: true,
      }
      return showInteraction(interaction)
    },
    [showInteraction],
  )

  const showPartnerActivity = useCallback(
    (partnerName: string, activity: string) => {
      const interaction: MascotInteraction = {
        id: `partner-activity-${Date.now()}`,
        type: "both",
        context: "teamwork",
        expression: "supportive",
        pose: "hugging",
        message: `${partnerName} just ${activity}! You're both doing amazing work together! 🤝`,
        priority: "medium",
        frequency: "unlimited",
        position: "top-center",
        duration: 5000,
        autoHide: true,
        showCloseButton: true,
      }
      return showInteraction(interaction)
    },
    [showInteraction],
  )

  const showProgressMilestone = useCallback(
    (milestone: string) => {
      const interaction: MascotInteraction = {
        id: `progress-milestone-${Date.now()}`,
        type: "both",
        context: "progress",
        expression: "excited",
        pose: "chart",
        message: `Milestone reached: ${milestone}! Look how far you've come together! 📈`,
        priority: "high",
        frequency: "unlimited",
        position: "center",
        duration: 7000,
        autoHide: true,
        showCloseButton: true,
      }
      return showInteraction(interaction)
    },
    [showInteraction],
  )

  const showMotivationalReminder = useCallback(() => {
    const motivationalMessages = [
      "Remember: small steps lead to big changes! You've got this! 💪",
      "Your consistency is inspiring! Keep building those amazing habits! ⭐",
      "Every day you choose to try is a victory worth celebrating! 🌟",
      "You're not just reaching goals, you're becoming the person you want to be! ✨",
      "Together, you're unstoppable! Keep supporting each other! 🤝",
    ]

    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]

    const interaction: MascotInteraction = {
      id: `motivational-reminder-${Date.now()}`,
      type: "both",
      context: "motivation",
      expression: "encouraging",
      pose: "lightbulb",
      message: randomMessage,
      priority: "low",
      frequency: "daily",
      position: "bottom-right",
      duration: 6000,
      autoHide: true,
      showCloseButton: true,
    }
    return showInteraction(interaction)
  }, [showInteraction])

  const showRestReminder = useCallback(() => {
    const interaction: MascotInteraction = {
      id: "rest-reminder",
      type: "both",
      context: "rest",
      expression: "supportive",
      pose: "sleeping",
      message: "Don't forget to take care of yourself too! Rest is part of the journey. ☕💤",
      priority: "low",
      frequency: "weekly",
      position: "top-right",
      duration: 6000,
      autoHide: true,
      showCloseButton: true,
    }
    return showInteraction(interaction)
  }, [showInteraction])

  const showChallengeInvite = useCallback(
    (challengeName: string) => {
      const interaction: MascotInteraction = {
        id: `challenge-invite-${challengeName}`,
        type: "both",
        context: "challenge",
        expression: "excited",
        pose: "rocket",
        message: `Ready for a new adventure? Try the "${challengeName}" challenge together! 🚀`,
        priority: "medium",
        frequency: "weekly",
        position: "center",
        duration: 8000,
        autoHide: false,
        showCloseButton: true,
      }
      return showInteraction(interaction)
    },
    [showInteraction],
  )

  // First-time user interactions
  const showFirstGoalCelebration = useCallback(() => {
    const interaction: MascotInteraction = {
      id: "first-goal-celebration",
      type: "both",
      context: "celebration",
      expression: "celebratory",
      pose: "party",
      message:
        "🎉 Your very first shared goal! This is the beginning of something beautiful. We're so excited to be part of your journey!",
      priority: "high",
      frequency: "once",
      position: "center",
      duration: 10000,
      autoHide: false,
      showCloseButton: true,
    }
    return showInteraction(interaction)
  }, [showInteraction])

  return {
    // Goal Creation Flow
    showGoalCreationWelcome,
    showTemplateSelection,
    showCustomizationTips,
    showGoalCreationSuccess,
    showFirstGoalCelebration,

    // Dashboard Interactions
    showWelcomeBack,
    showStreakCelebration,
    showTaskCompletion,
    showPartnerActivity,
    showProgressMilestone,
    showMotivationalReminder,
    showRestReminder,
    showChallengeInvite,
  }
}
