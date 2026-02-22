'use client';

import React from 'react';
import { motion } from 'framer-motion';
import GoogleIcon from '../icons/google-icon';

interface GoogleSignInButtonProps {
  onClick: () => void;
  text: string;
  disabled?: boolean;
}

const GoogleSignInButton = ({ onClick, text, disabled }: GoogleSignInButtonProps) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.99 }}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-landing-clay bg-landing-cream px-4 text-sm font-semibold text-landing-espresso transition-colors hover:bg-landing-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-terracotta focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <GoogleIcon />
      {text}
    </motion.button>
  );
};

export default GoogleSignInButton;
