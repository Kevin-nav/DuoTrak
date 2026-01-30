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
      className="fixed top-0 left-0 right-0 z-50 bg-[var(--theme-background)]/80 backdrop-blur-lg border-b border-[var(--theme-border)]"
    >
      <div className="container mx-auto flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <DuoTrakLogo className="h-8 w-auto text-[var(--theme-primary)] group-hover:text-[var(--theme-primary)]/80 transition-colors" />
          <span className="text-xl font-bold text-[var(--theme-foreground)] group-hover:text-[var(--theme-primary)] transition-colors">DuoTrak</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/login"><Button variant="ghost" className="transition-colors hover:text-[var(--theme-primary)] hover:bg-[var(--theme-accent)]">Log In</Button></Link>
          <Link href="/signup"><Button className="bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] hover:bg-[var(--theme-primary)]/90 transition-transform hover:scale-105 btn-hover-lift">Get Started</Button></Link>
        </nav>
      </div>
    </motion.header>
  );
}

