'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Plus, ArrowRight, Target, Heart, BookOpen, Briefcase, Home, Palette } from 'lucide-react';

interface GoalDraft {
  title: string;
  description: string;
  category: string;
  frequency: string;
}

interface DraftReviewStepProps {
  drafts: GoalDraft[];
  partnerName: string;
  onSelectDraft: (draft: GoalDraft) => void;
  onCreateNew: () => void;
}

const categoryIcons: { [key: string]: React.ElementType } = {
  health: Target,
  relationship: Heart,
  learning: BookOpen,
  career: Briefcase,
  home: Home,
  creative: Palette,
};

export default function DraftReviewStep({ drafts, partnerName, onSelectDraft, onCreateNew }: DraftReviewStepProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="text-center"
    >
      <motion.h2 variants={itemVariants} className="text-3xl font-bold text-gray-900 mb-2">
        {partnerName} got a head start!
      </motion.h2>
      <motion.p variants={itemVariants} className="text-lg text-gray-600 mb-8">
        Your new partner suggested these goals. Would you like to begin with one of these?
      </motion.p>

      <div className="space-y-4 mb-8">
        {drafts.map((draft, index) => {
          const Icon = categoryIcons[draft.category] || Target;
          return (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
              className="cursor-pointer"
              onClick={() => onSelectDraft(draft)}
            >
              <Card className="text-left hover:shadow-xl transition-shadow border-2 hover:border-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{draft.title}</CardTitle>
                        <CardDescription>{draft.description}</CardDescription>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-800">
                      Choose
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div variants={itemVariants}>
        <Button variant="ghost" onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          No thanks, I'd like to create a new goal from scratch
        </Button>
      </motion.div>
    </motion.div>
  );
}
