"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "warm-beige" | "forest-green" | "ocean-blue" | "sunset" | "midnight-purple"

interface ThemeOption {
  id: Theme
  name: string
  description: string
  preview: string
}

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  partnerTheme: Theme | null
  syncWithPartner: boolean
  setSyncWithPartner: (sync: boolean) => void
  availableThemes: ThemeOption[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const availableThemes: ThemeOption[] = [
  {
    id: "light",
    name: "Light",
    description: "Clean and bright",
    preview: "bg-gradient-to-r from-blue-100 to-white",
  },
  {
    id: "dark",
    name: "Dark",
    description: "Easy on the eyes",
    preview: "bg-gradient-to-r from-gray-900 to-gray-700",
  },
  {
    id: "warm-beige",
    name: "Warm Beige",
    description: "Cozy and comfortable",
    preview: "bg-gradient-to-r from-amber-100 to-orange-50",
  },
  {
    id: "forest-green",
    name: "Forest Green",
    description: "Natural and calming",
    preview: "bg-gradient-to-r from-green-100 to-emerald-50",
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    description: "Fresh and serene",
    preview: "bg-gradient-to-r from-cyan-100 to-blue-50",
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm and energizing",
    preview: "bg-gradient-to-r from-orange-100 to-red-50",
  },
  {
    id: "midnight-purple",
    name: "Midnight Purple",
    description: "Mysterious and elegant",
    preview: "bg-gradient-to-r from-purple-100 to-violet-50",
  },
]

const themeStyles = {
  light: {
    "--theme-primary": "#3b82f6",
    "--theme-primary-hover": "#2563eb",
    "--theme-background": "#ffffff",
    "--theme-foreground": "#1f2937",
    "--theme-secondary": "#6b7280",
    "--theme-muted": "#f9fafb",
    "--theme-accent": "#eff6ff",
    "--theme-border": "#e5e7eb",
    "--theme-card": "#ffffff",
  },
  dark: {
    "--theme-primary": "#60a5fa",
    "--theme-primary-hover": "#3b82f6",
    "--theme-background": "#111827",
    "--theme-foreground": "#f9fafb",
    "--theme-secondary": "#9ca3af",
    "--theme-muted": "#1f2937",
    "--theme-accent": "#1e3a8a",
    "--theme-border": "#374151",
    "--theme-card": "#1f2937",
  },
  "warm-beige": {
    "--theme-primary": "#f59e0b",
    "--theme-primary-hover": "#d97706",
    "--theme-background": "#fef7ed",
    "--theme-foreground": "#92400e",
    "--theme-secondary": "#a16207",
    "--theme-muted": "#fef3c7",
    "--theme-accent": "#fef3c7",
    "--theme-border": "#fed7aa",
    "--theme-card": "#ffffff",
  },
  "forest-green": {
    "--theme-primary": "#10b981",
    "--theme-primary-hover": "#059669",
    "--theme-background": "#f0fdf4",
    "--theme-foreground": "#064e3b",
    "--theme-secondary": "#047857",
    "--theme-muted": "#dcfce7",
    "--theme-accent": "#dcfce7",
    "--theme-border": "#bbf7d0",
    "--theme-card": "#ffffff",
  },
  "ocean-blue": {
    "--theme-primary": "#0891b2",
    "--theme-primary-hover": "#0e7490",
    "--theme-background": "#f0f9ff",
    "--theme-foreground": "#164e63",
    "--theme-secondary": "#0369a1",
    "--theme-muted": "#e0f2fe",
    "--theme-accent": "#e0f2fe",
    "--theme-border": "#bae6fd",
    "--theme-card": "#ffffff",
  },
  sunset: {
    "--theme-primary": "#ea580c",
    "--theme-primary-hover": "#c2410c",
    "--theme-background": "#fff7ed",
    "--theme-foreground": "#9a3412",
    "--theme-secondary": "#c2410c",
    "--theme-muted": "#fed7aa",
    "--theme-accent": "#fed7aa",
    "--theme-border": "#fdba74",
    "--theme-card": "#ffffff",
  },
  "midnight-purple": {
    "--theme-primary": "#8b5cf6",
    "--theme-primary-hover": "#7c3aed",
    "--theme-background": "#faf5ff",
    "--theme-foreground": "#581c87",
    "--theme-secondary": "#7c2d12",
    "--theme-muted": "#ede9fe",
    "--theme-accent": "#ede9fe",
    "--theme-border": "#ddd6fe",
    "--theme-card": "#ffffff",
  },
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [partnerTheme, setPartnerTheme] = useState<Theme | null>("dark") // Mock partner theme
  const [syncWithPartner, setSyncWithPartner] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("duotrak-theme") as Theme
    const savedSync = localStorage.getItem("duotrak-sync-theme") === "true"

    if (savedTheme && availableThemes.find((t) => t.id === savedTheme)) {
      setTheme(savedTheme)
    }
    setSyncWithPartner(savedSync)
  }, [])

  useEffect(() => {
    const activeTheme = syncWithPartner && partnerTheme ? partnerTheme : theme
    const styles = themeStyles[activeTheme]

    Object.entries(styles).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value)
    })

    localStorage.setItem("duotrak-theme", theme)
    localStorage.setItem("duotrak-sync-theme", syncWithPartner.toString())
  }, [theme, partnerTheme, syncWithPartner])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        partnerTheme,
        syncWithPartner,
        setSyncWithPartner,
        availableThemes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
