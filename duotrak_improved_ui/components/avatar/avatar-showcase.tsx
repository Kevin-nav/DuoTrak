"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Users, Settings, Star } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import AvatarCustomizer from "./avatar-customizer"

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

interface AvatarShowcaseProps {
  userAvatar: AvatarData
  partnerAvatar?: AvatarData & { name: string }
  onAvatarUpdate: (avatar: AvatarData) => void
  showComparison: boolean
}

export default function AvatarShowcase({
  userAvatar,
  partnerAvatar,
  onAvatarUpdate,
  showComparison
}: AvatarShowcaseProps) {
  const [showCustomizer, setShowCustomizer] = useState(false)

  const getAvatarEmoji = (avatar: AvatarData) => {
    // Simple emoji-based avatar representation
    const skinTones = {
      light: "👱",
      medium: "👤", 
      dark: "👨🏿"
    }
    
    const expressions = {
      happy: "😊",
      excited: "😄",
      focused: "😐",
      confident: "😎",
      relaxed: "😌",
      determined: "😤"
    }

    return expressions[avatar.expression as keyof typeof expressions] || "😊"
  }

  const getLevelTitle = (level: number) => {
    if (level >= 50) return "Avatar Legend"
    if (level >= 25) return "Avatar Master"
    if (level >= 10) return "Avatar Expert"
    if (level >= 5) return "Avatar Enthusiast"
    return "Avatar Novice"
  }

  return (
    <>
      <Card className="bg-[var(--theme-card)] border-[var(--theme-border)] h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-[var(--theme-foreground)]">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-[var(--theme-primary)]" />
              <span>Avatar Showcase</span>
              {showComparison && (
                <Badge variant="secondary" className="ml-2">
                  <Users className="w-3 h-3 mr-1" />
                  vs Partner
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomizer(true)}
            >
              <Settings className="w-4 h-4 mr-1" />
              Customize
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* User Avatar */}
          <div className="text-center space-y-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative inline-block"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center text-4xl border-4 border-[var(--theme-primary)]">
                {getAvatarEmoji(userAvatar)}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[var(--theme-primary)] rounded-full flex items-center justify-center text-white text-xs font-bold">
                {userAvatar.level}
              </div>
            </motion.div>
            
            <div>
              <h4 className="font-semibold text-[var(--theme-foreground)]">You</h4>
              <Badge variant="secondary" className="text-xs">
                {getLevelTitle(userAvatar.level)}
              </Badge>
              <div className="text-xs text-[var(--theme-secondary)] mt-1">
                {userAvatar.xp.toLocaleString()} XP
              </div>
            </div>
          </div>

          {/* Partner Avatar */}
          {showComparison && partnerAvatar && (
            <div className="text-center space-y-3 pt-4 border-t border-[var(--theme-border)]">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative inline-block"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-full flex items-center justify-center text-3xl border-4 border-purple-500">
                  {getAvatarEmoji(partnerAvatar)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {partnerAvatar.level}
                </div>
              </motion.div>
              
              <div>
                <h4 className="font-semibold text-[var(--theme-foreground)]">{partnerAvatar.name}</h4>
                <Badge variant="secondary" className="text-xs">
                  {getLevelTitle(partnerAvatar.level)}
                </Badge>
                <div className="text-xs text-[var(--theme-secondary)] mt-1">
                  {partnerAvatar.xp.toLocaleString()} XP
                </div>
              </div>
            </div>
          )}

          {/* Avatar Stats */}
          <div className="pt-4 border-t border-[var(--theme-border)]">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-[var(--theme-foreground)]">
                  {Object.keys(userAvatar).filter(key => 
                    !['level', 'xp'].includes(key) && userAvatar[key as keyof AvatarData] !== 'none'
                  ).length}
                </div>
                <div className="text-xs text-[var(--theme-secondary)]">Customizations</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--theme-foreground)]">
                  {Math.min(userAvatar.level, 15)}
                </div>
                <div className="text-xs text-[var(--theme-secondary)]">Items Unlocked</div>
              </div>
            </div>
          </div>

          {/* Next Unlock Preview */}
          <div className="bg-[var(--theme-accent)] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--theme-foreground)]">
                  Next Unlock
                </div>
                <div className="text-xs text-[var(--theme-secondary)]">
                  {userAvatar.level < 5 ? "Formal Outfit" :
                   userAvatar.level < 10 ? "Sporty Outfit" :
                   userAvatar.level < 15 ? "Hoodie Outfit" :
                   userAvatar.level < 25 ? "Suit Outfit" :
                   userAvatar.level < 50 ? "Superhero Outfit" : "All Unlocked!"}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-bold text-[var(--theme-foreground)]">
                  Level {userAvatar.level < 50 ? 
                    (userAvatar.level < 5 ? 5 :
                     userAvatar.level < 10 ? 10 :
                     userAvatar.level < 15 ? 15 :
                     userAvatar.level < 25 ? 25 : 50) : "MAX"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar Customizer Modal */}
      {showCustomizer && (
        <AvatarCustomizer
          currentAvatar={userAvatar}
          onSave={onAvatarUpdate}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </>
  )
}
