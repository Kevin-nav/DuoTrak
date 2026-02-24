"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Lightbulb, Target, Sparkles, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { useOnboardingPlan } from "@/hooks/useGoals";
import { toast } from "sonner";

interface IntelligentGoalCreationStepProps {
  onPlanGenerated: (plan: any) => void;
}

const GOAL_SUGGESTIONS = {
    fitness: [
      { key: "5k_run", title: "Complete a 5k Run Together", description: "Train together for a 5k race, following a structured plan from couch to 5k." },
      { key: "yoga", title: "Master Yoga Basics", description: "Follow a 30-day online yoga course together, practicing daily poses and flows." },
      { key: "steps", title: "Achieve 10,000 Steps Daily", description: "Commit to walking at least 10,000 steps every day, sharing your progress and encouraging each other." },
    ],
    learning: [
      { key: "language", title: "Learn Conversational Spanish", description: "Use a language app like Duolingo daily and practice speaking with each other for 15 minutes." },
      { key: "new_skill", title: "Become Proficient in a New Skill", description: "Choose a skill (e.g., coding, photography, cooking) and complete an online course together." },
      { key: "reading", title: "Read a Book a Month", description: "Each pick a book and discuss your key takeaways and favorite parts at the end of the month." },
    ],
    relationship: [
      { key: "date_night", title: "Plan a Weekly 'No-Phone' Date Night", description: "Dedicate one evening a week to a special activity with no digital distractions." },
      { key: "gratitude", title: "Start a Daily Gratitude Journal", description: "Each day, write down one thing you appreciate about your partner and share it." },
      { key: "listening", title: "Master the Art of Active Listening", description: "Practice structured listening exercises to improve communication and deepen your connection." },
    ],
    mindfulness: [
      { key: "meditation", title: "Practice Daily Meditation", description: "Start with 5 minutes of guided meditation each morning and gradually increase the time." },
      { key: "digital_detox", title: "Digital Detox Sundays", description: "Spend every Sunday completely offline, focusing on hobbies, nature, and each other." },
      { key: "morning_routine", title: "Mindful Morning Routine", description: "Create and follow a calming morning routine that includes stretching, journaling, or quiet reflection." },
    ],
    financial: [
      { key: "emergency_fund", title: "Build a $1,000 Emergency Fund", description: "Work together to save $1,000 by setting a weekly savings goal and tracking your progress." },
      { key: "budgeting", title: "Create and Stick to a Monthly Budget", description: "Use a budgeting app to track your spending and ensure you stay within your financial plan." },
      { key: "cooking_challenge", title: "Cook at Home Challenge", description: "Commit to cooking a certain number of meals at home each week to save money on dining out." },
    ],
  };

export default function IntelligentGoalCreationStep({ onPlanGenerated }: IntelligentGoalCreationStepProps) {
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [contextualAnswers, setContextualAnswers] = useState<any>({});
  const onboardingPlanMutation = useOnboardingPlan();

  const handleGoalSelect = (goal: any) => {
    setSelectedGoal(goal);
  };

  const handleAnswerChange = (key: string, value: string) => {
    setContextualAnswers((prev: any) => ({ ...prev, [key]: value }));
  };

  const generatePlan = () => {
    const request = {
      goalTitle: selectedGoal.title,
      goalDescription: selectedGoal.description,
      contextualAnswers: contextualAnswers,
    };

    onboardingPlanMutation.mutate(request, {
      onSuccess: (data) => {
        toast.success("Your personalized plan is ready!");
        onPlanGenerated({
          ...data,
          selectedGoal: {
            title: selectedGoal.title,
            description: selectedGoal.description,
            category: data?.goalType || "general",
            frequency: "daily",
          },
        });
      },
      onError: (error) => {
        toast.error("Could not generate a plan. Please try again.", {
          description: error.message,
        });
      },
    });
  };


  const renderContextualQuestions = () => {
    if (!selectedGoal) return null;

    switch (selectedGoal.key) {
      case "cooking_challenge":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Any dietary preferences?</label>
              <Input placeholder="e.g., vegetarian, gluten-free" onChange={(e) => handleAnswerChange("dietary", e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comfort level in the kitchen?</label>
              <Input placeholder="e.g., Beginner, Intermediate, Pro" onChange={(e) => handleAnswerChange("comfortLevel", e.target.value)} />
            </div>
          </div>
        );
      case "digital_detox":
        return (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What are your biggest digital distractions?</label>
                    <Input placeholder="e.g., social media, news apps" onChange={(e) => handleAnswerChange("distractions", e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What offline activities do you enjoy?</label>
                    <Input placeholder="e.g., hiking, reading, board games" onChange={(e) => handleAnswerChange("offlineActivities", e.target.value)} />
                </div>
            </div>
        );
      default:
        return <p className="text-sm text-gray-600">No specific questions for this goal. Ready to generate your plan?</p>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {!selectedGoal ? (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-center">Choose a Goal to Start</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.values(GOAL_SUGGESTIONS).flat().map((goal) => (
                            <motion.div
                                key={goal.key}
                                whileHover={{ scale: 1.05 }}
                                className="p-4 border rounded-lg cursor-pointer"
                                onClick={() => handleGoalSelect(goal)}
                            >
                                <h3 className="font-semibold">{goal.title}</h3>
                                <p className="text-sm text-gray-600">{goal.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center">A Few More Details</h2>
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <h3 className="font-semibold">{selectedGoal.title}</h3>
                        <p className="text-sm text-gray-600">{selectedGoal.description}</p>
                    </div>
                    {renderContextualQuestions()}
                    <Button onClick={generatePlan} className="w-full">
                        Generate My Personalized Plan
                    </Button>
                </div>
            )}
        </motion.div>
    </div>
  );
}
