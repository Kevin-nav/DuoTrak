'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { useRef } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Camera, CheckCircle2, Flame, Users } from 'lucide-react';

function PhoneMockup({ side, children }: { side: 'left' | 'right'; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, rotate: side === 'left' ? -3 : 3 }}
      animate={{ opacity: 1, y: 0, rotate: side === 'left' ? -3 : 3 }}
      transition={{ duration: 0.8, delay: side === 'left' ? 0.35 : 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-[360px] w-[180px] overflow-hidden rounded-[24px] border border-landing-clay bg-white shadow-xl sm:h-[390px] sm:w-[198px]"
    >
      <div className="absolute left-1/2 top-0 z-10 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-landing-sand" />
      <div className="flex h-full flex-col gap-3 bg-landing-cream p-4 pt-8">{children}</div>
    </motion.div>
  );
}

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section
      ref={ref}
      className="relative flex min-h-[92vh] items-center overflow-hidden bg-landing-cream px-4 pb-12 pt-6 sm:px-6 lg:px-10"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="pointer-events-none absolute right-[-15%] top-[8%] h-[62vw] w-[62vw] rounded-full opacity-20 blur-[110px]"
        style={{ background: 'radial-gradient(circle, #C4704B 0%, transparent 60%)' }}
      />

      <div className="container relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-9 lg:grid-cols-2 lg:gap-6">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ y: textY, opacity }}>
          <motion.div variants={textVariants} className="mb-2 overflow-hidden">
            <span className="inline-flex items-center gap-2 rounded-full border border-landing-clay bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-landing-espresso-light sm:text-xs">
              <Users className="h-3.5 w-3.5 text-landing-sage" />
              Accountability built for two
            </span>
          </motion.div>

          <h1 className="mb-6 text-[clamp(2.2rem,9vw,5.5rem)] font-black leading-[0.9] tracking-tighter text-landing-espresso">
            <motion.span variants={textVariants} className="block">
              Goals stick
            </motion.span>
            <motion.span variants={textVariants} className="block">
              when someone is
            </motion.span>
            <motion.span variants={textVariants} className="block text-landing-terracotta">
              cheering you on.
            </motion.span>
          </h1>

          <motion.p
            variants={textVariants}
            className="mb-7 max-w-xl border-l-2 border-landing-clay pl-3 text-base font-medium leading-relaxed text-landing-espresso-light sm:text-lg"
          >
            Pair up with a friend. Set a goal. Prove your progress with photos. DuoTrak keeps goals honest, human, and fun.
          </motion.p>

          <motion.div variants={textVariants} className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
            <Link href="/signup">
              <Button
                size="lg"
                className="h-12 rounded-xl bg-landing-espresso px-6 text-sm font-bold uppercase tracking-[0.13em] text-landing-cream transition-all hover:-translate-y-1 hover:bg-landing-terracotta sm:h-13 sm:px-7"
              >
                Start free
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-landing-espresso-light sm:text-sm">
              No credit card required
            </span>
          </motion.div>

          <div className="mt-6 grid w-full max-w-xl grid-cols-2 gap-3 sm:gap-4 lg:hidden">
            <article className="rounded-xl border border-landing-clay/70 bg-white/80 p-3 shadow-sm sm:p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-landing-terracotta sm:text-xs">Photo Proof</p>
              <p className="mt-2 text-xs text-landing-espresso-light sm:text-sm">Show what got done and stay accountable together.</p>
            </article>
            <article className="rounded-xl border border-landing-clay/70 bg-white/80 p-3 shadow-sm sm:p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-landing-sage sm:text-xs">Shared Streaks</p>
              <p className="mt-2 text-xs text-landing-espresso-light sm:text-sm">Celebrate consistency and recover quickly after missed days.</p>
            </article>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden items-center justify-center lg:flex"
        >
          <div className="relative flex items-center">
            <PhoneMockup side="left">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-landing-terracotta">You</div>
              <div className="mb-3 text-xs font-semibold text-landing-espresso">Morning run - day 14</div>
              <div className="relative mb-2 flex h-28 items-center justify-center rounded-lg border border-landing-clay bg-gradient-to-br from-landing-terracotta/10 to-landing-sand">
                <Camera className="h-8 w-8 text-landing-terracotta/45" />
                <div className="absolute bottom-1 right-1 rounded-full bg-landing-sage p-0.5">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="mb-2 flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-landing-sage" />
                <span className="text-[10px] text-landing-espresso-light">Verified at 7:32 AM</span>
              </div>
              <div className="mt-auto">
                <div className="mb-1 flex items-center gap-1">
                  <Flame className="h-3 w-3 text-landing-terracotta" />
                  <span className="text-[10px] font-bold text-landing-espresso-light">14 day streak</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-landing-sand">
                  <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-landing-terracotta to-landing-gold" />
                </div>
              </div>
            </PhoneMockup>

            <div className="-ml-6 z-10">
              <PhoneMockup side="right">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-landing-sage">Partner</div>
                <div className="mb-3 text-xs font-semibold text-landing-espresso">Morning run - day 14</div>
                <div className="mb-2 flex h-28 flex-col items-center justify-center rounded-lg border border-dashed border-landing-clay bg-landing-sand/50">
                  <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-landing-clay border-t-landing-terracotta" />
                  <span className="text-[10px] text-landing-espresso-light">Waiting for proof...</span>
                </div>
                <div className="mb-2 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-landing-gold" />
                  <span className="text-[10px] text-landing-espresso-light">Last active 6:58 AM</span>
                </div>
                <div className="mt-auto">
                  <div className="mb-1 flex items-center gap-1">
                    <Flame className="h-3 w-3 text-landing-terracotta" />
                    <span className="text-[10px] font-bold text-landing-espresso-light">13 day streak</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-landing-sand">
                    <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-landing-gold to-landing-terracotta" />
                  </div>
                </div>
              </PhoneMockup>
            </div>

            <div className="absolute left-1/2 top-1/2 h-[2px] w-16 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-landing-terracotta to-landing-sage opacity-30" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
