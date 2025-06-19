'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { removeAuthCookie } from '@/lib/auth';
import { DuoTrakLogo, NotificationIcon, UserIcon } from '../ui/icons';
import ProfileDropdown from './ProfileDropdown';

const TopNavbar = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This check runs only on the client-side
    const hasCookie = document.cookie.includes('auth_token');
    setIsAuthenticated(hasCookie);
  }, []);

  const handleLogout = () => {
    removeAuthCookie();
    setIsAuthenticated(false);
    router.push('/login');
    router.refresh(); // Ensures the state is updated across the app
  };

  // Close dropdown when clicking outside
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
    <header className="sticky top-0 z-40 w-full whitespace-nowrap border-b border-solid border-pearl-gray bg-white/80 px-4 py-3 backdrop-blur-sm sm:px-8">
      <div className="container mx-auto flex max-w-2xl items-center justify-between">
        <div className="flex items-center gap-4 text-charcoal">
          <DuoTrakLogo className="size-5 text-charcoal" />
          <h2 className="text-lg font-bold text-charcoal">DuoTrak</h2>
        </div>
        {isAuthenticated && (
          <div className="flex items-center justify-end gap-3">
            <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-pearl-gray text-charcoal transition-colors hover:bg-cool-gray">
              <NotificationIcon />
            </button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(prev => !prev)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-pearl-gray text-charcoal transition-colors hover:bg-cool-gray"
              >
                <UserIcon />
              </button>
              <AnimatePresence>
                {isProfileOpen && (
                  <ProfileDropdown
                    userName="Chris"
                    userImageUrl="https://lh3.googleusercontent.com/a/ACg8ocJ-2a-bV8sE0k3hYcX0z4BexqUSRm82nARgmMlCnuBf=s96-c"
                    onLogout={handleLogout}
                    onProfileClick={() => setIsProfileOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNavbar;
