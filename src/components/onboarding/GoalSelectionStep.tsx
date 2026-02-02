'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Target,
    Heart,
    BookOpen,
    Briefcase,
    Home,
    Palette,
    Dumbbell,
    DollarSign,
    ArrowRight,
    Plus,
    Sparkles,
    Zap,
} from 'lucide-react';

interface GoalDraft {
    title: string;
    description: string;
    category: string;
    frequency?: string;
}

interface GoalSelectionStepProps {
    drafts?: GoalDraft[];
    partnerName: string;
    onSelectGoal: (goal: GoalDraft) => void;
    onCreateNew: () => void;
    onValidationChange: (isValid: boolean) => void;
}

const categoryIcons: { [key: string]: React.ElementType } = {
    health: Dumbbell,
    fitness: Dumbbell,
    learning: BookOpen,
    relationship: Heart,
    career: Briefcase,
    home: Home,
    creative: Palette,
    financial: DollarSign,
};

const categoryColors: { [key: string]: string } = {
    health: 'from-red-500 to-orange-500',
    fitness: 'from-red-500 to-orange-500',
    learning: 'from-blue-500 to-indigo-500',
    relationship: 'from-pink-500 to-rose-500',
    career: 'from-purple-500 to-violet-500',
    home: 'from-green-500 to-emerald-500',
    creative: 'from-orange-500 to-yellow-500',
    financial: 'from-emerald-500 to-teal-500',
};

// Popular goals to show when no drafts exist
const popularGoals: GoalDraft[] = [
    {
        title: 'Exercise 3x per week',
        description: 'Build a consistent workout routine together',
        category: 'fitness',
        frequency: 'weekly',
    },
    {
        title: 'Read 1 book per month',
        description: 'Expand your knowledge and share insights',
        category: 'learning',
        frequency: 'monthly',
    },
    {
        title: 'Weekly date night',
        description: 'Dedicate time to strengthen your connection',
        category: 'relationship',
        frequency: 'weekly',
    },
    {
        title: 'Save $500/month',
        description: 'Build your savings together systematically',
        category: 'financial',
        frequency: 'monthly',
    },
    {
        title: 'Learn a new skill',
        description: 'Pick up something new like cooking, coding, or a language',
        category: 'learning',
        frequency: 'daily',
    },
    {
        title: 'Daily meditation',
        description: '10 minutes of mindfulness every day',
        category: 'health',
        frequency: 'daily',
    },
];

export default function GoalSelectionStep({
    drafts = [],
    partnerName,
    onSelectGoal,
    onCreateNew,
    onValidationChange,
}: GoalSelectionStepProps) {
    const [selectedGoal, setSelectedGoal] = useState<GoalDraft | null>(null);
    const hasDrafts = drafts && drafts.length > 0;
    const displayGoals = hasDrafts ? drafts : popularGoals;

    useEffect(() => {
        onValidationChange(selectedGoal !== null);
    }, [selectedGoal, onValidationChange]);

    const handleSelectGoal = (goal: GoalDraft) => {
        setSelectedGoal(goal);
        onSelectGoal(goal);
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {hasDrafts ? (
                    <>
                        <div className="inline-flex items-center gap-2 mb-3 bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
                            <Sparkles className="w-4 h-4" />
                            <span className="font-medium">{partnerName} suggested these!</span>
                        </div>
                        <h2 className="text-3xl font-bold text-[var(--theme-foreground)] mb-2">
                            Pick a goal to start with
                        </h2>
                        <p className="text-[var(--theme-muted-foreground)]">
                            Your partner drafted these goals while waiting for you
                        </p>
                    </>
                ) : (
                    <>
                        <div className="inline-flex items-center gap-2 mb-3 bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
                            <Target className="w-4 h-4" />
                            <span className="font-medium">Popular Goals</span>
                        </div>
                        <h2 className="text-3xl font-bold text-[var(--theme-foreground)] mb-2">
                            Choose your first goal
                        </h2>
                        <p className="text-[var(--theme-muted-foreground)]">
                            Pick a goal or create your own to get started
                        </p>
                    </>
                )}
            </motion.div>

            {/* XP Badge */}
            <motion.div
                className="flex justify-center mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-full border border-purple-200">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                        +100 XP for selecting your first goal!
                    </span>
                </div>
            </motion.div>

            {/* Goal Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
                {displayGoals.map((goal, index) => {
                    const Icon = categoryIcons[goal.category] || Target;
                    const colorClass = categoryColors[goal.category] || 'from-blue-500 to-indigo-500';
                    const isSelected = selectedGoal?.title === goal.title;

                    return (
                        <motion.div
                            key={goal.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card
                                onClick={() => handleSelectGoal(goal)}
                                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${isSelected
                                        ? 'ring-2 ring-purple-500 shadow-lg bg-purple-50'
                                        : 'hover:border-purple-200'
                                    }`}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-sm flex-shrink-0`}
                                        >
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-[var(--theme-foreground)] mb-1">
                                                {goal.title}
                                            </h3>
                                            <p className="text-sm text-[var(--theme-muted-foreground)] line-clamp-2">
                                                {goal.description}
                                            </p>
                                        </div>
                                        <div
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                    ? 'bg-purple-500 border-purple-500'
                                                    : 'border-gray-300'
                                                }`}
                                        >
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="text-white text-xs"
                                                >
                                                    ✓
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            {/* Create Custom Option */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center"
            >
                <Button
                    variant="ghost"
                    onClick={onCreateNew}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create a custom goal instead
                </Button>
            </motion.div>
        </div>
    );
}
