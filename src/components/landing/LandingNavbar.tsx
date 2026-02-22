'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Target } from 'lucide-react';

export default function LandingNavbar() {
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 50], [0, 1]);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 bg-landing-cream/80 backdrop-blur-xl transition-colors"
    >
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-landing-clay"
        style={{ opacity: borderOpacity }}
      />
      <div className="container mx-auto flex items-center justify-between h-20 px-6 sm:px-8 lg:px-12 max-w-7xl">
        <Link href="/" className="flex items-center gap-3 group relative overflow-hidden">
          <Target className="h-7 w-7 text-landing-terracotta group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-xl font-extrabold tracking-tight text-landing-espresso group-hover:text-landing-terracotta transition-colors duration-300">
            DuoTrak
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-landing-espresso-light hover:text-landing-terracotta transition-colors duration-300 tracking-wide uppercase">
            Log In
          </Link>
          <Link href="/signup">
            <Button
              className="bg-landing-espresso text-landing-cream hover:bg-landing-terracotta rounded-none font-bold tracking-wider uppercase px-6 py-5 border border-landing-espresso hover:border-landing-terracotta transition-all duration-300 hover:shadow-[4px_4px_0px_#D4C8BB] hover:-translate-y-1 hover:-translate-x-1"
            >
              Get Started
            </Button>
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
