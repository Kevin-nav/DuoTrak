'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { MorningIcon, WorkoutIcon } from '@/components/ui/icons';
import AnimatedTextCharacter from '@/components/ui/AnimatedTextCharacter';
import StreakCard from '@/components/dashboard/StreakCard';
import { useWelcome } from '@/context/WelcomeContext';

// Animation variants based on dashboard.html
const introAnimation = {
  hidden: { opacity: 0, y: 15 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: delay / 1000, ease: 'easeOut', duration: 0.5 },
  }),
};

const cardAnimation = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: delay / 1000, ease: 'easeOut', duration: 0.4 },
  }),
};

const taskItems = [
  {
    icon: MorningIcon,
    title: 'Wake up by 7 AM',
    category: 'Morning Routine',
  },
  {
    icon: WorkoutIcon,
    title: '30-minute workout',
    category: 'Fitness',
  },
];

export default function DashboardPage() {
  const { hasSeenAnimation, setHasSeenAnimation } = useWelcome();
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  useEffect(() => {
    if (!hasSeenAnimation) {
      const timer = setTimeout(() => {
        setIsGoalModalOpen(true);
        setHasSeenAnimation(true);
      }, 1800); // Delay from HTML
      return () => clearTimeout(timer);
    }
  }, [hasSeenAnimation, setHasSeenAnimation]);

  return (
    <>
      {/* Main Content */}
      <div className="mx-auto max-w-2xl space-y-6 px-4 sm:px-0">
        {/* Welcome Heading */}
        <div className="text-center">
          <AnimatedTextCharacter
            text="Welcome, Chris!"
            className="text-3xl font-bold text-charcoal"
          />
        </div>

        {/* Streak Card */}
        <StreakCard streak={5} />

        {/* Tasks Container */}
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-bold text-charcoal">Today's Tasks</h3>
          {taskItems.map((task, index) => {
            const Icon = task.icon;
            return (
              <motion.div
                key={task.title}
                custom={300 + index * 150}
                variants={introAnimation}
                initial="hidden"
                animate="visible"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="flex items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pearl-gray text-charcoal">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="font-semibold text-charcoal">{task.title}</p>
                </div>
                <Button variant="secondary" size="sm">View Details</Button>
              </motion.div>
            );
          })}
        </div>

        {/* Verification Card */}
        <motion.div
          custom={600}
          variants={cardAnimation}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="flex flex-col items-start gap-4 rounded-xl border border-cool-gray bg-white p-5 shadow-sm sm:flex-row sm:items-center"
        >
          <div className="flex-grow">
            <p className="font-bold text-charcoal">Verification Queue</p>
            <p className="mt-1 text-sm text-stone-gray">
              Your partner has 1 task waiting for your review.
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            View Queue
          </Button>
        </motion.div>
      </div>

      {/* "Create First Goal" Modal */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)}>
        <div className="w-full max-w-sm p-6 text-center">
          <h3 className="text-lg font-bold text-charcoal">
            Ready to set your first goal?
          </h3>
          <p className="mt-2 text-sm text-stone-gray">
            This is where the magic happens. Let's define a goal and break it
            down into daily tasks.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              onClick={() => setIsGoalModalOpen(false)}
            >
              Let's Go!
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsGoalModalOpen(false)}
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
