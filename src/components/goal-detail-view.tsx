"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Target, Calendar, CheckCircle2, Repeat, Clock, Mic, Settings2, AlertCircle, CalendarDays, ListChecks, ArrowLeft, Trophy, ChevronDown, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DomainGoal, DomainTask } from "../../packages/domain/src/goals"
import { getGoalProgressModel, inferGoalArchetype } from "@/lib/goals/progress-metrics"
import { useUpdateGoal } from "@/hooks/useGoals"
import { validateArchetypeProfile } from "@/lib/goals/archetype-validators"
import { useToast } from "@/hooks/use-toast"
import TaskVerificationModal, { TaskVerificationSubmission, VerificationMode } from "./task-verification-modal"

type TabKey = "this-week" | "full-plan" | "settings"

interface GoalDetailViewProps {
  goal: DomainGoal
}

type WeekGroup = {
  label: string
  tasks: DomainTask[]
}

const dayName = (value: Date): string =>
  value.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase()

function resolveVerificationMode(task: DomainTask, goalAccountability?: string): VerificationMode {
  const mode = task.verificationMode || task.accountabilityType || goalAccountability || "task_completion"
  if (
    mode === "photo" ||
    mode === "video" ||
    mode === "voice" ||
    mode === "check_in" ||
    mode === "task_completion" ||
    mode === "time-window"
  ) {
    return mode
  }
  return "task_completion"
}

function actionLabelForMode(mode: VerificationMode): string {
  if (mode === "voice") return "Record"
  if (mode === "video") return "Upload"
  if (mode === "photo") return "Upload"
  if (mode === "check_in" || mode === "time-window" || mode === "task_completion") return "Check In"
  return "Complete"
}

const inputBase =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-taupe/40"

export default function GoalDetailView({ goal }: GoalDetailViewProps) {
  const router = useRouter()
  const updateGoal = useUpdateGoal(goal.id)
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabKey>("this-week")
  const [proofModal, setProofModal] = useState<{ taskId: string; mode: VerificationMode } | null>(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [collapsedMilestones, setCollapsedMilestones] = useState<Record<number, boolean>>({})

  const toggleMilestone = (idx: number) => {
    setCollapsedMilestones((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const archetype = inferGoalArchetype(goal)
  const progressModel = getGoalProgressModel(goal)
  const initialProfile = (() => {
    try {
      return goal.goalProfileJson ? JSON.parse(goal.goalProfileJson) : {}
    } catch {
      return {}
    }
  })()

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
  })

  const groupedWeekTasks = useMemo<WeekGroup[]>(() => {
    const now = new Date()
    const todayKey = now.toDateString()
    const buckets = new Map<string, DomainTask[]>()

    for (const task of goal.tasks) {
      const date = new Date(task.created_at)
      const key = date.toDateString()
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key)!.push(task)
    }

    const entries = [...buckets.entries()].sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    const groups = entries.map(([key, tasks]) => ({
      label: key === todayKey ? "TODAY" : dayName(new Date(key)),
      tasks,
    }))

    if (!groups.some((group) => group.label === "TODAY")) {
      groups.push({ label: "TODAY", tasks: [] })
    }

    return groups
  }, [goal.tasks])

  const completedCount = goal.tasks.filter((task) => task.status === "completed").length

  const triggerCelebration = () => {
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 1800)
  }

  const handleTaskAction = (task: DomainTask) => {
    const mode = resolveVerificationMode(task, goal.accountabilityType || undefined)
    if (mode === "task_completion" || mode === "time-window") {
      triggerCelebration()
      return
    }
    setProofModal({ taskId: task.id, mode })
  }

  const handleProofSubmit = (_submission: TaskVerificationSubmission) => {
    setProofModal(null)
    triggerCelebration()
  }

  const saveProfile = () => {
    const toNumber = (value: string) => {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }

    let payload: Record<string, unknown> = {}
    if (archetype === "savings") {
      payload = {
        currency: profileDraft.currency || "USD",
        targetAmount: toNumber(profileDraft.targetAmount),
        currentAmount: toNumber(profileDraft.currentAmount),
        weeklyContribution: toNumber(profileDraft.weeklyContribution),
      }
    } else if (archetype === "marathon") {
      payload = {
        targetLongRunKm: toNumber(profileDraft.targetLongRunKm),
        currentLongRunKm: toNumber(profileDraft.currentLongRunKm),
        totalWeeks: toNumber(profileDraft.totalWeeks),
        completedWeeks: toNumber(profileDraft.completedWeeks),
      }
    } else if (archetype === "daily_habit") {
      payload = {
        targetStreak: toNumber(profileDraft.targetStreak),
        currentStreak: toNumber(profileDraft.currentStreak),
        dailyTarget: toNumber(profileDraft.dailyTarget),
      }
    }

    const validation = validateArchetypeProfile(archetype, payload)
    if (!validation.ok) {
      toast({
        title: "Invalid goal settings",
        description: validation.message,
        variant: "destructive",
      })
      return
    }

    setIsSavingProfile(true)
    updateGoal.mutate(
      { goal_archetype: archetype, goal_profile_json: JSON.stringify(payload) },
      { onSettled: () => setIsSavingProfile(false) },
    )
  }

  return (
    <div className="min-h-screen pt-16 pb-20">
      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Header & Progress */}
        <div className="mb-5 rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-5">
            <div className="flex items-center gap-2.5">
              <button onClick={() => router.back()} className="mr-1 rounded-lg p-1.5 transition-colors hover:bg-background">
                <ArrowLeft className="h-4.5 w-4.5 text-muted-foreground" />
              </button>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sand">
                <Target className="h-4.5 w-4.5 text-espresso" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">{goal.name}</h2>
                <p className="text-xs text-muted-foreground">{goal.category}</p>
              </div>
            </div>

            {/* Meta badges */}
            <div className="mt-3 flex flex-wrap gap-2 pl-[3.25rem]">
              <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-espresso">
                <Target className="h-3 w-3" />
                {archetype.replace("_", " ")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-espresso">
                {goal.accountabilityType?.replace("_", " ") || "Task Completion"}
              </span>
            </div>
          </div>

          {/* Progress bar preview */}
          <div className="px-5 py-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium">{progressModel.title}</span>
              <span>{completedCount}/{goal.tasks.length} tasks completed</span>
            </div>

            {goal.aiPlan?.milestones && goal.aiPlan.milestones.length > 0 ? (
              <>
                <div className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-sand">
                  {goal.aiPlan.milestones.map((milestone, i) => {
                    const colors = [
                      "bg-amber-400",
                      "bg-orange-400",
                      "bg-rose-400",
                      "bg-emerald-400",
                      "bg-sky-400",
                    ];
                    const totalWeight = goal.aiPlan!.milestones.reduce((s, m) => s + (m.progress_weight || 0), 0) || 100;
                    return (
                      <div
                        key={i}
                        className={`${colors[i % colors.length]} transition-all`}
                        style={{ width: `${(milestone.progress_weight / totalWeight) * 100}%` }}
                        title={`${milestone.name} (${milestone.progress_weight}%)`}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 flex justify-between">
                  {goal.aiPlan.milestones.map((m, i) => (
                    <span key={i} className="text-[10px] text-muted-foreground font-medium">
                      {m.progress_weight}%
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-sand">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressModel.percent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
                  />
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-[10px] text-muted-foreground">{progressModel.helper}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">{Math.round(progressModel.percent)}%</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 rounded-2xl border border-border bg-card p-1.5 overflow-x-auto">
          <div className="flex min-w-max gap-1">
            <button
              onClick={() => setActiveTab("this-week")}
              className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${activeTab === "this-week" ? "bg-sand text-espresso shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground"}`}
            >
              <span className="inline-flex items-center justify-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />This Week</span>
            </button>
            <button
              onClick={() => setActiveTab("full-plan")}
              className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${activeTab === "full-plan" ? "bg-sand text-espresso shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground"}`}
            >
              <span className="inline-flex items-center justify-center gap-1.5"><ListChecks className="h-3.5 w-3.5" />Full Plan</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${activeTab === "settings" ? "bg-sand text-espresso shadow-sm" : "text-muted-foreground hover:bg-background hover:text-foreground"}`}
            >
              <span className="inline-flex items-center justify-center gap-1.5"><Settings2 className="h-3.5 w-3.5" />Settings</span>
            </button>
          </div>
        </div>

        {activeTab === "this-week" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-card"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-bold text-foreground">Tasks This Week</h2>
            </div>

            <div className="space-y-0">
              {groupedWeekTasks.map((group, mIdx) => (
                <div
                  key={group.label}
                  className="border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{group.label}</h3>
                    {group.label !== "TODAY" ? <AlertCircle className="h-3 w-3 text-amber-500" /> : null}
                  </div>
                  <div className="px-5 pb-4">
                    {group.tasks.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 bg-background/30 px-4 py-3 text-xs text-muted-foreground text-center">
                        No tasks scheduled.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {group.tasks.map((task, tIdx) => {
                          const mode = resolveVerificationMode(task, goal.accountabilityType || undefined)
                          const isDone = task.status === "completed"
                          return (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: tIdx * 0.05, duration: 0.2 }}
                              className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 transition-all hover:bg-background/80"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2.5">
                                  <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${isDone ? "border-emerald-500 bg-emerald-500" : "border-taupe/40 bg-transparent"}`}>
                                    {isDone && <CheckCircle2 className="h-3 w-3 text-white" />}
                                  </div>
                                  <div>
                                    <p className={`text-xs font-semibold ${isDone ? "text-emerald-700/70 line-through dark:text-emerald-400/50" : "text-foreground"}`}>{task.name}</p>
                                  </div>
                                </div>

                                {!isDone && (
                                  <button
                                    onClick={() => handleTaskAction(task)}
                                    className="shrink-0 rounded-md bg-sand px-2.5 py-1 text-[10px] font-bold text-espresso transition-colors hover:bg-sand/80 shadow-sm"
                                  >
                                    {actionLabelForMode(mode)}
                                  </button>
                                )}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5 ml-[1.65rem]">
                                <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso">
                                  <Clock className="h-2.5 w-2.5" />
                                  60min
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso">
                                  {mode === "voice" ? <Mic className="h-2.5 w-2.5" /> : <Target className="h-2.5 w-2.5" />}
                                  {mode.replace("_", " ")}
                                </span>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "full-plan" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-card"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-bold text-foreground">Full Plan</h2>
            </div>
            <div className="space-y-0">
              {goal.aiPlan?.milestones && goal.aiPlan.milestones.reduce((acc, m) => acc + (m.task_count || 0), 0) === goal.tasks.length ? (
                goal.aiPlan.milestones.map((milestone, mIdx) => {
                  const pastTasksCount = goal.aiPlan!.milestones.slice(0, mIdx).reduce((acc, m) => acc + (m.task_count || 0), 0);
                  const milestoneTasks = goal.tasks.slice(pastTasksCount, pastTasksCount + (milestone.task_count || 0));

                  const isCollapsed = collapsedMilestones[mIdx]

                  return (
                    <motion.div
                      key={mIdx}
                      className="border-b border-border last:border-b-0"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: mIdx * 0.08, duration: 0.3 }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleMilestone(mIdx)}
                        className="flex w-full items-start gap-3 px-5 pt-4 pb-2 transition-colors hover:bg-background/50 text-left"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sand">
                          <Trophy className="h-3.5 w-3.5 text-espresso" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-foreground">{milestone.name}</h3>
                            <span className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                              Week {milestone.target_week}
                              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{milestone.description}</p>
                        </div>
                      </button>

                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 pl-14">
                              <div className="space-y-2">
                                {milestoneTasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5 transition-colors hover:bg-background/80"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-start gap-2.5">
                                        <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${task.status === "completed" ? "border-emerald-500 bg-emerald-500" : "border-taupe/40 bg-transparent"}`}>
                                          {task.status === "completed" && <CheckCircle2 className="h-3 w-3 text-white" />}
                                        </div>
                                        <div>
                                          <p className={`text-xs font-semibold ${task.status === "completed" ? "text-emerald-700/70 line-through dark:text-emerald-400/50" : "text-foreground"}`}>{task.name}</p>
                                          {task.description && (
                                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                                              {task.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1.5 ml-6">
                                      <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso uppercase tracking-wider">
                                        {task.status}
                                      </span>
                                      {task.repeat_frequency && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso capitalize">
                                          <Repeat className="h-2.5 w-2.5" />
                                          {task.repeat_frequency.replace("biweekly", "every 2 weeks")}
                                        </span>
                                      )}
                                      {task.cadenceDays && task.cadenceDays.length > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso capitalize">
                                          <Calendar className="h-2.5 w-2.5" />
                                          {task.cadenceDays.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}
                                        </span>
                                      )}
                                      <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso">
                                        <Clock className="h-2.5 w-2.5" />
                                        {task.timeWindowDurationMinutes || 60}min
                                      </span>
                                      <span className="inline-flex items-center rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso capitalize">
                                        {resolveVerificationMode(task, goal.accountabilityType || undefined).replace("_", " ")}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })
              ) : (
                <div className="px-5 py-4 space-y-2">
                  {goal.tasks.map((task, tIdx) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(tIdx * 0.03, 0.3) }}
                      className="rounded-xl border border-border/50 bg-background/50 px-3 py-2.5 transition-colors hover:bg-background/80"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${task.status === "completed" ? "border-emerald-500 bg-emerald-500" : "border-taupe/40 bg-transparent"}`}>
                          {task.status === "completed" && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${task.status === "completed" ? "text-emerald-700/70 line-through dark:text-emerald-400/50" : "text-foreground"}`}>{task.name}</p>
                          {task.description && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{task.description}</p>
                          )}
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso uppercase tracking-wider">
                              {task.status}
                            </span>
                            {task.repeat_frequency && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso capitalize">
                                <Repeat className="h-2.5 w-2.5" />
                                {task.repeat_frequency.replace("biweekly", "every 2 weeks")}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso capitalize">
                              {resolveVerificationMode(task, goal.accountabilityType || undefined).replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="rounded-2xl border border-border bg-card"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-bold text-foreground">Goal Profile</h2>
            </div>
            <div className="p-5">
              {(archetype === "savings" || archetype === "marathon" || archetype === "daily_habit") && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {archetype === "savings" && (
                    <>
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">Currency</span>
                        <input className={inputBase} placeholder="USD" value={profileDraft.currency} onChange={(e) => setProfileDraft((prev) => ({ ...prev, currency: e.target.value }))} />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">Target Amount</span>
                        <input className={inputBase} type="number" value={profileDraft.targetAmount} onChange={(e) => setProfileDraft((prev) => ({ ...prev, targetAmount: e.target.value }))} />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">Current Amount</span>
                        <input className={inputBase} type="number" value={profileDraft.currentAmount} onChange={(e) => setProfileDraft((prev) => ({ ...prev, currentAmount: e.target.value }))} />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">Weekly Contribution</span>
                        <input className={inputBase} type="number" value={profileDraft.weeklyContribution} onChange={(e) => setProfileDraft((prev) => ({ ...prev, weeklyContribution: e.target.value }))} />
                      </label>
                    </>
                  )}
                  {archetype === "marathon" && (
                    <>
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">Current Long Run (km)</span>
                        <input className={inputBase} type="number" value={profileDraft.currentLongRunKm} onChange={(e) => setProfileDraft((prev) => ({ ...prev, currentLongRunKm: e.target.value }))} />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">Target Long Run (km)</span>
                        <input className={inputBase} type="number" value={profileDraft.targetLongRunKm} onChange={(e) => setProfileDraft((prev) => ({ ...prev, targetLongRunKm: e.target.value }))} />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">Total Weeks</span>
                        <input className={inputBase} type="number" value={profileDraft.totalWeeks} onChange={(e) => setProfileDraft((prev) => ({ ...prev, totalWeeks: e.target.value }))} />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">Completed Weeks</span>
                        <input className={inputBase} type="number" value={profileDraft.completedWeeks} onChange={(e) => setProfileDraft((prev) => ({ ...prev, completedWeeks: e.target.value }))} />
                      </label>
                    </>
                  )}
                  {archetype === "daily_habit" && (
                    <>
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">Target Streak</span>
                        <input className={inputBase} type="number" value={profileDraft.targetStreak} onChange={(e) => setProfileDraft((prev) => ({ ...prev, targetStreak: e.target.value }))} />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">Current Streak</span>
                        <input className={inputBase} type="number" value={profileDraft.currentStreak} onChange={(e) => setProfileDraft((prev) => ({ ...prev, currentStreak: e.target.value }))} />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">Daily Target</span>
                        <input className={inputBase} type="number" value={profileDraft.dailyTarget} onChange={(e) => setProfileDraft((prev) => ({ ...prev, dailyTarget: e.target.value }))} />
                      </label>
                    </>
                  )}
                </div>
              )}
              <div className="mt-5 flex justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={isSavingProfile}
                  className="rounded-lg bg-espresso px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-espresso/90 disabled:opacity-60 shadow-sm"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <TaskVerificationModal
          isOpen={!!proofModal}
          onClose={() => setProofModal(null)}
          taskName={goal.tasks.find((task) => task.id === proofModal?.taskId)?.name || ""}
          mode={proofModal?.mode || "photo"}
          onSubmit={handleProofSubmit}
        />

        <AnimatePresence>
          {showCelebration ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            >
              <div className="text-center">
                <p className="text-4xl">🎉</p>
                <p className="mt-2 font-semibold text-white">Great job!</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}
