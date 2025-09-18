"use client"

import { motion } from "framer-motion"
import { Star, Trophy, Zap, TrendingUp, Users, Crown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface XPData {
  currentXP: number
  currentLevel: number
  xpToNextLevel: number
  totalXP: number
  weeklyXP: number
  dailyXP: number
}

interface PartnerXPData {
  currentXP: number
  currentLevel: number
  totalXP: number
  weeklyXP: number
  dailyXP: number
}

interface XPSystemProps {
  userXP: XPData
  partnerXP?: PartnerXPData
  showComparison?: boolean
  partnerName?: string
}

export default function XPSystem({ 
  userXP, 
  partnerXP, 
  showComparison = false, 
  partnerName = "Partner"
}: XPSystemProps) {
  // Ensure userXP exists and has required properties
  if (!userXP || typeof userXP.currentXP !== 'number') {
    return (
      <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
        <CardContent className="p-6">
          <div className="text-center text-[var(--theme-secondary)]">
            Loading XP data...
          </div>
        </CardContent>
      </Card>
    )
  }

  const calculateXPForLevel = (level: number): number => {
    if (level <= 10) return level * 100
    if (level <= 25) return 1000 + (level - 10) * 200
    if (level <= 50) return 4000 + (level - 25) * 500
    return 16500 + (level - 50) * 1000
  }

  const getXPProgress = (currentXP: number, level: number) => {
    const currentLevelXP = level > 1 ? calculateXPForLevel(level - 1) : 0
    const nextLevelXP = calculateXPForLevel(level)
    const progressXP = currentXP - currentLevelXP
    const neededXP = nextLevelXP - currentLevelXP
    return Math.max(0, Math.min(100, Math.round((progressXP / neededXP) * 100)))
  }

  const getLevelBadge = (level: number) => {
    if (level >= 50) return { icon: Crown, color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20", label: "Master" }
    if (level >= 25) return { icon: Trophy, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20", label: "Advanced" }
    if (level >= 10) return { icon: Star, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", label: "Intermediate" }
    return { icon: Zap, color: "text-green-500", bg: "bg-green-50 dark:bg-green-900/20", label: "Beginner" }
  }

  const userLevelBadge = getLevelBadge(userXP.currentLevel || 1)
  const partnerLevelBadge = partnerXP ? getLevelBadge(partnerXP.currentLevel || 1) : null

  const userProgress = getXPProgress(userXP.currentXP || 0, userXP.currentLevel || 1)
  const partnerProgress = partnerXP ? getXPProgress(partnerXP.currentXP || 0, partnerXP.currentLevel || 1) : 0

  return (
    <div className="space-y-6">
      {/* XP Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User XP Card */}
        <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${userLevelBadge.bg}`}>
                  <userLevelBadge.icon className={`w-5 h-5 ${userLevelBadge.color}`} />
                </div>
                <div>
                  <div className="text-lg font-bold text-[var(--theme-foreground)]">
                    Level {userXP.currentLevel || 1}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {userLevelBadge.label}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[var(--theme-primary)]">
                  {(userXP.currentXP || 0).toLocaleString()}
                </div>
                <div className="text-xs text-[var(--theme-secondary)]">Total XP</div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Level Progress */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-[var(--theme-secondary)]">Progress to Level {(userXP.currentLevel || 1) + 1}</span>
                <span className="font-medium text-[var(--theme-foreground)]">
                  {userXP.xpToNextLevel || 0} XP needed
                </span>
              </div>
              <Progress value={userProgress} className="h-3" />
            </div>

            {/* XP Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-[var(--theme-accent)] rounded-lg">
                <div className="text-lg font-bold text-[var(--theme-foreground)]">
                  +{userXP.dailyXP || 0}
                </div>
                <div className="text-xs text-[var(--theme-secondary)]">Today</div>
              </div>
              <div className="text-center p-3 bg-[var(--theme-accent)] rounded-lg">
                <div className="text-lg font-bold text-[var(--theme-foreground)]">
                  +{userXP.weeklyXP || 0}
                </div>
                <div className="text-xs text-[var(--theme-secondary)]">This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partner XP Card */}
        {showComparison && partnerXP && partnerLevelBadge && (
          <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${partnerLevelBadge.bg}`}>
                    <partnerLevelBadge.icon className={`w-5 h-5 ${partnerLevelBadge.color}`} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[var(--theme-foreground)]">
                      Level {partnerXP.currentLevel || 1}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {partnerLevelBadge.label}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--theme-primary)]">
                    {(partnerXP.currentXP || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-[var(--theme-secondary)]">{partnerName}'s XP</div>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Level Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-[var(--theme-secondary)]">Progress to Level {(partnerXP.currentLevel || 1) + 1}</span>
                  <span className="font-medium text-[var(--theme-foreground)]">
                    {partnerProgress}%
                  </span>
                </div>
                <Progress value={partnerProgress} className="h-3" />
              </div>

              {/* XP Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-[var(--theme-accent)] rounded-lg">
                  <div className="text-lg font-bold text-[var(--theme-foreground)]">
                    +{partnerXP.dailyXP || 0}
                  </div>
                  <div className="text-xs text-[var(--theme-secondary)]">Today</div>
                </div>
                <div className="text-center p-3 bg-[var(--theme-accent)] rounded-lg">
                  <div className="text-lg font-bold text-[var(--theme-foreground)]">
                    +{partnerXP.weeklyXP || 0}
                  </div>
                  <div className="text-xs text-[var(--theme-secondary)]">This Week</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* XP Leaderboard */}
      {showComparison && partnerXP && (
        <Card className="bg-[var(--theme-card)] border-[var(--theme-border)]">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-[var(--theme-foreground)]">
              <Users className="w-5 h-5 text-[var(--theme-primary)]" />
              <span>Duo Leaderboard</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {/* Weekly Comparison */}
              <div className="p-4 bg-[var(--theme-accent)] rounded-lg">
                <h4 className="font-semibold text-[var(--theme-foreground)] mb-3">This Week</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(userXP.weeklyXP || 0) > (partnerXP.weeklyXP || 0) ? '1' : '2'}
                      </div>
                      <span className="font-medium text-[var(--theme-foreground)]">You</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[var(--theme-foreground)]">
                        {userXP.weeklyXP || 0} XP
                      </span>
                      {(userXP.weeklyXP || 0) > (partnerXP.weeklyXP || 0) && (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(partnerXP.weeklyXP || 0) > (userXP.weeklyXP || 0) ? '1' : '2'}
                      </div>
                      <span className="font-medium text-[var(--theme-foreground)]">{partnerName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[var(--theme-foreground)]">
                        {partnerXP.weeklyXP || 0} XP
                      </span>
                      {(partnerXP.weeklyXP || 0) > (userXP.weeklyXP || 0) && (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* All-Time Comparison */}
              <div className="p-4 bg-[var(--theme-accent)] rounded-lg">
                <h4 className="font-semibold text-[var(--theme-foreground)] mb-3">All Time</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(userXP.totalXP || 0) > (partnerXP.totalXP || 0) ? '1' : '2'}
                      </div>
                      <span className="font-medium text-[var(--theme-foreground)]">You</span>
                      <Badge variant="secondary" className="text-xs">
                        Level {userXP.currentLevel || 1}
                      </Badge>
                    </div>
                    <span className="font-bold text-[var(--theme-foreground)]">
                      {(userXP.totalXP || 0).toLocaleString()} XP
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {(partnerXP.totalXP || 0) > (userXP.totalXP || 0) ? '1' : '2'}
                      </div>
                      <span className="font-medium text-[var(--theme-foreground)]">{partnerName}</span>
                      <Badge variant="secondary" className="text-xs">
                        Level {partnerXP.currentLevel || 1}
                      </Badge>
                    </div>
                    <span className="font-bold text-[var(--theme-foreground)]">
                      {(partnerXP.totalXP || 0).toLocaleString()} XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
