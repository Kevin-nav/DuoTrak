'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';

export default function TopNavbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { userDetails } = useUser();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileRef]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3"
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/dashboard" passHref>
          <motion.div
            className="flex items-center space-x-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Image src="/navbar-logo.png" alt="DuoTrak Logo" width={32} height={32} />
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">DuoTrak</h1>
          </motion.div>
        </Link>

        {userDetails && (
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6 text-gray-500 dark:text-gray-300" />
            </motion.button>

            <div className="relative" ref={profileRef}>
              <motion.button
                onClick={() => setIsProfileOpen(prev => !prev)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="p-1 rounded-full bg-primary-blue hover:bg-blue-600 transition-colors"
                aria-label="User Profile"
              >
                <User className="w-6 h-6 text-white" />
              </motion.button>
              <AnimatePresence>
                {isProfileOpen && (
                  <ProfileDropdown
                    userName={userDetails?.full_name || userDetails?.email || 'User'}
                    userImageUrl=""
                    onProfileClick={() => setIsProfileOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </motion.header>
  );
}