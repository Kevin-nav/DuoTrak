'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { HomeIcon, GoalsIcon, PartnerIcon, ProgressIcon } from '../ui/icons';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: HomeIcon },
  { href: '/goals', label: 'Goals', icon: GoalsIcon },
  { href: '/partner', label: 'Partner', icon: PartnerIcon },
  { href: '/progress', label: 'Progress', icon: ProgressIcon },
];

const BottomNavbar = () => {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 border-t border-cool-gray bg-white/80 backdrop-blur-sm">
      <nav className="mx-auto grid max-w-2xl grid-cols-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.label}>
              <div
                className={`flex flex-col items-center justify-center gap-1 pt-2 pb-1 transition-colors w-full h-full ${
                  isActive
                    ? 'text-charcoal'
                    : 'text-stone-gray hover:text-charcoal'
                }`}
              >
                <Icon className="h-6 w-6" />
                <p className={`text-xs ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.label}
                </p>
                <div className={`h-0.5 w-6 rounded-full mt-1 ${isActive ? 'bg-charcoal' : 'bg-transparent'}`} />
              </div>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
};

export default BottomNavbar;
