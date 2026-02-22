'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ValidationCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

interface PasswordStrengthProps {
  criteria: ValidationCriteria;
}

const Requirement = ({ met, children }: { met: boolean; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-xs sm:text-sm">
    <div className="flex h-4 w-4 items-center justify-center">
      <AnimatePresence>
        {met ? (
          <motion.svg
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-4 w-4 text-landing-sage"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        ) : (
          <div className="h-2 w-2 rounded-full bg-landing-clay" />
        )}
      </AnimatePresence>
    </div>
    <span className={met ? 'font-medium text-landing-espresso' : 'text-landing-espresso-light'}>{children}</span>
  </div>
);

const PasswordStrength = ({ criteria }: PasswordStrengthProps) => {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-landing-clay/70 bg-landing-cream/80 p-3">
      <Requirement met={criteria.minLength}>8+ characters</Requirement>
      <Requirement met={criteria.hasUpper}>1 uppercase</Requirement>
      <Requirement met={criteria.hasNumber}>1 number</Requirement>
      <Requirement met={criteria.hasSymbol}>1 symbol</Requirement>
    </div>
  );
};

export default PasswordStrength;
