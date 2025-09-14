"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { Palette, Check, Users, RotateCcw, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "./theme-provider"

interface ThemeSwitcherProps {
  showPartnerSync?: boolean
}

export default function ThemeSwitcher({ showPartnerSync = true }: ThemeSwitcherProps) {
  const { theme, setTheme, partnerTheme, syncWithPartner, setSyncWithPartner, availableThemes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:border-[var(--theme-primary)] transition-colors"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline">Theme</span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Theme Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-[var(--theme-primary)]" />
                  Choose Theme
                </h3>
                <p className="text-sm text-gray-600 mt-1">Customize your DuoTrak experience</p>
              </div>

              {/* Partner Sync Option */}
              {showPartnerSync && (
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {syncWithPartner ? (
                        <RotateCcw className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">Sync with Partner</h4>
                        <p className="text-xs text-gray-600">
                          {syncWithPartner ? "Themes are synchronized" : "Choose themes independently"}
                        </p>
                      </div>
                    </div>
                    <Switch checked={syncWithPartner} onCheckedChange={setSyncWithPartner} />
                  </div>

                  {partnerTheme && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-700">
                          Partner is using: {availableThemes.find((t) => t.id === partnerTheme)?.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Theme Options */}
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  {availableThemes.map((themeOption) => (
                    <motion.button
                      key={themeOption.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setTheme(themeOption.id)
                        if (!syncWithPartner) {
                          setIsOpen(false)
                        }
                      }}
                      className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                        theme === themeOption.id
                          ? "border-[var(--theme-primary)] bg-[var(--theme-accent)]"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      {/* Theme Preview */}
                      <div className={`w-full h-8 rounded-md mb-2 ${themeOption.preview}`} />

                      {/* Theme Info */}
                      <h4 className="font-medium text-gray-900 text-sm mb-1">{themeOption.name}</h4>
                      <p className="text-xs text-gray-600">{themeOption.description}</p>

                      {/* Selected Indicator */}
                      {theme === themeOption.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-5 h-5 bg-[var(--theme-primary)] rounded-full flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </motion.div>
                      )}

                      {/* Partner Using Indicator */}
                      {partnerTheme === themeOption.id && (
                        <div className="absolute bottom-2 right-2">
                          <Users className="w-3 h-3 text-blue-500" />
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Current: {availableThemes.find((t) => t.id === theme)?.name}</span>
                  {syncWithPartner && (
                    <div className="flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      <span>Synced</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
