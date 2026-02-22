'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Menu, Target, X } from 'lucide-react';

export default function LandingNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { scrollY } = useScroll();
  const borderOpacity = useTransform(scrollY, [0, 50], [0, 1]);

  return (
    <motion.header
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 right-0 top-0 z-50 bg-landing-cream/85 backdrop-blur-xl"
    >
      <motion.div className="absolute bottom-0 left-0 right-0 h-px bg-landing-clay" style={{ opacity: borderOpacity }} />

      <div className="container mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2">
          <Target className="h-6 w-6 text-landing-terracotta transition-transform duration-300 hover:rotate-90" />
          <span className="text-lg font-black tracking-tight text-landing-espresso sm:text-xl">DuoTrak</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-landing-clay bg-white/80 text-landing-espresso lg:hidden"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <nav className="hidden items-center gap-5 lg:flex">
          <a href="#features" className="text-xs font-bold uppercase tracking-[0.13em] text-landing-espresso-light hover:text-landing-terracotta">
            Features
          </a>
          <a href="#how-it-works" className="text-xs font-bold uppercase tracking-[0.13em] text-landing-espresso-light hover:text-landing-terracotta">
            How it works
          </a>
          <Link href="/login" className="text-xs font-bold uppercase tracking-[0.13em] text-landing-espresso-light hover:text-landing-terracotta">
            Log in
          </Link>
          <Link href="/signup">
            <Button className="h-10 rounded-xl bg-landing-espresso px-5 text-xs font-bold uppercase tracking-[0.12em] text-landing-cream hover:bg-landing-terracotta">
              Get started
            </Button>
          </Link>
        </nav>
      </div>

      {isOpen && (
        <div className="border-t border-landing-clay/70 bg-white/95 px-4 py-4 shadow-md lg:hidden">
          <nav className="flex flex-col gap-3">
            <a
              href="#features"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-landing-clay/70 px-3 py-2 text-sm font-semibold text-landing-espresso-light"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-landing-clay/70 px-3 py-2 text-sm font-semibold text-landing-espresso-light"
            >
              How it works
            </a>
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-landing-clay/70 px-3 py-2 text-sm font-semibold text-landing-espresso-light"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-landing-espresso px-3 py-2 text-center text-sm font-bold text-landing-cream"
            >
              Get started
            </Link>
          </nav>
        </div>
      )}
    </motion.header>
  );
}
