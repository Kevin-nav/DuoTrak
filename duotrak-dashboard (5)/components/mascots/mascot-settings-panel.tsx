"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Settings,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  Heart,
  Target,
  Zap,
  RotateCcw,
  Save,
  Bell,
  Moon,
  Sun,
  Users,
  Coffee,
  Rocket,
  TrendingUp,
  PartyPopper,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMascot } from "@/contexts/mascot-context"
import Image from "next/image"

interface MascotPreferences {
  enabled: boolean
  contextualMascots: boolean
  frequency: "minimal" | "balanced" | "frequent"
  sessionLimit: number
  soundEnabled: boolean
  reducedMotion: boolean
  personality: "supportive" | "playful" | "focused"
  favoriteContexts: string[]
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  celebrationIntensity: "subtle" | "normal" | "enthusiastic"
}

const defaultPreferences: MascotPreferences = {
  enabled: true,
  contextualMascots: true,
  frequency: "balanced",
  sessionLimit: 5,
  soundEnabled: true,
  reducedMotion: false,
  personality: "supportive",
  favoriteContexts: ["celebration", "streak", "motivation", "teamwork"],
  quietHours: {
    enabled: false,
    start: "22:00",
    end: "08:00",
  },
  celebrationIntensity: "normal",
}

const contextOptions = [
  {
    id: "celebration",
    name: "Celebrations",
    description: "Party time when you achieve goals!",
    icon: PartyPopper,
    image: "/mascots/celebration-mascot.png",
  },
  {
    id: "streak",
    name: "Streak Milestones",
    description: "High-fives for consistency",
    icon: Zap,
    image: "/mascots/streak-mascot.png",
  },
  {
    id: "motivation",
    name: "Daily Motivation",
    description: "Encouraging words to keep going",
    icon: Sparkles,
    image: "/mascots/motivation-mascot.png",
  },
  {
    id: "teamwork",
    name: "Partner Support",
    description: "Celebrating your duo journey",
    icon: Users,
    image: "/mascots/teamwork-mascot.png",
  },
  {
    id: "progress",
    name: "Progress Updates",
    description: "Tracking your amazing growth",
    icon: TrendingUp,
    image: "/mascots/progress-mascot.png",
  },
  {
    id: "challenge",
    name: "New Challenges",
    description: "Ready for the next adventure?",
    icon: Rocket,
    image: "/mascots/challenge-mascot.png",
  },
  {
    id: "notification",
    name: "Reminders",
    description: "Gentle nudges when needed",
    icon: Bell,
    image: "/mascots/notification-mascot.png",
  },
  {
    id: "rest",
    name: "Rest Time",
    description: "Chill moments and self-care",
    icon: Coffee,
    image: "/mascots/rest-mascot.png",
  },
]

const personalityStyles = {
  supportive: {
    name: "Supportive",
    description: "Gentle, understanding, and encouraging",
    icon: Heart,
    color: "bg-pink-500",
    example: "You're doing amazing! Every small step counts toward your big dreams. 💕",
  },
  playful: {
    name: "Playful",
    description: "Fun, energetic, and enthusiastic",
    icon: Sparkles,
    color: "bg-purple-500",
    example: "Woohoo! Look at you crushing those goals! Time to celebrate! 🎉✨",
  },
  focused: {
    name: "Focused",
    description: "Direct, goal-oriented, and motivating",
    icon: Target,
    color: "bg-blue-500",
    example: "Great progress! You're 73% closer to your goal. Keep that momentum going! 🎯",
  },
}

export default function MascotSettingsPanel() {
  const { state, toggleMascot, toggleContextualMascots, setReducedMotion } = useMascot()
  const [preferences, setPreferences] = useState<MascotPreferences>(defaultPreferences)
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  // Load preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem("duotrak-mascot-preferences")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences({ ...defaultPreferences, ...parsed })
      } catch (error) {
        console.warn("Failed to load mascot preferences:", error)
      }
    }
  }, [])

  // Sync with mascot context state
  useEffect(() => {
    setPreferences((prev) => ({
      ...prev,
      enabled: state.mascotEnabled,
      contextualMascots: state.contextualMascots,
      reducedMotion: state.reducedMotion,
    }))
  }, [state.mascotEnabled, state.contextualMascots, state.reducedMotion])

  const updatePreference = <K extends keyof MascotPreferences>(key: K, value: MascotPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)

    // Apply certain changes immediately
    if (key === "enabled") {
      toggleMascot()
    } else if (key === "contextualMascots") {
      toggleContextualMascots()
    } else if (key === "reducedMotion") {
      setReducedMotion(value as boolean)
    }
  }

  const savePreferences = () => {
    localStorage.setItem("duotrak-mascot-preferences", JSON.stringify(preferences))
    setHasChanges(false)

    // Show success message
    // You could trigger a toast notification here
  }

  const resetToDefaults = () => {
    setPreferences(defaultPreferences)
    setHasChanges(true)
  }

  const toggleFavoriteContext = (contextId: string) => {
    const newFavorites = preferences.favoriteContexts.includes(contextId)
      ? preferences.favoriteContexts.filter((id) => id !== contextId)
      : [...preferences.favoriteContexts, contextId]

    updatePreference("favoriteContexts", newFavorites)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--theme-foreground)]">Mascot Settings</h1>
          <p className="text-[var(--theme-muted-foreground)] mt-1">Customize how Poko & Lumo interact with you</p>
        </div>

        <div className="flex items-center space-x-3">
          {hasChanges && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <Button
                onClick={savePreferences}
                className="bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </motion.div>
          )}

          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-[var(--theme-accent)]">
          <TabsTrigger value="general" className="data-[state=active]:bg-[var(--theme-card)]">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="personality" className="data-[state=active]:bg-[var(--theme-card)]">
            <Heart className="w-4 h-4 mr-2" />
            Personality
          </TabsTrigger>
          <TabsTrigger value="contexts" className="data-[state=active]:bg-[var(--theme-card)]">
            <Sparkles className="w-4 h-4 mr-2" />
            Contexts
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-[var(--theme-card)]">
            <Clock className="w-4 h-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
            <CardHeader>
              <CardTitle className="text-[var(--theme-foreground)]">Basic Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[var(--theme-foreground)]">Enable Mascots</h3>
                  <p className="text-sm text-[var(--theme-muted-foreground)]">
                    Turn Poko & Lumo interactions on or off
                  </p>
                </div>
                <Switch
                  checked={preferences.enabled}
                  onCheckedChange={(checked) => updatePreference("enabled", checked)}
                />
              </div>

              {/* Contextual Mascots */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[var(--theme-foreground)]">Contextual Images</h3>
                  <p className="text-sm text-[var(--theme-muted-foreground)]">
                    Show different mascot images based on context
                  </p>
                </div>
                <Switch
                  checked={preferences.contextualMascots}
                  onCheckedChange={(checked) => updatePreference("contextualMascots", checked)}
                  disabled={!preferences.enabled}
                />
              </div>

              {/* Interaction Frequency */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-[var(--theme-foreground)]">Interaction Frequency</h3>
                  <p className="text-sm text-[var(--theme-muted-foreground)]">How often should mascots appear?</p>
                </div>
                <Select
                  value={preferences.frequency}
                  onValueChange={(value: "minimal" | "balanced" | "frequent") => updatePreference("frequency", value)}
                  disabled={!preferences.enabled}
                >
                  <SelectTrigger className="bg-[var(--theme-background)] border-[var(--theme-border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal - Only important moments</SelectItem>
                    <SelectItem value="balanced">Balanced - Regular encouragement</SelectItem>
                    <SelectItem value="frequent">Frequent - Lots of interaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Session Limit */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-[var(--theme-foreground)]">Daily Session Limit</h3>
                  <p className="text-sm text-[var(--theme-muted-foreground)]">
                    Maximum interactions per day: {preferences.sessionLimit}
                  </p>
                </div>
                <Slider
                  value={[preferences.sessionLimit]}
                  onValueChange={([value]) => updatePreference("sessionLimit", value)}
                  max={20}
                  min={1}
                  step={1}
                  disabled={!preferences.enabled}
                  className="w-full"
                />
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[var(--theme-foreground)]">Sound Effects</h3>
                  <p className="text-sm text-[var(--theme-muted-foreground)]">Play sounds with mascot interactions</p>
                </div>
                <div className="flex items-center space-x-2">
                  {preferences.soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-[var(--theme-muted-foreground)]" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-[var(--theme-muted-foreground)]" />
                  )}
                  <Switch
                    checked={preferences.soundEnabled}
                    onCheckedChange={(checked) => updatePreference("soundEnabled", checked)}
                    disabled={!preferences.enabled}
                  />
                </div>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[var(--theme-foreground)]">Reduced Motion</h3>
                  <p className="text-sm text-[var(--theme-muted-foreground)]">Minimize animations for accessibility</p>
                </div>
                <Switch
                  checked={preferences.reducedMotion}
                  onCheckedChange={(checked) => updatePreference("reducedMotion", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personality Settings */}
        <TabsContent value="personality" className="space-y-6">
          <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
            <CardHeader>
              <CardTitle className="text-[var(--theme-foreground)]">Mascot Personality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(personalityStyles).map(([key, style]) => {
                  const Icon = style.icon
                  const isSelected = preferences.personality === key

                  return (
                    <motion.div
                      key={key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${
                          isSelected
                            ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]/10"
                            : "border-[var(--theme-border)] hover:border-[var(--theme-primary)]/50"
                        }
                      `}
                      onClick={() => updatePreference("personality", key as any)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-10 h-10 ${style.color} rounded-full flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium text-[var(--theme-foreground)]">{style.name}</h3>
                          <p className="text-xs text-[var(--theme-muted-foreground)]">{style.description}</p>
                        </div>
                      </div>

                      <div className="bg-[var(--theme-accent)] p-3 rounded-lg">
                        <p className="text-sm text-[var(--theme-foreground)] italic">"{style.example}"</p>
                      </div>

                      {isSelected && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mt-2 flex justify-center">
                          <Badge className="bg-[var(--theme-primary)] text-white">Selected</Badge>
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Context Preferences */}
        <TabsContent value="contexts" className="space-y-6">
          <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
            <CardHeader>
              <CardTitle className="text-[var(--theme-foreground)]">Favorite Interactions</CardTitle>
              <p className="text-sm text-[var(--theme-muted-foreground)]">
                Choose which types of mascot interactions you enjoy most
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {contextOptions.map((context) => {
                  const Icon = context.icon
                  const isSelected = preferences.favoriteContexts.includes(context.id)

                  return (
                    <motion.div
                      key={context.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${
                          isSelected
                            ? "border-[var(--theme-primary)] bg-[var(--theme-primary)]/10"
                            : "border-[var(--theme-border)] hover:border-[var(--theme-primary)]/50"
                        }
                      `}
                      onClick={() => toggleFavoriteContext(context.id)}
                    >
                      <div className="text-center space-y-3">
                        <div className="relative mx-auto w-12 h-12">
                          <Image
                            src={context.image || "/placeholder.svg"}
                            alt={context.name}
                            width={48}
                            height={48}
                            className="rounded-lg"
                          />
                        </div>

                        <div>
                          <h3 className="font-medium text-[var(--theme-foreground)] text-sm">{context.name}</h3>
                          <p className="text-xs text-[var(--theme-muted-foreground)] mt-1">{context.description}</p>
                        </div>

                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Badge className="bg-[var(--theme-primary)] text-white text-xs">Favorite</Badge>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
            <CardHeader>
              <CardTitle className="text-[var(--theme-foreground)]">Advanced Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quiet Hours */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-[var(--theme-foreground)]">Quiet Hours</h3>
                    <p className="text-sm text-[var(--theme-muted-foreground)]">
                      Disable mascot interactions during specific hours
                    </p>
                  </div>
                  <Switch
                    checked={preferences.quietHours.enabled}
                    onCheckedChange={(checked) =>
                      updatePreference("quietHours", { ...preferences.quietHours, enabled: checked })
                    }
                  />
                </div>

                {preferences.quietHours.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center space-x-4 pl-4 border-l-2 border-[var(--theme-border)]"
                  >
                    <div className="flex items-center space-x-2">
                      <Moon className="w-4 h-4 text-[var(--theme-muted-foreground)]" />
                      <input
                        type="time"
                        value={preferences.quietHours.start}
                        onChange={(e) =>
                          updatePreference("quietHours", {
                            ...preferences.quietHours,
                            start: e.target.value,
                          })
                        }
                        className="bg-[var(--theme-background)] border border-[var(--theme-border)] rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <span className="text-[var(--theme-muted-foreground)]">to</span>
                    <div className="flex items-center space-x-2">
                      <Sun className="w-4 h-4 text-[var(--theme-muted-foreground)]" />
                      <input
                        type="time"
                        value={preferences.quietHours.end}
                        onChange={(e) =>
                          updatePreference("quietHours", { ...preferences.quietHours, end: e.target.value })
                        }
                        className="bg-[var(--theme-background)] border border-[var(--theme-border)] rounded px-2 py-1 text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Celebration Intensity */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-[var(--theme-foreground)]">Celebration Intensity</h3>
                  <p className="text-sm text-[var(--theme-muted-foreground)]">
                    How enthusiastic should celebrations be?
                  </p>
                </div>
                <Select
                  value={preferences.celebrationIntensity}
                  onValueChange={(value: "subtle" | "normal" | "enthusiastic") =>
                    updatePreference("celebrationIntensity", value)
                  }
                >
                  <SelectTrigger className="bg-[var(--theme-background)] border-[var(--theme-border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subtle">Subtle - Gentle acknowledgment</SelectItem>
                    <SelectItem value="normal">Normal - Balanced celebration</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic - Full party mode!</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Options */}
              <div className="pt-4 border-t border-[var(--theme-border)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-[var(--theme-foreground)]">Reset All Settings</h3>
                    <p className="text-sm text-[var(--theme-muted-foreground)]">
                      Restore all mascot settings to defaults
                    </p>
                  </div>
                  <Button variant="outline" onClick={resetToDefaults}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Section */}
      <AnimatePresence>
        {preferences.enabled && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className="bg-gradient-to-r from-[var(--theme-primary)]/10 to-[var(--theme-secondary)]/10 border-[var(--theme-primary)]/20">
              <CardHeader>
                <CardTitle className="text-[var(--theme-foreground)] flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Image
                    src="/mascots/motivation-mascot.png"
                    alt="Preview mascot"
                    width={64}
                    height={64}
                    className="rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="text-[var(--theme-foreground)] font-medium">
                      {personalityStyles[preferences.personality].example}
                    </p>
                    <p className="text-sm text-[var(--theme-muted-foreground)] mt-1">
                      This is how your mascots will talk to you with the{" "}
                      <span className="font-medium">{personalityStyles[preferences.personality].name}</span>{" "}
                      personality.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
