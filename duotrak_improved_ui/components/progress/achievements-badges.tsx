"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Filter, Lock } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface DateRange {
  start: Date | null
  end: Date | null
  label: string
}

interface AchievementsBadgesProps {
  dateRange: DateRange
  showPartnerComparison: boolean
}

export default function AchievementsBadges({ 
  dateRange, 
  showPartnerComparison 
}: AchievementsBadgesProps) {
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all")

  // Mock achievements data
  const achievementsData = [
    {
      id: "streak-7",
      title: "Week Warrior",
      description: "Maintain a 7-day streak",
      icon: "🔥",
      category: "Streaks",
      rarity: "common",
      isUnlocked: true,
      unlockedDate: "2024-01-22",
      progress: 100
    },
    {
      id: "streak-30",
      title: "Monthly Master", 
      description: "Maintain a 30-day streak",
      icon: "🏆",
      category: "Streaks",
      rarity: "rare",
      isUnlocked: true,
      unlockedDate: "2024-02-14",
      progress: 100
    },
    {
      id: "perfect-week",
      title: "Perfect Week",
      description: "Complete 100% of tasks for 7 consecutive days",
      icon: "⭐",
      category: "Consistency",
      rarity: "epic",
      isUnlocked: true,
      unlockedDate: "2024-02-28",
      progress: 100
    },
    {
      id: "early-bird",
      title: "Early Bird",
      description: "Complete morning routine before 7 AM for 14 days",
      icon: "🌅",
      category: "Habits",
      rarity: "uncommon",
      isUnlocked: true,
      unlockedDate: "2024-03-05",
      progress: 100
    },
    {
      id: "goal-crusher",
      title: "Goal Crusher",
      description: "Complete your first goal",
      icon: "💪",
      category: "Goals",
      rarity: "rare",
      isUnlocked: true,
      unlockedDate: "2024-03-31",
      progress: 100
    },
    {
      id: "streak-100",
      title: "Centurion",
      description: "Maintain a 100-day streak",
      icon: "👑",
      category: "Streaks", 
      rarity: "legendary",
      isUnlocked: false,
      unlockedDate: null,
      progress: 45
    },
    {
      id: "team-player",
      title: "Team Player",
      description: "Help your partner achieve a milestone",
      icon: "🤝",
      category: "Partnership",
      rarity: "uncommon",
      isUnlocked: false,
      unlockedDate: null,
      progress: 67
    },
    {
      id: "consistency-king",
      title: "Consistency King",
      description: "Maintain 90%+ completion rate for 30 days",
      icon: "👑",
      category: "Consistency",
      rarity: "legendary",
      isUnlocked: false,
      unlockedDate: null,
      progress: 23
    }
  ]

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50"
      case "uncommon": return "border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-800/20"
      case "rare": return "border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-800/20"
      case "epic": return "border-purple-300 bg-purple-50 dark:border-purple-600 dark:bg-purple-800/20"
      case "legendary": return "border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-800/20"
      default: return "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50"
    }
  }

  const filteredAchievements = achievementsData.filter(achievement => {
    if (filter === "unlocked") return achievement.isUnlocked
    if (filter === "locked") return !achievement.isUnlocked
    return true
  })

  const unlockedCount = achievementsData.filter(a => a.isUnlocked).length
  const totalCount = achievementsData.length

  return (
    <Card className="bg-[var(--theme-card)] border-[var(--theme-border)] h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-[var(--theme-foreground)]">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-[var(--theme-primary)]" />
            <span>Achievements</span>
            <Badge variant="secondary">
              {unlockedCount}/{totalCount}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "unlocked" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("unlocked")}
            >
              Unlocked
            </Button>
            <Button
              variant={filter === "locked" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("locked")}
            >
              Locked
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Achievement Grid */}
          <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {filteredAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative p-3 rounded-lg border-2 ${getRarityColor(achievement.rarity)} ${
                  achievement.isUnlocked ? "" : "opacity-60"
                }`}
              >
                {/* Lock Overlay */}
                {!achievement.isUnlocked && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-3 h-3 text-gray-400" />
                  </div>
                )}

                {/* Achievement Content */}
                <div className="text-center space-y-2">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <h4 className="font-semibold text-xs text-[var(--theme-foreground)]">
                      {achievement.title}
                    </h4>
                    <p className="text-xs text-[var(--theme-secondary)] mt-1">
                      {achievement.description}
                    </p>
                  </div>
                  
                  {/* Progress for locked achievements */}
                  {!achievement.isUnlocked && achievement.progress > 0 && (
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                        <div
                          className="bg-[var(--theme-primary)] h-1 rounded-full transition-all duration-300"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-[var(--theme-secondary)]">
                        {achievement.progress}%
                      </div>
                    </div>
                  )}
                  
                  {/* Unlock date for unlocked achievements */}
                  {achievement.isUnlocked && achievement.unlockedDate && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      Unlocked {new Date(achievement.unlockedDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="pt-4 border-t border-[var(--theme-border)]">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {unlockedCount}
                </div>
                <div className="text-xs text-[var(--theme-secondary)]">Unlocked</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {achievementsData.filter(a => !a.isUnlocked && a.progress > 50).length}
                </div>
                <div className="text-xs text-[var(--theme-secondary)]">Nearly There</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--theme-foreground)]">
                  {Math.round((unlockedCount / totalCount) * 100)}%
                </div>
                <div className="text-xs text-[var(--theme-secondary)]">Complete</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
