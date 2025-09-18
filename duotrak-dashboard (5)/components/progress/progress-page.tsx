"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Calendar, TrendingUp, Target, Award, Share2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useMemo } from "react"
import OverallProgressSummary from "./overall-progress-summary"
import ActivityHeatmap from "./activity-heatmap"
import ConsistencyChart from "./consistency-chart"
import TaskBreakdownChart from "./task-breakdown-chart"
import GoalProgressOverview from "./goal-progress-overview"
import AchievementsBadges from "./achievements-badges"
import DateRangeFilter from "./date-range-filter"
import PartnerComparisonToggle from "./partner-comparison-toggle"
import LoadingSpinner from "./loading-spinner"
import XPSystem from "../xp/xp-system"
import AvatarShowcase from "../avatar/avatar-showcase"

interface DateRange {
  start: Date | null
  end: Date | null
  label: string
}

export default function ProgressPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    label: "Last 30 Days"
  })
  const [showPartnerComparison, setShowPartnerComparison] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Mock data
  const mockData = {
    hasPartner: true,
    partnerName: "Alex",
    userXP: {
      currentXP: 2850,
      currentLevel: 15,
      xpToNextLevel: 150,
      totalXP: 2850,
      weeklyXP: 280,
      dailyXP: 45
    },
    partnerXP: {
      currentXP: 2100,
      currentLevel: 12,
      totalXP: 2100,
      weeklyXP: 220,
      dailyXP: 35
    },
    userAvatar: {
      skinTone: "medium",
      hairStyle: "short",
      hairColor: "brown",
      eyeColor: "brown",
      outfit: "casual",
      accessory: "glasses",
      expression: "happy",
      level: 15,
      xp: 2850
    },
    partnerAvatar: {
      name: "Alex",
      skinTone: "light",
      hairStyle: "long",
      hairColor: "blonde",
      eyeColor: "blue",
      outfit: "sporty",
      accessory: "none",
      expression: "excited",
      level: 12,
      xp: 2100
    }
  }

  const handleDateRangeChange = async (newRange: DateRange) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    setDateRange(newRange)
    setIsLoading(false)
  }

  const handlePartnerToggle = async (enabled: boolean) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setShowPartnerComparison(enabled)
    setIsLoading(false)
  }

  const handleAvatarUpdate = (newAvatar: any) => {
    // In real app, this would save to backend
    console.log("Avatar updated:", newAvatar)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="space-y-8"
    >
      {/* Page Header with Controls */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[var(--theme-foreground)] mb-2">Your Progress</h1>
            <p className="text-[var(--theme-secondary)] text-lg">
              Track your journey and celebrate your achievements
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button className="flex items-center space-x-2 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)]">
              <Share2 className="w-4 h-4" />
              <span>Share Progress</span>
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between bg-[var(--theme-card)] border border-[var(--theme-border)] rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <DateRangeFilter 
              currentRange={dateRange}
              onRangeChange={handleDateRangeChange}
              disabled={isLoading}
            />
            
            {mockData.hasPartner && (
              <PartnerComparisonToggle
                enabled={showPartnerComparison}
                partnerName={mockData.partnerName}
                onToggle={handlePartnerToggle}
                disabled={isLoading}
              />
            )}
          </div>

          {isLoading && (
            <div className="flex items-center space-x-2 text-[var(--theme-secondary)]">
              <LoadingSpinner size="sm" />
              <span className="text-sm">Updating data...</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center"
          >
            <div className="bg-[var(--theme-card)] rounded-lg p-6 shadow-xl">
              <LoadingSpinner size="lg" />
              <p className="text-[var(--theme-foreground)] mt-4 text-center">Updating your progress...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP System and Avatar Showcase */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.section variants={itemVariants} className="lg:col-span-2">
          <XPSystem 
            userXP={mockData.userXP}
            partnerXP={showPartnerComparison ? mockData.partnerXP : undefined}
            showComparison={showPartnerComparison}
            partnerName={mockData.partnerName}
          />
        </motion.section>

        <motion.section variants={itemVariants}>
          <AvatarShowcase
            userAvatar={mockData.userAvatar}
            partnerAvatar={showPartnerComparison ? mockData.partnerAvatar : undefined}
            onAvatarUpdate={handleAvatarUpdate}
            showComparison={showPartnerComparison}
          />
        </motion.section>
      </div>

      {/* Overall Progress Summary */}
      <motion.section variants={itemVariants}>
        <OverallProgressSummary 
          dateRange={dateRange}
          showPartnerComparison={showPartnerComparison}
        />
      </motion.section>

      {/* Activity Heatmap */}
      <motion.section variants={itemVariants}>
        <ActivityHeatmap 
          dateRange={dateRange}
          showPartnerComparison={showPartnerComparison}
        />
      </motion.section>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.section variants={itemVariants}>
          <ConsistencyChart 
            dateRange={dateRange}
            showPartnerComparison={showPartnerComparison}
          />
        </motion.section>

        <motion.section variants={itemVariants}>
          <TaskBreakdownChart 
            dateRange={dateRange}
            showPartnerComparison={showPartnerComparison}
          />
        </motion.section>
      </div>

      {/* Goal Progress Overview and Achievements Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.section variants={itemVariants}>
          <GoalProgressOverview 
            dateRange={dateRange}
            showPartnerComparison={showPartnerComparison}
          />
        </motion.section>

        <motion.section variants={itemVariants}>
          <AchievementsBadges 
            dateRange={dateRange}
            showPartnerComparison={showPartnerComparison}
          />
        </motion.section>
      </div>
    </motion.div>
  )
}
