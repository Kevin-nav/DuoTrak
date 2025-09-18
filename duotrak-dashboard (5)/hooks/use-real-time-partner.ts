"use client"

import { useState, useEffect, useCallback } from "react"
import { useMascot } from "@/contexts/mascot-context"

interface PartnerPresence {
  isOnline: boolean
  lastSeen: Date
  currentActivity?: string
  mood?: string
  isTyping?: boolean
}

interface PartnerUpdate {
  id: string
  type: "task_completed" | "goal_achieved" | "streak_milestone" | "activity_started" | "mood_change"
  partnerId: string
  partnerName: string
  data: {
    taskName?: string
    goalName?: string
    streakCount?: number
    activity?: string
    mood?: string
    achievement?: string
    progress?: number
  }
  timestamp: Date
}

interface UseRealTimePartnerOptions {
  partnerId: string
  partnerName: string
  enableNotifications?: boolean
  enableMascotInteractions?: boolean
}

export function useRealTimePartner({
  partnerId,
  partnerName,
  enableNotifications = true,
  enableMascotInteractions = true,
}: UseRealTimePartnerOptions) {
  const { showInteraction } = useMascot()

  const [presence, setPresence] = useState<PartnerPresence>({
    isOnline: false,
    lastSeen: new Date(),
  })

  const [recentUpdates, setRecentUpdates] = useState<PartnerUpdate[]>([])
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting")
  const [lastHeartbeat, setLastHeartbeat] = useState<Date>(new Date())

  // Simulate WebSocket connection for real-time updates
  useEffect(() => {
    const ws: WebSocket | null = null
    let heartbeatInterval: NodeJS.Timeout
    let reconnectTimeout: NodeJS.Timeout

    const connect = () => {
      try {
        // In a real implementation, this would be a WebSocket connection
        // For demo purposes, we'll simulate the connection
        setConnectionStatus("connecting")

        // Simulate connection success
        setTimeout(() => {
          setConnectionStatus("connected")
          setPresence((prev) => ({ ...prev, isOnline: true }))

          // Start heartbeat
          heartbeatInterval = setInterval(() => {
            setLastHeartbeat(new Date())

            // Simulate occasional partner updates
            if (Math.random() < 0.15) {
              generatePartnerUpdate()
            }

            // Simulate presence updates
            if (Math.random() < 0.1) {
              updatePartnerPresence()
            }
          }, 5000)
        }, 2000)
      } catch (error) {
        console.error("Failed to connect to real-time service:", error)
        setConnectionStatus("disconnected")

        // Attempt to reconnect after 5 seconds
        reconnectTimeout = setTimeout(() => {
          connect()
        }, 5000)
      }
    }

    const generatePartnerUpdate = () => {
      const updateTypes = ["task_completed", "activity_started", "mood_change", "goal_achieved", "streak_milestone"]

      const activities = ["working out", "reading", "studying", "meditating", "taking a break", "having a meal"]

      const tasks = [
        "Morning Workout",
        "Daily Reading",
        "Meditation Session",
        "Language Practice",
        "Project Work",
        "Evening Walk",
      ]

      const moods = ["energetic", "focused", "relaxed", "motivated", "accomplished"]

      const type = updateTypes[Math.floor(Math.random() * updateTypes.length)] as PartnerUpdate["type"]

      let updateData: PartnerUpdate["data"] = {}

      switch (type) {
        case "task_completed":
          updateData = {
            taskName: tasks[Math.floor(Math.random() * tasks.length)],
            progress: Math.floor(Math.random() * 30) + 70,
          }
          break
        case "activity_started":
          updateData = {
            activity: activities[Math.floor(Math.random() * activities.length)],
          }
          break
        case "mood_change":
          updateData = {
            mood: moods[Math.floor(Math.random() * moods.length)],
          }
          break
        case "goal_achieved":
          updateData = {
            goalName: "Weekly Fitness Goal",
            achievement: "Completed 7 days in a row!",
          }
          break
        case "streak_milestone":
          updateData = {
            streakCount: Math.floor(Math.random() * 20) + 5,
          }
          break
      }

      const update: PartnerUpdate = {
        id: `update-${Date.now()}-${Math.random()}`,
        type,
        partnerId,
        partnerName,
        data: updateData,
        timestamp: new Date(),
      }

      setRecentUpdates((prev) => [update, ...prev.slice(0, 9)]) // Keep last 10 updates

      // Show mascot interaction for important updates
      if (enableMascotInteractions && enableNotifications) {
        handlePartnerUpdateMascot(update)
      }

      // Show browser notification if permitted
      if (enableNotifications && "Notification" in window && Notification.permission === "granted") {
        showBrowserNotification(update)
      }
    }

    const updatePartnerPresence = () => {
      const activities = [
        "working on goals",
        "taking a break",
        "checking progress",
        "planning tasks",
        "celebrating wins",
        null, // Sometimes no activity
      ]

      const moods = ["energetic", "focused", "relaxed", "motivated", "accomplished"]

      setPresence((prev) => ({
        ...prev,
        currentActivity: activities[Math.floor(Math.random() * activities.length)] || undefined,
        mood: Math.random() < 0.3 ? moods[Math.floor(Math.random() * moods.length)] : prev.mood,
        lastSeen: new Date(),
      }))
    }

    connect()

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval)
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (ws) ws.close()
    }
  }, [partnerId, partnerName, enableNotifications, enableMascotInteractions, showInteraction])

  const handlePartnerUpdateMascot = useCallback(
    (update: PartnerUpdate) => {
      let message = ""
      let context: "teamwork" | "celebration" | "progress" | "streak" | "notification" = "notification"
      let priority: "low" | "medium" | "high" = "medium"

      switch (update.type) {
        case "task_completed":
          message = `🎉 ${partnerName} completed "${update.data.taskName}"! Amazing teamwork!`
          context = "celebration"
          priority = "high"
          break
        case "goal_achieved":
          message = `🏆 ${partnerName} achieved their goal: ${update.data.goalName}!`
          context = "celebration"
          priority = "high"
          break
        case "streak_milestone":
          message = `🔥 ${partnerName} is on a ${update.data.streakCount}-day streak! Incredible consistency!`
          context = "streak"
          priority = "high"
          break
        case "activity_started":
          message = `💪 ${partnerName} started ${update.data.activity}. You've got this!`
          context = "teamwork"
          priority = "low"
          break
        case "mood_change":
          message = `😊 ${partnerName} is feeling ${update.data.mood}!`
          context = "notification"
          priority = "low"
          break
        default:
          return
      }

      showInteraction({
        id: `partner-update-${update.id}`,
        context,
        message,
        priority,
        duration: priority === "high" ? 8000 : 5000,
        frequency: "unlimited",
        position: "top-right",
      })
    },
    [partnerName, showInteraction],
  )

  const showBrowserNotification = useCallback(
    (update: PartnerUpdate) => {
      let title = `${partnerName} - DuoTrak`
      let body = ""
      const icon = "/placeholder.svg?height=64&width=64"

      switch (update.type) {
        case "task_completed":
          title = `${partnerName} completed a task!`
          body = `"${update.data.taskName}" - Keep up the great work together!`
          break
        case "goal_achieved":
          title = `${partnerName} achieved a goal!`
          body = `${update.data.goalName} - Celebrate this win!`
          break
        case "streak_milestone":
          title = `${partnerName} hit a streak milestone!`
          body = `${update.data.streakCount} days in a row! 🔥`
          break
        default:
          return
      }

      const notification = new Notification(title, {
        body,
        icon,
        tag: `partner-update-${update.type}`,
        requireInteraction: false,
      })

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)
    },
    [partnerName],
  )

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      return "not-supported"
    }

    if (Notification.permission === "granted") {
      return "granted"
    }

    if (Notification.permission === "denied") {
      return "denied"
    }

    const permission = await Notification.requestPermission()
    return permission
  }, [])

  const sendPartnerNudge = useCallback(
    async (message: string) => {
      // In a real implementation, this would send via WebSocket
      console.log(`Sending nudge to ${partnerName}:`, message)

      // Simulate API call
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Show confirmation mascot
          if (enableMascotInteractions) {
            showInteraction({
              id: `nudge-sent-${Date.now()}`,
              context: "motivation",
              message: "Nudge sent! Your partner will appreciate the encouragement! 💪",
              priority: "medium",
              duration: 4000,
              frequency: "unlimited",
              position: "bottom-right",
            })
          }
          resolve()
        }, 1000)
      })
    },
    [partnerName, enableMascotInteractions, showInteraction],
  )

  const syncWithPartner = useCallback(async () => {
    // Force sync partner data
    setConnectionStatus("connecting")

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setConnectionStatus("connected")
        setLastHeartbeat(new Date())

        if (enableMascotInteractions) {
          showInteraction({
            id: `sync-complete-${Date.now()}`,
            context: "teamwork",
            message: "Synced with your partner! You're both up to date! ✨",
            priority: "medium",
            duration: 3000,
            frequency: "unlimited",
            position: "top-center",
          })
        }

        resolve()
      }, 2000)
    })
  }, [enableMascotInteractions, showInteraction])

  const clearRecentUpdates = useCallback(() => {
    setRecentUpdates([])
  }, [])

  return {
    // State
    presence,
    recentUpdates,
    connectionStatus,
    lastHeartbeat,

    // Actions
    requestNotificationPermission,
    sendPartnerNudge,
    syncWithPartner,
    clearRecentUpdates,

    // Helpers
    isConnected: connectionStatus === "connected",
    hasRecentActivity: recentUpdates.length > 0,
    lastUpdateTime: recentUpdates[0]?.timestamp,
  }
}
