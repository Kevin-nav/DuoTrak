"use client";

import { motion } from 'framer-motion';

const loaderContainerVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
};

const circleContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const circleVariants = {
  initial: {
    opacity: 0,
    scale: 0,
  },
  animate: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: [0, -20, 0],
    transition: {
      delay: i * 0.1,
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  }),
};

export default function DashboardLoader() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-off-white dark:bg-charcoal">
      <motion.div
        variants={loaderContainerVariants}
        initial="initial"
        animate="animate"
        className="flex flex-col items-center"
      >
        <motion.div
          variants={circleContainerVariants}
          className="flex items-center space-x-2"
        >
          <motion.div
            custom={1}
            variants={circleVariants}
            className="h-5 w-5 rounded-full bg-primary-blue"
          />
          <motion.div
            custom={2}
            variants={circleVariants}
            className="h-5 w-5 rounded-full bg-stone-gray"
          />
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 text-base font-medium text-stone-gray dark:text-cool-gray"
        >
          Loading your dashboard...
        </motion.p>
      </motion.div>
    </div>
  );
}
