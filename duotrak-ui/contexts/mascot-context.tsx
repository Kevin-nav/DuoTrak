"use client"

import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { MascotState, MascotContextType, MascotInteraction } from "@/types/mascot"

const MAX_INTERACTIONS_PER_SESSION = 5
const MIN_INTERACTION_INTERVAL = 30000 // 30 seconds between interactions

type MascotAction =
  | { type: "SHOW_INTERACTION"; payload: MascotInteraction }
  | { type: "HIDE_INTERACTION" }
  | { type: "INCREMENT_SESSION_COUNT" }
  | { type: "RESET_SESSION" }
  | { type: "TOGGLE_MASCOT" }
  | { type: "TOGGLE_CONTEXTUAL_MASCOTS" }
  | { type: "SET_REDUCED_MOTION"; payload: boolean }
  | { type: "ADD_SEEN_INTERACTION"; payload: string }
  | { type: "LOAD_PREFERENCES"; payload: Partial<MascotState> }

const initialState: MascotState = {
  currentInteraction: null,
  sessionInteractionCount: 0,
  lastInteractionTime: 0,
  seenInteractions: new Set(),
  reducedMotion: false,
  mascotEnabled: true,
  contextualMascots: true,
}

function mascotReducer(state: MascotState, action: MascotAction): MascotState {
  switch (action.type) {
    case "SHOW_INTERACTION":
      return {
        ...state,
        currentInteraction: action.payload,
        lastInteractionTime: Date.now(),
      }

    case "HIDE_INTERACTION":
      return {
        ...state,
        currentInteraction: null,
      }

    case "INCREMENT_SESSION_COUNT":
      return {
        ...state,
        sessionInteractionCount: state.sessionInteractionCount + 1,
      }

    case "RESET_SESSION":
      return {
        ...state,
        sessionInteractionCount: 0,
        seenInteractions: new Set(),
      }

    case "TOGGLE_MASCOT":
      return {
        ...state,
        mascotEnabled: !state.mascotEnabled,
      }

    case "TOGGLE_CONTEXTUAL_MASCOTS":
      return {
        ...state,
        contextualMascots: !state.contextualMascots,
      }

    case "SET_REDUCED_MOTION":
      return {
        ...state,
        reducedMotion: action.payload,
      }

    case "ADD_SEEN_INTERACTION":
      const newSeenInteractions = new Set(state.seenInteractions)
      newSeenInteractions.add(action.payload)
      return {
        ...state,
        seenInteractions: newSeenInteractions,
      }

    case "LOAD_PREFERENCES":
      return {
        ...state,
        ...action.payload,
      }

    default:
      return state
  }
}

const MascotContext = createContext<MascotContextType | undefined>(undefined)

interface MascotProviderProps {
  children: ReactNode
}

export function MascotProvider({ children }: MascotProviderProps) {
  const [state, dispatch] = useReducer(mascotReducer, initialState)

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem("duotrak-mascot-prefs")
    const savedDetailedPrefs = localStorage.getItem("duotrak-mascot-preferences")

    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs)
        dispatch({
          type: "LOAD_PREFERENCES",
          payload: {
            mascotEnabled: prefs.mascotEnabled ?? true,
            contextualMascots: prefs.contextualMascots ?? true,
            reducedMotion: prefs.reducedMotion ?? false,
          },
        })
      } catch (error) {
        console.warn("Failed to load mascot preferences:", error)
      }
    }

    // Load detailed preferences if available
    if (savedDetailedPrefs) {
      try {
        const detailedPrefs = JSON.parse(savedDetailedPrefs)
        dispatch({
          type: "LOAD_PREFERENCES",
          payload: {
            mascotEnabled: detailedPrefs.enabled ?? true,
            contextualMascots: detailedPrefs.contextualMascots ?? true,
            reducedMotion: detailedPrefs.reducedMotion ?? false,
          },
        })
      } catch (error) {
        console.warn("Failed to load detailed mascot preferences:", error)
      }
    }

    // Check for system reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mediaQuery.matches) {
      dispatch({ type: "SET_REDUCED_MOTION", payload: true })
    }
  }, [])

  // Save preferences to localStorage
  useEffect(() => {
    const prefs = {
      mascotEnabled: state.mascotEnabled,
      contextualMascots: state.contextualMascots,
      reducedMotion: state.reducedMotion,
    }
    localStorage.setItem("duotrak-mascot-prefs", JSON.stringify(prefs))
  }, [state.mascotEnabled, state.contextualMascots, state.reducedMotion])

  // Reset session count daily
  useEffect(() => {
    const resetTime = new Date()
    resetTime.setHours(0, 0, 0, 0)
    resetTime.setDate(resetTime.getDate() + 1)

    const timeUntilReset = resetTime.getTime() - Date.now()

    const timer = setTimeout(() => {
      dispatch({ type: "RESET_SESSION" })
    }, timeUntilReset)

    return () => clearTimeout(timer)
  }, [])

  const canShowInteraction = (interaction: MascotInteraction): boolean => {
    // Check if mascots are disabled
    if (!state.mascotEnabled) return false

    // Check contextual mascots setting
    if (!state.contextualMascots && interaction.context !== "welcome") return false

    // Check session limits
    if (state.sessionInteractionCount >= MAX_INTERACTIONS_PER_SESSION) return false

    // Check minimum interval between interactions
    const timeSinceLastInteraction = Date.now() - state.lastInteractionTime
    if (timeSinceLastInteraction < MIN_INTERACTION_INTERVAL) return false

    // Check quiet hours
    const savedDetailedPrefs = localStorage.getItem("duotrak-mascot-preferences")
    if (savedDetailedPrefs) {
      try {
        const prefs = JSON.parse(savedDetailedPrefs)
        if (prefs.quietHours?.enabled) {
          const now = new Date()
          const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
          const startTime = prefs.quietHours.start
          const endTime = prefs.quietHours.end

          // Simple time range check (doesn't handle overnight ranges perfectly)
          if (startTime <= endTime) {
            if (currentTime >= startTime && currentTime <= endTime) return false
          } else {
            if (currentTime >= startTime || currentTime <= endTime) return false
          }
        }
      } catch (error) {
        console.warn("Failed to check quiet hours:", error)
      }
    }

    // Check frequency rules
    switch (interaction.frequency) {
      case "once":
        return !state.seenInteractions.has(interaction.id)

      case "daily":
        const today = new Date().toDateString()
        const dailyKey = `${interaction.id}-${today}`
        return !state.seenInteractions.has(dailyKey)

      case "weekly":
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekKey = `${interaction.id}-${weekStart.toDateString()}`
        return !state.seenInteractions.has(weekKey)

      case "unlimited":
        return true

      default:
        return true
    }
  }

  const showInteraction = (interaction: MascotInteraction): boolean => {
    if (!canShowInteraction(interaction)) return false

    dispatch({ type: "SHOW_INTERACTION", payload: interaction })
    dispatch({ type: "INCREMENT_SESSION_COUNT" })

    // Mark interaction as seen based on frequency
    let seenKey = interaction.id
    if (interaction.frequency === "daily") {
      seenKey = `${interaction.id}-${new Date().toDateString()}`
    } else if (interaction.frequency === "weekly") {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      seenKey = `${interaction.id}-${weekStart.toDateString()}`
    }
    dispatch({ type: "ADD_SEEN_INTERACTION", payload: seenKey })

    return true
  }

  const hideInteraction = () => {
    dispatch({ type: "HIDE_INTERACTION" })
  }

  const resetSession = () => {
    dispatch({ type: "RESET_SESSION" })
  }

  const toggleMascot = () => {
    dispatch({ type: "TOGGLE_MASCOT" })
  }

  const toggleContextualMascots = () => {
    dispatch({ type: "TOGGLE_CONTEXTUAL_MASCOTS" })
  }

  const setReducedMotion = (enabled: boolean) => {
    dispatch({ type: "SET_REDUCED_MOTION", payload: enabled })
  }

  const contextValue: MascotContextType = {
    state,
    showInteraction,
    hideInteraction,
    canShowInteraction,
    resetSession,
    toggleMascot,
    toggleContextualMascots,
    setReducedMotion,
  }

  return <MascotContext.Provider value={contextValue}>{children}</MascotContext.Provider>
}

export function useMascot() {
  const context = useContext(MascotContext)
  if (context === undefined) {
    throw new Error("useMascot must be used within a MascotProvider")
  }
  return context
}
