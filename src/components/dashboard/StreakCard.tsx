'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlameIcon } from '../ui/icons';

// A single sparkling particle
const Particle = ({ x, y, duration, size }: { x: number; y: number; duration: number; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-yellow-400"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
    }}
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{
      opacity: [0, 1, 0],
      y: -50, // Move upwards
      scale: [0.5, 1, 0.5],
    }}
    transition={{
      duration,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatDelay: Math.random() * 2 + 1,
    }}
  />
);

// Generate a set of particles
const particles = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  x: Math.random() * 90 + 5, // Random horizontal position
  y: Math.random() * 40 + 60, // Start from the bottom half
  duration: Math.random() * 1.5 + 1.5,
  size: Math.random() * 3 + 2,
}));

const StreakCard = ({ streak }: { streak: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm overflow-hidden"
    >
      {/* Particles in the background */}
      <AnimatePresence>
        {particles.map(p => (
          <Particle key={p.id} {...p} />
        ))}
      </AnimatePresence>

      <div className="z-10 flex flex-col gap-0">
        <p className="font-bold text-charcoal">Streak</p>
        <p className="text-5xl font-extrabold text-charcoal">{streak}</p>
        <p className="text-sm text-stone-gray">days</p>
      </div>

      <motion.div
        className="z-10 text-orange-500"
        animate={{
          scale: [1, 1.08, 1],
          filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <FlameIcon className="h-20 w-20" />
      </motion.div>
    </motion.div>
  );
};

export default StreakCard;
