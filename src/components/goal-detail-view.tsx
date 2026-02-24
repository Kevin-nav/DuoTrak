"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Clock, CheckCircle, Upload, X } from "lucide-react"
import { useState } from "react"
import MouseGlowEffect from "./mouse-glow-effect"

import { DomainGoal } from "../../packages/domain/src/goals";
import { useRouter } from "next/navigation";
import { getGoalProgressModel, inferGoalArchetype } from "@/lib/goals/progress-metrics";
import { useUpdateGoal } from "@/hooks/useGoals";
import { validateArchetypeProfile } from "@/lib/goals/archetype-validators";
import { useToast } from "@/hooks/use-toast";

interface GoalDetailViewProps {
  goal: DomainGoal;
}

export default function GoalDetailView({ goal }: GoalDetailViewProps) {
  const router = useRouter();
  const updateGoal = useUpdateGoal(goal.id);
  const { toast } = useToast();
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const archetype = inferGoalArchetype(goal);
  const progressModel = getGoalProgressModel(goal);
  const initialProfile = (() => {
    try {
      return goal.goalProfileJson ? JSON.parse(goal.goalProfileJson) : {};
    } catch {
      return {};
    }
  })();
  const [profileDraft, setProfileDraft] = useState<Record<string, string>>({
    currency: String(initialProfile.currency || "USD"),
    targetAmount: String(initialProfile.targetAmount || ""),
    currentAmount: String(initialProfile.currentAmount || ""),
    weeklyContribution: String(initialProfile.weeklyContribution || ""),
    targetLongRunKm: String(initialProfile.targetLongRunKm || ""),
    currentLongRunKm: String(initialProfile.currentLongRunKm || ""),
    totalWeeks: String(initialProfile.totalWeeks || ""),
    completedWeeks: String(initialProfile.completedWeeks || ""),
    targetStreak: String(initialProfile.targetStreak || ""),
    currentStreak: String(initialProfile.currentStreak || ""),
    dailyTarget: String(initialProfile.dailyTarget || ""),
  });

  const handleMarkComplete = () => {
    // Default to visual accountability type for now
    const accountabilityType = "visual";  // TODO: Get from goal metadata when available
    if (accountabilityType === "visual") {
      setShowPhotoUpload(true)
    } else {
      // Time-bound completion
      triggerCelebration()
    }
  }

  const handlePhotoUpload = () => {
    setShowPhotoUpload(false)
    triggerCelebration()
  }

  const triggerCelebration = () => {
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 2000)
  }

  const progressPercentage = progressModel.percent;

  const saveProfile = () => {
    const toNumber = (value: string) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    let payload: Record<string, unknown> = {};
    if (archetype === "savings") {
      payload = {
        currency: profileDraft.currency || "USD",
        targetAmount: toNumber(profileDraft.targetAmount),
        currentAmount: toNumber(profileDraft.currentAmount),
        weeklyContribution: toNumber(profileDraft.weeklyContribution),
      };
    } else if (archetype === "marathon") {
      payload = {
        targetLongRunKm: toNumber(profileDraft.targetLongRunKm),
        currentLongRunKm: toNumber(profileDraft.currentLongRunKm),
        totalWeeks: toNumber(profileDraft.totalWeeks),
        completedWeeks: toNumber(profileDraft.completedWeeks),
      };
    } else if (archetype === "daily_habit") {
      payload = {
        targetStreak: toNumber(profileDraft.targetStreak),
        currentStreak: toNumber(profileDraft.currentStreak),
        dailyTarget: toNumber(profileDraft.dailyTarget),
      };
    }

    const validation = validateArchetypeProfile(archetype, payload);
    if (!validation.ok) {
      toast({
        title: "Invalid goal settings",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    setIsSavingProfile(true);
    updateGoal.mutate(
      {
        goal_archetype: archetype,
        goal_profile_json: JSON.stringify(payload),
      },
      {
        onSuccess: () => setIsSavingProfile(false),
        onError: () => setIsSavingProfile(false),
      },
    );
  };

  return (
    <div className="min-h-screen bg-pearl-gray dark:bg-gray-900 pt-16 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors mr-4">
            <ArrowLeft className="w-6 h-6 text-charcoal dark:text-gray-100" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-charcoal dark:text-gray-100">{goal.name}</h1>
            <p className="text-stone-gray dark:text-gray-400">{goal.category}</p>
          </div>
        </motion.div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal dark:text-gray-100">{progressModel.title}</h2>
            <span className="text-sm font-medium text-stone-gray dark:text-gray-400">
              {progressModel.summary}
            </span>
          </div>

          <div className="relative h-3 bg-cool-gray dark:bg-gray-700 rounded-full overflow-hidden mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-primary-blue to-accent-light-blue rounded-full relative"
            >
              <motion.div
                animate={{ x: [-100, 200] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
              />
            </motion.div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-gray dark:text-gray-400">
              {progressModel.helper}
            </span>
            <span className="text-primary-blue font-medium">{Math.round(progressPercentage)}% complete</span>
          </div>
          {archetype === "daily_habit" && typeof (progressModel as any).streakPercent === "number" && (
            <div className="mt-3">
              <p className="text-xs text-stone-gray dark:text-gray-400 mb-1">Streak progress</p>
              <div className="h-2 rounded-full bg-cool-gray dark:bg-gray-700 overflow-hidden">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${(progressModel as any).streakPercent}%` }} />
              </div>
            </div>
          )}
        </motion.div>

        {(archetype === "savings" || archetype === "marathon" || archetype === "daily_habit") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 mb-6"
          >
            <h3 className="text-base font-semibold text-charcoal dark:text-gray-100 mb-3">Goal-specific settings</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {archetype === "savings" && (
                <>
                  <input className="rounded-lg border border-cool-gray px-3 py-2" placeholder="Currency (USD)" value={profileDraft.currency} onChange={(e) => setProfileDraft((prev) => ({ ...prev, currency: e.target.value }))} />
                  <input className="rounded-lg border border-cool-gray px-3 py-2" type="number" placeholder="Target amount" value={profileDraft.targetAmount} onChange={(e) => setProfileDraft((prev) => ({ ...prev, targetAmount: e.target.value }))} />
                  <input className="rounded-lg border border-cool-gray px-3 py-2" type="number" placeholder="Current amount" value={profileDraft.currentAmount} onChange={(e) => setProfileDraft((prev) => ({ ...prev, currentAmount: e.target.value }))} />
                  <input className="rounded-lg border border-cool-gray px-3 py-2" type="number" placeholder="Weekly contribution" value={profileDraft.weeklyContribution} onChange={(e) => setProfileDraft((prev) => ({ ...prev, weeklyContribution: e.target.value }))} />
                </>
              )}
              {archetype === "marathon" && (
                <>
                  <input className="rounded-lg border border-cool-gray px-3 py-2" type="number" placeholder="Current long run km" value={profileDraft.currentLongRunKm} onChange={(e) => setProfileDraft((prev) => ({ ...prev, currentLongRunKm: e.target.value }))} />
                  <input className="rounded-lg border border-cool-gray px-3 py-2" type="number" placeholder="Target long run km" value={profileDraft.targetLongRunKm} onChange={(e) => setProfileDraft((prev) => ({ ...prev, targetLongRunKm: e.target.value }))} />
                  <input className="rounded-lg border border-cool-gray px-3 py-2" type="number" placeholder="Total weeks" value={profileDraft.totalWeeks} onChange={(e) => setProfileDraft((prev) => ({ ...prev, totalWeeks: e.target.value }))} />
                  <input className="rounded-lg border border-cool-gray px-3 py-2" type="number" placeholder="Completed weeks" value={profileDraft.completedWeeks} onChange={(e) => setProfileDraft((prev) => ({ ...prev, completedWeeks: e.target.value }))} />
                </>
              )}
              {archetype === "daily_habit" && (
                <>
                  <input className="rounded-lg border border-cool-gray px-3 py-2" type="number" placeholder="Target streak" value={profileDraft.targetStreak} onChange={(e) => setProfileDraft((prev) => ({ ...prev, targetStreak: e.target.value }))} />
                  <input className="rounded-lg border border-cool-gray px-3 py-2" type="number" placeholder="Current streak" value={profileDraft.currentStreak} onChange={(e) => setProfileDraft((prev) => ({ ...prev, currentStreak: e.target.value }))} />
                  <input className="rounded-lg border border-cool-gray px-3 py-2" type="number" placeholder="Daily target completions" value={profileDraft.dailyTarget} onChange={(e) => setProfileDraft((prev) => ({ ...prev, dailyTarget: e.target.value }))} />
                </>
              )}
            </div>
            <button
              type="button"
              onClick={saveProfile}
              disabled={isSavingProfile}
              className="mt-4 rounded-lg bg-primary-blue px-4 py-2 text-sm font-medium text-white hover:bg-primary-blue-hover disabled:opacity-60"
            >
              {isSavingProfile ? "Saving..." : "Save settings"}
            </button>
          </motion.div>
        )}

        {/* Tasks List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-charcoal dark:text-gray-100 mb-4">Tasks</h2>

          <div className="space-y-3">
            {goal.tasks.map((task, index) => (
              <MouseGlowEffect key={task.id} glowColor={task.status === 'completed' ? "#10B981" : "#19A1E5"} intensity="low">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${task.status === 'completed'
                      ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20"
                      : "border-primary-blue/20 bg-accent-light-blue dark:bg-primary-blue/10 hover:border-primary-blue"
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.status === 'completed'
                          ? "border-green-500 bg-green-500"
                          : "border-primary-blue hover:bg-primary-blue/10"
                        }`}
                    >
                      {task.status === 'completed' && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>

                    <div>
                      <p
                        className={`font-medium ${task.status === 'completed'
                            ? "text-green-700 dark:text-green-300 line-through"
                            : "text-charcoal dark:text-gray-100"
                          }`}
                      >
                        {task.name}
                      </p>
                      <p className="text-sm text-stone-gray dark:text-gray-400">{new Date(task.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {task.status !== 'completed' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleMarkComplete}
                      className="flex items-center space-x-2 bg-primary-blue hover:bg-primary-blue-hover text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Mark Done</span>
                    </motion.button>
                  )}

                  {task.status === 'completed' && (
                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                  )}
                </motion.div>
              </MouseGlowEffect>
            ))}
          </div>
        </motion.div>

        {/* Photo Upload Modal */}
        <AnimatePresence>
          {showPhotoUpload && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100">Upload Proof Photo</h3>
                  <button
                    onClick={() => setShowPhotoUpload(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5 text-stone-gray dark:text-gray-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-cool-gray dark:border-gray-600 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-stone-gray dark:text-gray-400 mx-auto mb-4" />
                    <p className="text-stone-gray dark:text-gray-400 mb-4">Take a photo or select from your gallery</p>
                    <div className="flex space-x-3 justify-center">
                      <button className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue-hover transition-colors">
                        Take Photo
                      </button>
                      <button className="px-4 py-2 border border-cool-gray dark:border-gray-600 text-charcoal dark:text-gray-100 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        Choose File
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePhotoUpload}
                    className="w-full bg-primary-blue hover:bg-primary-blue-hover text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Confirm Completion
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Celebration Animation */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1 }} className="text-6xl mb-4">
                  🎉
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">Great job!</h2>
                <p className="text-white/80">Task completed successfully</p>
              </motion.div>

              {/* Confetti */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 0,
                    scale: 0,
                    x: "50vw",
                    y: "50vh",
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.5],
                    x: `${50 + (Math.random() - 0.5) * 100}vw`,
                    y: `${50 + (Math.random() - 0.5) * 100}vh`,
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    ease: "easeOut",
                  }}
                  className="absolute w-3 h-3 bg-primary-blue rounded-full"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
