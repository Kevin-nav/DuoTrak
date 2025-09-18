'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Dumbbell, Book, Heart, Sparkles, Home, Briefcase, Palette, Plane, DollarSign, Target } from "lucide-react";

interface GoalDiscoveryStepProps {
  data: { selectedCategories: string[] };
  updateData: (updates: any) => void;
  onValidationChange: (isValid: boolean) => void;
}

const CATEGORIES = [
  {
    id: "fitness",
    title: "Fitness & Health",
    description: "Exercise routines, healthy eating, wellness goals",
    icon: Dumbbell,
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    selectedBg: "bg-red-100",
    selectedBorder: "border-red-400",
  },
  {
    id: "learning",
    title: "Learning & Growth",
    description: "New skills, languages, courses, reading",
    icon: Book,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    selectedBg: "bg-blue-100",
    selectedBorder: "border-blue-400",
  },
  {
    id: "career",
    title: "Career & Work",
    description: "Professional development, projects, networking",
    icon: Briefcase,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    selectedBg: "bg-purple-100",
    selectedBorder: "border-purple-400",
  },
  {
    id: "relationship",
    title: "Relationship",
    description: "Date nights, communication, shared experiences",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    selectedBg: "bg-pink-100",
    selectedBorder: "border-pink-400",
  },
  {
    id: "home",
    title: "Home & Lifestyle",
    description: "Organization, cooking, home improvement",
    icon: Home,
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    selectedBg: "bg-green-100",
    selectedBorder: "border-green-400",
  },
  {
    id: "creative",
    title: "Creative & Hobbies",
    description: "Art, music, writing, crafts, photography",
    icon: Palette,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    selectedBg: "bg-orange-100",
    selectedBorder: "border-orange-400",
  },
  {
    id: "travel",
    title: "Travel & Adventure",
    description: "Trip planning, exploring, outdoor activities",
    icon: Plane,
    color: "text-cyan-500",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    selectedBg: "bg-cyan-100",
    selectedBorder: "border-cyan-400",
  },
  {
    id: "financial",
    title: "Financial Goals",
    description: "Saving, budgeting, investments, debt reduction",
    icon: DollarSign,
    color: "text-emerald-500",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    selectedBg: "bg-emerald-100",
    selectedBorder: "border-emerald-400",
  },
];

export default function GoalDiscoveryStep({ data, updateData, onValidationChange }: GoalDiscoveryStepProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(data.selectedCategories || []);

  const toggleCategory = (categoryId: string) => {
    const newSelection = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(newSelection);
    updateData({ selectedCategories: newSelection });
  };

  useEffect(() => {
    onValidationChange(selectedCategories.length > 0);
  }, [selectedCategories, onValidationChange]);

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <Target className="w-8 h-8 text-blue-500" />
          <h2 className="text-3xl font-bold text-gray-900">What areas interest you?</h2>
        </div>
        <p className="text-lg text-gray-600 mb-2">
          Select the categories that resonate with your goals and aspirations.
        </p>
        <p className="text-sm text-gray-500">
          Choose as many as you'd like - this helps us suggest relevant goals for you and your partner.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {CATEGORIES.map((category, index) => {
          const isSelected = selectedCategories.includes(category.id);

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleCategory(category.id)}
              className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? `${category.selectedBg} ${category.selectedBorder} shadow-md`
                  : `${category.bgColor} ${category.borderColor} hover:shadow-sm`
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${isSelected ? "bg-white shadow-sm" : category.bgColor}`}>
                  <category.icon className={`w-6 h-6 ${category.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">{category.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{category.description}</p>
                </div>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}>
                    ✓
                  </motion.div>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {selectedCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Great choices! ({selectedCategories.length} selected)</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Based on your interests, we'll suggest personalized goals that you and your partner can work on together.
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((categoryId) => {
              const category = CATEGORIES.find((c) => c.id === categoryId);
              return category ? (
                <span
                  key={categoryId}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200"
                >
                  <category.icon className={`w-4 h-4 ${category.color}`} />
                  {category.title}
                </span>
              ) : null;
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
