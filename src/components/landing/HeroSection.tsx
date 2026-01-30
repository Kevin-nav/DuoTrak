'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import HeroIllustration from './HeroIllustration';

export default function HeroSection() {
  return (
    <section className="bg-[var(--theme-background)] dark:bg-[var(--theme-background)]">
      <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
        <div className="mr-auto place-self-center lg:col-span-7">
          <h1 className="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl text-[var(--theme-foreground)]">
            Welcome to <span className="text-[var(--theme-primary)]">DuoTrak</span>
          </h1>
          <p className="max-w-2xl mb-6 font-light text-[var(--theme-muted-foreground)] lg:mb-8 md:text-lg lg:text-xl">
            Your Ambition, Amplified. DuoTrak is a dedicated success system that transforms solitary goals into a shared, unstoppable mission with a dedicated accountability partner.
          </p>
          <div className="flex items-center space-x-4">
            <Link href="/signup">
              <Button size="lg" className="bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] hover:bg-[var(--theme-primary)]/90 shadow-lg hover:shadow-xl transition-all btn-hover-lift">
                Get Started for Free
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="border-[var(--theme-border)] text-[var(--theme-foreground)] hover:bg-[var(--theme-accent)] transition-all">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
        <div className="hidden lg:mt-0 lg:col-span-5 lg:flex">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
