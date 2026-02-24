"use client"

import { motion, AnimatePresence, type Variants } from "framer-motion"
import { Plus, Target, Search, Edit, Copy, Archive } from "lucide-react"
import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useArchiveGoal, useDuplicateGoal, useGoals } from "@/hooks/useGoals"
import DashboardLayout from "./dashboard-layout"
import MouseGlowEffect from "./mouse-glow-effect"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import React from "react"
import { DomainGoal } from "../../packages/domain/src/goals"

// Define a type alias to avoid confusion
type Goal = DomainGoal;

export default function GoalsHome() {
  const { data: goals = [], isLoading, isError } = useGoals();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const archiveGoalMutation = useArchiveGoal();
  const duplicateGoalMutation = useDuplicateGoal();
  const [goalToArchive, setGoalToArchive] = React.useState<Goal | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleEditGoal = (e: React.MouseEvent, goal: Goal) => {
    e.stopPropagation();
    e.preventDefault();
    router.push(`/goals/${goal.id}/edit`);
  };

  const handleDuplicateGoal = (e: React.MouseEvent, goal: Goal) => {
    e.stopPropagation();
    e.preventDefault();
    duplicateGoalMutation.mutate(goal.id, {
      onSuccess: () => {
        toast({
          title: "Goal Duplicated",
          description: "The goal has been successfully duplicated.",
        });
        queryClient.invalidateQueries({ queryKey: ["goals"] });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Could not duplicate the goal. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const promptArchiveGoal = (e: React.MouseEvent, goal: Goal) => {
    e.stopPropagation();
    e.preventDefault();
    setGoalToArchive(goal);
  };

  const confirmArchiveGoal = () => {
    if (!goalToArchive) return;

    archiveGoalMutation.mutate(goalToArchive.id, {
      onSuccess: () => {
        toast({
          title: "Goal Archived",
          description: "The goal has been successfully archived.",
        });
        queryClient.invalidateQueries({ queryKey: ["goals"] });
        setGoalToArchive(null);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Could not archive the goal. Please try again.",
          variant: "destructive",
        });
        setGoalToArchive(null);
      },
    });
  };

  const filteredGoals = useMemo(() => {
    return goals.filter((goal: Goal) =>
      goal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (goal.category && goal.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [goals, searchQuery]);


  const getStatusText = (goal: Goal) => {
    // Simple status text based on the backend calculation
    return goal.status === "Completed" ? "Completed" : "On Track";
  };

  const getStatusLabel = (status: string) => {
    return status === "Completed" ? "Done" : "Active";
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">Loading goals...</div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-red-500">Error fetching goals.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-charcoal dark:text-gray-100 mb-2">Your Goals</h1>
              <p className="text-stone-gray dark:text-gray-300">Track your progress and achieve your dreams</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/goals/new-ai")}
              className="hidden items-center gap-2 rounded-lg bg-primary-blue px-4 py-2 text-sm font-semibold text-white hover:bg-primary-blue-hover sm:inline-flex"
            >
              <Plus className="h-4 w-4" />
              Create Goal with AI
            </button>
          </div>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => router.push("/goals/new")}
              className="text-xs font-semibold text-primary-blue underline-offset-2 hover:underline"
            >
              Use classic wizard
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-cool-gray dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-gray dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-cool-gray dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-charcoal dark:text-gray-100 focus:border-primary-blue focus:outline-none"
            />
          </div>
        </motion.div>

        <AnimatePresence>
          <motion.div
            key="goals-list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="space-y-4"
          >
            {filteredGoals.length > 0 ? (
              filteredGoals.map((goal: Goal) => {
                const Icon = Target; // Placeholder
                const progressPercentage = goal.total > 0 ? (goal.progress / goal.total) * 100 : 0;

                return (
                  <Link href={`/goals/${goal.id}`} key={goal.id}>
                    <MouseGlowEffect glowColor={goal.color || "#8B5CF6"} intensity="medium">
                      <motion.div
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-cool-gray dark:border-gray-700 group cursor-pointer"
                      >
                        <div className="flex items-start space-x-4">
                          <motion.div
                            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${goal.color || '#8B5CF6'}20` }}
                          >
                            <Icon className="w-6 h-6" style={{ color: goal.color || "#8B5CF6" }} />
                          </motion.div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-charcoal dark:text-gray-100 truncate">{goal.name}</h3>
                                <p className="text-sm text-stone-gray dark:text-gray-400">
                                  {goal.category} • {goal.isHabit ? 'Habit' : 'Project'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => handleEditGoal(e, goal)}
                                  className="p-2 hover:bg-cool-gray dark:hover:bg-gray-700 rounded-lg transition-colors"
                                  title="Edit Goal"
                                >
                                  <Edit className="w-4 h-4 text-stone-gray dark:text-gray-400" />
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => handleDuplicateGoal(e, goal)}
                                  className="p-2 hover:bg-cool-gray dark:hover:bg-gray-700 rounded-lg transition-colors"
                                  title="Duplicate Goal"
                                >
                                  <Copy className="w-4 h-4 text-stone-gray dark:text-gray-400" />
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => promptArchiveGoal(e, goal)}
                                  className="p-2 hover:bg-cool-gray dark:hover:bg-gray-700 rounded-lg transition-colors"
                                  title="Archive Goal"
                                >
                                  <Archive className="w-4 h-4 text-stone-gray dark:text-gray-400" />
                                </motion.button>
                              </div>
                              <span className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full">
                                {getStatusText(goal)} · {getStatusLabel(goal.status)}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-stone-gray dark:text-gray-400">Progress</span>
                                <span className="text-sm font-semibold text-charcoal dark:text-gray-100">
                                  {goal.progress}/{goal.total}
                                </span>
                              </div>
                              <div className="relative h-2 bg-cool-gray dark:bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressPercentage}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: goal.color || "#8B5CF6" }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </MouseGlowEffect>
                  </Link>
                );
              })
            ) : (
              <motion.div variants={itemVariants} className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-cool-gray dark:border-gray-700">
                <Target className="w-16 h-16 text-primary-blue mx-auto mb-4" />
                <h3 className="text-xl font-bold text-charcoal dark:text-gray-100 mb-2">
                  {searchQuery ? `No goals found for "${searchQuery}"` : "No goals yet"}
                </h3>
                <p className="text-stone-gray dark:text-gray-300 mb-6">
                  {searchQuery ? "Try adjusting your search." : "Start building new habits and achieving your dreams!"}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        <AlertDialog open={!!goalToArchive} onOpenChange={() => setGoalToArchive(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive "{goalToArchive?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This was a commitment you made. Archiving this goal means giving up on it for now. Your partner might be disappointed. Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Nevermind</AlertDialogCancel>
              <AlertDialogAction onClick={confirmArchiveGoal}>Yes, Archive It</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="fixed bottom-24 right-6 z-40 sm:hidden">
          <motion.button
            onClick={() => router.push("/goals/new-ai")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 bg-primary-blue hover:bg-primary-blue-hover text-white rounded-full shadow-lg flex items-center justify-center"
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </DashboardLayout>
  );
}

