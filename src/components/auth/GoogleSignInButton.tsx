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
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-cool-gray rounded-xl bg-white text-charcoal hover:bg-pearl-gray transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <GoogleIcon />
      {text}
    </motion.button>
  );
};

export default GoogleSignInButton;
