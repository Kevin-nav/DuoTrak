"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { Palette, Shirt, Eye, Smile, Crown, Star } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MouseGlowEffect from "../mouse-glow-effect"

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

interface AvatarSystemProps {
  avatarData: AvatarData
  onAvatarUpdate: (newData: AvatarData) => void
  isEditable?: boolean
  size?: "small" | "medium" | "large"
  showLevel?: boolean
}

const skinTones = [
  { id: "light", color: "#FDBCB4", name: "Light" },
  { id: "medium-light", color: "#F1C27D", name: "Medium Light" },
  { id: "medium", color: "#E0AC69", name: "Medium" },
  { id: "medium-dark", color: "#C68642", name: "Medium Dark" },
  { id: "dark", color: "#8D5524", name: "Dark" },
  { id: "very-dark", color: "#5C2E04", name: "Very Dark" }
]

const hairStyles = [
  { id: "short", name: "Short", emoji: "👦" },
  { id: "long", name: "Long", emoji: "👧" },
  { id: "curly", name: "Curly", emoji: "🧑‍🦱" },
  { id: "wavy", name: "Wavy", emoji: "👨‍🦰" },
  { id: "bald", name: "Bald", emoji: "👨‍🦲" },
  { id: "ponytail", name: "Ponytail", emoji: "👩‍🦳" }
]

const hairColors = [
  { id: "black", color: "#2C1B18", name: "Black" },
  { id: "brown", color: "#8B4513", name: "Brown" },
  { id: "blonde", color: "#FAD5A5", name: "Blonde" },
  { id: "red", color: "#CC4125", name: "Red" },
  { id: "gray", color: "#808080", name: "Gray" },
  { id: "white", color: "#F5F5F5", name: "White" }
]

const eyeColors = [
  { id: "brown", color: "#8B4513", name: "Brown" },
  { id: "blue", color: "#4169E1", name: "Blue" },
  { id: "green", color: "#228B22", name: "Green" },
  { id: "hazel", color: "#8E7618", name: "Hazel" },
  { id: "gray", color: "#708090", name: "Gray" },
  { id: "amber", color: "#FFBF00", name: "Amber" }
]

const outfits = [
  { id: "casual", name: "Casual", emoji: "👕", unlockLevel: 1 },
  { id: "formal", name: "Formal", emoji: "👔", unlockLevel: 5 },
  { id: "sporty", name: "Sporty", emoji: "🏃‍♂️", unlockLevel: 10 },
  { id: "hoodie", name: "Hoodie", emoji: "🧥", unlockLevel: 15 },
  { id: "suit", name: "Suit", emoji: "🤵", unlockLevel: 25 },
  { id: "superhero", name: "Superhero", emoji: "🦸", unlockLevel: 50 }
]

const accessories = [
  { id: "none", name: "None", emoji: "", unlockLevel: 1 },
  { id: "glasses", name: "Glasses", emoji: "👓", unlockLevel: 3 },
  { id: "sunglasses", name: "Sunglasses", emoji: "🕶️", unlockLevel: 7 },
  { id: "hat", name: "Hat", emoji: "🎩", unlockLevel: 12 },
  { id: "crown", name: "Crown", emoji: "👑", unlockLevel: 30 },
  { id: "halo", name: "Halo", emoji: "😇", unlockLevel: 100 }
]

const expressions = [
  { id: "happy", name: "Happy", emoji: "😊" },
  { id: "excited", name: "Excited", emoji: "😄" },
  { id: "determined", name: "Determined", emoji: "😤" },
  { id: "cool", name: "Cool", emoji: "😎" },
  { id: "wink", name: "Wink", emoji: "😉" },
  { id: "proud", name: "Proud", emoji: "😌" }
]

export default function AvatarSystem({ 
  avatarData, 
  onAvatarUpdate, 
  isEditable = true, 
  size = "medium",
  showLevel = true 
}: AvatarSystemProps) {
  const [isCustomizing, setIsCustomizing] = useState(false)
  const [tempAvatarData, setTempAvatarData] = useState(avatarData)
  const [activeTab, setActiveTab] = useState("appearance")

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32"
  }

  const levelBadgeSize = {
    small: "w-5 h-5 text-xs",
    medium: "w-6 h-6 text-sm",
    large: "w-8 h-8 text-base"
  }

  const getAvatarEmoji = (data: AvatarData) => {
    const expression = expressions.find(e => e.id === data.expression)?.emoji || "😊"
    return expression
  }

  const getLevelFromXP = (xp: number) => {
    if (xp < 1000) return Math.floor(xp / 100) + 1
    if (xp < 5000) return Math.floor((xp - 1000) / 200) + 11
    if (xp < 25000) return Math.floor((xp - 5000) / 500) + 26
    return Math.floor((xp - 25000) / 1000) + 51
  }

  const isItemUnlocked = (unlockLevel: number) => {
    return avatarData.level >= unlockLevel
  }

  const handleSaveCustomization = () => {
    onAvatarUpdate(tempAvatarData)
    setIsCustomizing(false)
  }

  const handleCancelCustomization = () => {
    setTempAvatarData(avatarData)
    setIsCustomizing(false)
  }

  useEffect(() => {
    setTempAvatarData(avatarData)
  }, [avatarData])

  return (
    <div className="relative">
      <MouseGlowEffect glowColor="#19A1E5" intensity="medium">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative"
        >
          {isEditable ? (
            <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
              <DialogTrigger asChild>
                <button className="relative group">
                  <AvatarDisplay 
                    avatarData={avatarData} 
                    size={size} 
                    showLevel={showLevel}
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Palette className="w-6 h-6 text-white" />
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary-blue" />
                    Customize Your Avatar
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Avatar Preview */}
                  <div className="flex justify-center">
                    <AvatarDisplay 
                      avatarData={tempAvatarData} 
                      size="large" 
                      showLevel={true}
                    />
                  </div>

                  {/* Customization Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="appearance">Appearance</TabsTrigger>
                      <TabsTrigger value="style">Style</TabsTrigger>
                      <TabsTrigger value="expression">Expression</TabsTrigger>
                    </TabsList>

                    <TabsContent value="appearance" className="space-y-6">
                      {/* Skin Tone */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-amber-200 to-amber-400"></div>
                          Skin Tone
                        </h4>
                        <div className="grid grid-cols-6 gap-2">
                          {skinTones.map((tone) => (
                            <button
                              key={tone.id}
                              onClick={() => setTempAvatarData({...tempAvatarData, skinTone: tone.id})}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                tempAvatarData.skinTone === tone.id 
                                  ? 'border-primary-blue scale-110' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: tone.color }}
                              title={tone.name}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Hair Style */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <div className="text-lg">💇</div>
                          Hair Style
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          {hairStyles.map((style) => (
                            <button
                              key={style.id}
                              onClick={() => setTempAvatarData({...tempAvatarData, hairStyle: style.id})}
                              className={`p-3 rounded-lg border-2 transition-all text-center ${
                                tempAvatarData.hairStyle === style.id 
                                  ? 'border-primary-blue bg-blue-50 dark:bg-blue-900/20' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <div className="text-2xl mb-1">{style.emoji}</div>
                              <div className="text-sm font-medium">{style.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hair Color */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          Hair Color
                        </h4>
                        <div className="grid grid-cols-6 gap-2">
                          {hairColors.map((color) => (
                            <button
                              key={color.id}
                              onClick={() => setTempAvatarData({...tempAvatarData, hairColor: color.id})}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                tempAvatarData.hairColor === color.id 
                                  ? 'border-primary-blue scale-110' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: color.color }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Eye Color */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Eye Color
                        </h4>
                        <div className="grid grid-cols-6 gap-2">
                          {eyeColors.map((color) => (
                            <button
                              key={color.id}
                              onClick={() => setTempAvatarData({...tempAvatarData, eyeColor: color.id})}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                tempAvatarData.eyeColor === color.id 
                                  ? 'border-primary-blue scale-110' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{ backgroundColor: color.color }}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="style" className="space-y-6">
                      {/* Outfits */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Shirt className="w-4 h-4" />
                          Outfit
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {outfits.map((outfit) => {
                            const unlocked = isItemUnlocked(outfit.unlockLevel)
                            return (
                              <button
                                key={outfit.id}
                                onClick={() => unlocked && setTempAvatarData({...tempAvatarData, outfit: outfit.id})}
                                disabled={!unlocked}
                                className={`p-4 rounded-lg border-2 transition-all text-center relative ${
                                  tempAvatarData.outfit === outfit.id 
                                    ? 'border-primary-blue bg-blue-50 dark:bg-blue-900/20' 
                                    : unlocked 
                                      ? 'border-gray-300 hover:border-gray-400' 
                                      : 'border-gray-200 bg-gray-100 dark:bg-gray-800 opacity-50'
                                }`}
                              >
                                <div className="text-3xl mb-2">{outfit.emoji}</div>
                                <div className="text-sm font-medium">{outfit.name}</div>
                                {!unlocked && (
                                  <div className="absolute top-2 right-2 bg-gray-600 text-white text-xs px-2 py-1 rounded">
                                    Lv.{outfit.unlockLevel}
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Accessories */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          Accessories
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {accessories.map((accessory) => {
                            const unlocked = isItemUnlocked(accessory.unlockLevel)
                            return (
                              <button
                                key={accessory.id}
                                onClick={() => unlocked && setTempAvatarData({...tempAvatarData, accessory: accessory.id})}
                                disabled={!unlocked}
                                className={`p-4 rounded-lg border-2 transition-all text-center relative ${
                                  tempAvatarData.accessory === accessory.id 
                                    ? 'border-primary-blue bg-blue-50 dark:bg-blue-900/20' 
                                    : unlocked 
                                      ? 'border-gray-300 hover:border-gray-400' 
                                      : 'border-gray-200 bg-gray-100 dark:bg-gray-800 opacity-50'
                                }`}
                              >
                                <div className="text-3xl mb-2">{accessory.emoji || "✨"}</div>
                                <div className="text-sm font-medium">{accessory.name}</div>
                                {!unlocked && (
                                  <div className="absolute top-2 right-2 bg-gray-600 text-white text-xs px-2 py-1 rounded">
                                    Lv.{accessory.unlockLevel}
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="expression" className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Smile className="w-4 h-4" />
                          Expression
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {expressions.map((expression) => (
                            <button
                              key={expression.id}
                              onClick={() => setTempAvatarData({...tempAvatarData, expression: expression.id})}
                              className={`p-4 rounded-lg border-2 transition-all text-center ${
                                tempAvatarData.expression === expression.id 
                                  ? 'border-primary-blue bg-blue-50 dark:bg-blue-900/20' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <div className="text-4xl mb-2">{expression.emoji}</div>
                              <div className="text-sm font-medium">{expression.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button variant="outline" onClick={handleCancelCustomization}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveCustomization} className="bg-primary-blue hover:bg-primary-blue-hover">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <AvatarDisplay 
              avatarData={avatarData} 
              size={size} 
              showLevel={showLevel}
            />
          )}
        </motion.div>
      </MouseGlowEffect>
    </div>
  )
}

function AvatarDisplay({ 
  avatarData, 
  size, 
  showLevel 
}: { 
  avatarData: AvatarData
  size: "small" | "medium" | "large"
  showLevel: boolean 
}) {
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-24 h-24",
    large: "w-32 h-32"
  }

  const levelBadgeSize = {
    small: "w-5 h-5 text-xs",
    medium: "w-6 h-6 text-sm",
    large: "w-8 h-8 text-base"
  }

  const getAvatarEmoji = (data: AvatarData) => {
    const expression = expressions.find(e => e.id === data.expression)?.emoji || "😊"
    return expression
  }

  const skinTone = skinTones.find(t => t.id === avatarData.skinTone)?.color || "#FDBCB4"

  return (
    <div className="relative">
      <div 
        className={`${sizeClasses[size]} rounded-full border-4 border-primary-blue shadow-lg flex items-center justify-center text-4xl relative overflow-hidden`}
        style={{ backgroundColor: skinTone }}
      >
        <div className="text-center">
          {getAvatarEmoji(avatarData)}
        </div>
        
        {/* Accessory Overlay */}
        {avatarData.accessory !== "none" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl">
              {accessories.find(a => a.id === avatarData.accessory)?.emoji}
            </div>
          </div>
        )}
      </div>

      {/* Level Badge */}
      {showLevel && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -bottom-1 -right-1 ${levelBadgeSize[size]} bg-gradient-to-r from-primary-blue to-accent-light-blue rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
        >
          {avatarData.level}
        </motion.div>
      )}
    </div>
  )
}
