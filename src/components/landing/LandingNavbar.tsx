'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DuoTrakLogo } from '@/components/ui/icons';
import { motion } from 'framer-motion';

export default function LandingNavbar() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200"
    >
      <div className="container mx-auto flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <DuoTrakLogo className="h-8 w-auto text-primary-blue group-hover:text-accent-blue transition-colors" />
          <span className="text-xl font-bold text-charcoal group-hover:text-primary-blue transition-colors">DuoTrak</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/login"><Button variant="ghost" className="transition-colors hover:text-primary-blue">Log In</Button></Link>
          <Link href="/signup"><Button className="transition-transform hover:scale-105">Get Started</Button></Link>
        </nav>
      </div>
    </motion.header>
  );
}

