'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GoogleIcon } from '../ui/icons';

interface GoogleSignInButtonProps {
  onClick: () => void;
  text: string;
}

const GoogleSignInButton = ({ onClick, text }: GoogleSignInButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-cool-gray rounded-xl bg-white text-charcoal font-semibold hover:bg-pearl-gray transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue"
    >
      <GoogleIcon />
      {text}
    </motion.button>
  );
};

export default GoogleSignInButton;
