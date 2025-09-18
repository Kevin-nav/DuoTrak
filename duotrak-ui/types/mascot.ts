export type MascotType = "poko" | "lumo" | "both"

export type MascotExpression =
  | "happy"
  | "celebratory"
  | "supportive"
  | "excited"
  | "neutral"
  | "encouraging"
  | "sleepy"
  | "motivated"

export type MascotPose =
  | "standing"
  | "high-five"
  | "notification"
  | "lightbulb"
  | "rocket"
  | "party"
  | "sleeping"
  | "chart"
  | "hugging"

export type MascotContext =
  | "notification"
  | "motivation"
  | "challenge"
  | "streak"
  | "celebration"
  | "rest"
  | "progress"
  | "teamwork"
  | "welcome"
  | "achievement"

export type InteractionFrequency = "once" | "daily" | "weekly" | "unlimited"

export type InteractionPriority = "high" | "medium" | "low"

export type InteractionPosition = "top-right" | "top-center" | "center" | "bottom-right" | "bottom-center"

export interface MascotInteraction {
  id: string
  type: MascotType
  context: MascotContext
  expression: MascotExpression
  pose: MascotPose
  message: string
  priority: InteractionPriority
  frequency: InteractionFrequency
  position?: InteractionPosition
  duration?: number
  autoHide?: boolean
  showCloseButton?: boolean
  onComplete?: () => void
}

export interface MascotState {
  currentInteraction: MascotInteraction | null
  sessionInteractionCount: number
  lastInteractionTime: number
  seenInteractions: Set<string>
  reducedMotion: boolean
  mascotEnabled: boolean
  contextualMascots: boolean
}

export interface MascotContextType {
  state: MascotState
  showInteraction: (interaction: MascotInteraction) => boolean
  hideInteraction: () => void
  canShowInteraction: (interaction: MascotInteraction) => boolean
  resetSession: () => void
  toggleMascot: () => void
  toggleContextualMascots: () => void
  setReducedMotion: (enabled: boolean) => void
}
