"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"
type ThemeVariant = "default" | "warm" | "forest" | "ocean" | "midnight"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultVariant?: ThemeVariant
  storageKey?: string
  enableMascotColors?: boolean
}

type ThemeProviderState = {
  theme: Theme
  variant: ThemeVariant
  mascotColorsEnabled: boolean
  setTheme: (theme: Theme) => void
  setVariant: (variant: ThemeVariant) => void
  setMascotColors: (enabled: boolean) => void
  resolvedTheme: "light" | "dark"
}

const initialState: ThemeProviderState = {
  theme: "system",
  variant: "default",
  mascotColorsEnabled: true,
  setTheme: () => null,
  setVariant: () => null,
  setMascotColors: () => null,
  resolvedTheme: "light",
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultVariant = "default",
  storageKey = "duotrak-theme",
  enableMascotColors = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [variant, setVariant] = useState<ThemeVariant>(defaultVariant)
  const [mascotColorsEnabled, setMascotColorsEnabled] = useState(enableMascotColors)
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem(storageKey) as Theme
    const savedVariant = localStorage.getItem(`${storageKey}-variant`) as ThemeVariant
    const savedMascotColors = localStorage.getItem(`${storageKey}-mascot`) === "true"

    if (savedTheme) setTheme(savedTheme)
    if (savedVariant) setVariant(savedVariant)
    setMascotColorsEnabled(savedMascotColors)
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    // Remove all theme classes
    root.classList.remove("light", "dark", "theme-warm", "theme-forest", "theme-ocean", "theme-midnight")

    // Determine resolved theme
    let resolvedThemeValue: "light" | "dark"
    if (theme === "system") {
      resolvedThemeValue = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    } else {
      resolvedThemeValue = theme
    }

    setResolvedTheme(resolvedThemeValue)

    // Apply theme classes
    root.classList.add(resolvedThemeValue)
    if (variant !== "default") {
      root.classList.add(`theme-${variant}`)
    }

    // Apply mascot colors if enabled
    if (mascotColorsEnabled && variant === "default") {
      // Mascot colors are already the default in CSS
    }

    // Save preferences
    localStorage.setItem(storageKey, theme)
    localStorage.setItem(`${storageKey}-variant`, variant)
    localStorage.setItem(`${storageKey}-mascot`, mascotColorsEnabled.toString())
  }, [theme, variant, mascotColorsEnabled, storageKey])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      const resolvedThemeValue = mediaQuery.matches ? "dark" : "light"
      setResolvedTheme(resolvedThemeValue)

      const root = window.document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(resolvedThemeValue)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  const value = {
    theme,
    variant,
    mascotColorsEnabled,
    setTheme: (theme: Theme) => setTheme(theme),
    setVariant: (variant: ThemeVariant) => setVariant(variant),
    setMascotColors: (enabled: boolean) => setMascotColorsEnabled(enabled),
    resolvedTheme,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
