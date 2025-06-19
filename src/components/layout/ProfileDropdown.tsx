'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ProfileDropdownProps {
  userName: string;
  userImageUrl: string;
  onLogout: () => void;
  onProfileClick: () => void;
}

const dropdownVariants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const ProfileDropdown = ({ userName, userImageUrl, onLogout, onProfileClick }: ProfileDropdownProps) => {
  return (
    <motion.div
      variants={dropdownVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="absolute top-full right-0 mt-2 w-56 origin-top-right rounded-xl bg-white p-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
    >
      <div className="flex items-center gap-3 border-b border-pearl-gray px-3 py-2">
        <div
          className="h-10 w-10 rounded-full bg-cover bg-center"
          style={{ backgroundImage: `url('${userImageUrl}')` }}
        />
        <div className="flex-grow">
          <p className="font-semibold text-charcoal truncate">{userName}</p>
          <Link href="/profile" onClick={onProfileClick} className="text-sm text-stone-gray hover:underline">
            View Profile
          </Link>
        </div>
      </div>
      <div className="py-1">
        <button
          onClick={onLogout}
          className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-pearl-gray rounded-md"
        >
          Logout
        </button>
      </div>
    </motion.div>
  );
};

export default ProfileDropdown;
