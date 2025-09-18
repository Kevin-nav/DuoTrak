"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Save, RotateCcw } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

interface AvatarData {
  skinTone: string
  hairStyle: string
  hairColor: string
  eyeColor: string
  outfit: string
  accessory: string
  expression: string
  level: number
  xp: number
}

interface AvatarCustomizerProps {
  currentAvatar: AvatarData
  onSave: (avatar: AvatarData) => void
  onClose: () => void
}

export default function AvatarCustomizer({
  currentAvatar,
  onSave,
  onClose
}: AvatarCustomizerProps) {
  const [tempAvatar, setTempAvatar] = useState<AvatarData>({ ...currentAvatar })
  const [activeTab, setActiveTab] = useState<"appearance" | "style" | "expression">("appearance")

  const customizationOptions = {
    appearance: {
      skinTone: {
        label: "Skin Tone",
        options: [
          { value: "light", label: "Light", unlockLevel: 1 },
          { value: "medium", label: "Medium", unlockLevel: 1 },
          { value: "tan", label: "Tan", unlockLevel: 1 },
          { value: "dark", label: "Dark", unlockLevel: 1 },
          { value: "olive", label: "Olive", unlockLevel: 5 },
          { value: "pale", label: "Pale", unlockLevel: 10 }
        ]
      },
      hairStyle: {
        label: "Hair Style",
        options: [
          { value: "short", label: "Short", unlockLevel: 1 },
          { value: "long", label: "Long", unlockLevel: 1 },
          { value: "curly", label: "Curly", unlockLevel: 3 },
          { value: "wavy", label: "Wavy", unlockLevel: 5 },
          { value: "buzz", label: "Buzz Cut", unlockLevel: 7 },
          { value: "mohawk", label: "Mohawk", unlockLevel: 15 }
        ]
      },
      hairColor: {
        label: "Hair Color",
        options: [
          { value: "brown", label: "Brown", unlockLevel: 1 },
          { value: "black", label: "Black", unlockLevel: 1 },
          { value: "blonde", label: "Blonde", unlockLevel: 1 },
          { value: "red", label: "Red", unlockLevel: 3 },
          { value: "gray", label: "Gray", unlockLevel: 10 },
          { value: "rainbow", label: "Rainbow", unlockLevel: 25 }
        ]
      },
      eyeColor: {
        label: "Eye Color",
        options: [
          { value: "brown", label: "Brown", unlockLevel: 1 },
          { value: "blue", label: "Blue", unlockLevel: 1 },
          { value: "green", label: "Green", unlockLevel: 1 },
          { value: "hazel", label: "Hazel", unlockLevel: 3 },
          { value: "gray", label: "Gray", unlockLevel: 5 },
          { value: "violet", label: "Violet", unlockLevel: 30 }
        ]
      }
    },
    style: {
      outfit: {
        label: "Outfit",
        options: [
          { value: "casual", label: "Casual", unlockLevel: 1 },
          { value: "formal", label: "Formal", unlockLevel: 5 },
          { value: "sporty", label: "Sporty", unlockLevel: 10 },
          { value: "hoodie", label: "Hoodie", unlockLevel: 15 },
          { value: "suit", label: "Suit", unlockLevel: 25 },
          { value: "superhero", label: "Superhero", unlockLevel: 50 }
        ]
      },
      accessory: {
        label: "Accessory",
        options: [
          { value: "none", label: "None", unlockLevel: 1 },
          { value: "glasses", label: "Glasses", unlockLevel: 3 },
          { value: "sunglasses", label: "Sunglasses", unlockLevel: 7 },
          { value: "hat", label: "Hat", unlockLevel: 12 },
          { value: "crown", label: "Crown", unlockLevel: 30 },
          { value: "halo", label: "Halo", unlockLevel: 100 }
        ]
      }
    },
    expression: {
      expression: {
        label: "Expression",
        options: [
          { value: "happy", label: "Happy", unlockLevel: 1 },
          { value: "excited", label: "Excited", unlockLevel: 1 },
          { value: "focused", label: "Focused", unlockLevel: 1 },
          { value: "confident", label: "Confident", unlockLevel: 5 },
          { value: "relaxed", label: "Relaxed", unlockLevel: 10 },
          { value: "determined", label: "Determined", unlockLevel: 15 }
        ]
      }
    }
  }

  const isUnlocked = (unlockLevel: number) => currentAvatar.level >= unlockLevel

  const handleOptionSelect = (category: string, value: string) => {
    setTempAvatar(prev => ({
      ...prev,
      [category]: value
    }))
  }

  const handleSave = () => {
    onSave(tempAvatar)
    onClose()
  }

  const handleReset = () => {
    setTempAvatar({ ...currentAvatar })
  }

  const getAvatarPreview = () => {
    const expressions = {
      happy: "😊",
      excited: "😄", 
      focused: "😐",
      confident: "😎",
      relaxed: "😌",
      determined: "😤"
    }
    return expressions[tempAvatar.expression as keyof typeof expressions] || "😊"
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-[var(--theme-foreground)]">
                <span>Customize Your Avatar</span>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Avatar Preview */}
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center text-6xl border-4 border-[var(--theme-primary)] mx-auto mb-4">
                  {getAvatarPreview()}
                </div>
                <Badge variant="secondary">
                  Level {currentAvatar.level} • {currentAvatar.xp.toLocaleString()} XP
                </Badge>
              </div>

              {/* Customization Tabs */}
              <div className="flex justify-center space-x-2">
                {(["appearance", "style", "expression"] as const).map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                    className="capitalize"
                  >
                    {tab}
                  </Button>
                ))}
              </div>

              {/* Customization Options */}
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {Object.entries(customizationOptions[activeTab]).map(([category, config]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="font-semibold text-[var(--theme-foreground)]">
                      {config.label}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {config.options.map((option) => (
                        <Button
                          key={option.value}
                          variant={tempAvatar[category as keyof AvatarData] === option.value ? "default" : "outline"}
                          size="sm"
                          disabled={!isUnlocked(option.unlockLevel)}
                          onClick={() => handleOptionSelect(category, option.value)}
                          className="relative"
                        >
                          <span className={!isUnlocked(option.unlockLevel) ? "opacity-50" : ""}>
                            {option.label}
                          </span>
                          {!isUnlocked(option.unlockLevel) && (
                            <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                              L{option.unlockLevel}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-[var(--theme-border)]">
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
