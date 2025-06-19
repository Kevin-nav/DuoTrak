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
  <div className="flex items-center gap-2 text-sm">
    <div className="w-4 h-4 flex items-center justify-center">
      <AnimatePresence>
        {met ? (
          <motion.svg
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-4 h-4 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        ) : (
          <div className="w-2 h-2 rounded-full bg-stone-gray" />
        )}
      </AnimatePresence>
    </div>
    <span className={met ? 'text-charcoal' : 'text-stone-gray'}>{children}</span>
  </div>
);

const PasswordStrength = ({ criteria }: PasswordStrengthProps) => {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-2 rounded-lg bg-pearl-gray/60">
      <Requirement met={criteria.minLength}>8+ characters</Requirement>
      <Requirement met={criteria.hasUpper}>1 uppercase</Requirement>
      <Requirement met={criteria.hasNumber}>1 number</Requirement>
      <Requirement met={criteria.hasSymbol}>1 symbol</Requirement>
    </div>
  );
};

export default PasswordStrength;
