"use client"

import { motion } from "framer-motion"
import { Palette, Sun, Moon, Monitor, Check, Sparkles } from "lucide-react"
import { useState } from "react"
import { useTheme } from "./theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"

const themes = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "system", label: "System", icon: Monitor },
] as const

const variants = [
  { key: "default", label: "Mascot Colors", colors: ["hsl(138, 85%, 42%)", "hsl(185, 65%, 50%)"] },
  { key: "warm", label: "Warm Beige", colors: ["hsl(25, 95%, 53%)", "hsl(45, 93%, 47%)"] },
  { key: "forest", label: "Forest Green", colors: ["hsl(142, 76%, 36%)", "hsl(159, 61%, 41%)"] },
  { key: "ocean", label: "Ocean Blue", colors: ["hsl(200, 98%, 39%)", "hsl(195, 100%, 50%)"] },
  { key: "midnight", label: "Midnight Purple", colors: ["hsl(263, 70%, 50%)", "hsl(280, 100%, 70%)"] },
] as const

export function ThemeSwitcher() {
  const { theme, variant, mascotColorsEnabled, setTheme, setVariant, setMascotColors, resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const currentThemeIcon = themes.find((t) => t.key === theme)?.icon || Monitor

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className="relative">
            <Palette className="h-5 w-5" />
            {mascotColorsEnabled && variant === "default" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-duo rounded-full border-2 border-background"
              />
            )}
          </motion.div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Theme Settings
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Theme Mode Selection */}
        <div className="p-2">
          <p className="text-sm font-medium mb-2">Mode</p>
          <div className="grid grid-cols-3 gap-1">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon
              const isActive = theme === themeOption.key

              return (
                <motion.button
                  key={themeOption.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTheme(themeOption.key)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{themeOption.label}</span>
                  {isActive && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-1 right-1">
                      <Check className="h-3 w-3" />
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Color Variant Selection */}
        <div className="p-2">
          <p className="text-sm font-medium mb-2">Color Scheme</p>
          <div className="space-y-1">
            {variants.map((variantOption) => {
              const isActive = variant === variantOption.key

              return (
                <motion.button
                  key={variantOption.key}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setVariant(variantOption.key)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${
                    isActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted"
                  }`}
                >
                  {/* Color Preview */}
                  <div className="flex gap-1">
                    {variantOption.colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{variantOption.label}</span>
                      {variantOption.key === "default" && <Sparkles className="h-3 w-3 text-primary" />}
                    </div>
                  </div>

                  {isActive && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Mascot Colors Toggle */}
        <div className="p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-poko-500" />
              <div>
                <p className="text-sm font-medium">Mascot Colors</p>
                <p className="text-xs text-muted-foreground">Use Poko & Lumo's colors</p>
              </div>
            </div>
            <Switch checked={mascotColorsEnabled} onCheckedChange={setMascotColors} />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Current Status */}
        <div className="p-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Current:</span>
            <span className="capitalize">
              {resolvedTheme} • {variants.find((v) => v.key === variant)?.label}
              {mascotColorsEnabled && variant === "default" && " • Mascot"}
            </span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
