'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useTransform, type Variants } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Camera, CheckCircle2, Flame } from 'lucide-react';

function PhoneMockup({ side, children }: { side: 'left' | 'right'; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: side === 'left' ? -3 : 3 }}
      animate={{ opacity: 1, y: 0, rotate: side === 'left' ? -3 : 3 }}
      transition={{ duration: 1, delay: side === 'left' ? 0.6 : 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-[180px] sm:w-[200px] h-[360px] sm:h-[400px] bg-white border border-landing-clay rounded-[24px] overflow-hidden shadow-xl"
    >
      {/* Phone notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-landing-sand rounded-b-xl z-10" />
      {/* Phone content */}
      <div className="p-4 pt-8 h-full flex flex-col gap-3 bg-landing-cream">
        {children}
      </div>
    </motion.div>
  );
}

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const textVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <section ref={ref} className="relative min-h-[90vh] flex items-center bg-landing-cream overflow-hidden px-6 sm:px-8 lg:px-12 pt-10">
      {/* Background glow */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-1/4 right-[-10%] w-[50vw] h-[50vw] rounded-full opacity-20 filter blur-[100px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #C4704B 0%, transparent 60%)'
        }}
      />

      <div className="container mx-auto max-w-7xl relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-6 items-center">
        {/* Text side */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ y: textY, opacity }}
        >
          <motion.div variants={textVariants} className="overflow-hidden mb-2">
            <span className="inline-block px-3 py-1 mb-6 text-xs font-bold tracking-[0.2em] text-landing-cream bg-landing-espresso uppercase">
              Real Accountability
            </span>
          </motion.div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.85] text-landing-espresso mb-8">
            <motion.span variants={textVariants} className="block">Goals stick</motion.span>
            <motion.span variants={textVariants} className="block">when someone&apos;s</motion.span>
            <motion.span variants={textVariants} className="block text-landing-terracotta">watching.</motion.span>
          </h1>

          <motion.p variants={textVariants} className="max-w-xl text-lg md:text-xl font-light text-landing-espresso-light leading-relaxed mb-10 pl-1 border-l-2 border-landing-clay ml-2">
            Pair up with a friend. Set a goal. Prove you did it — with a photo. No more lying to an app.
          </motion.p>

          <motion.div variants={textVariants} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 ml-2">
            <Link href="/signup">
              <Button size="lg" className="bg-landing-espresso text-landing-cream hover:bg-landing-terracotta rounded-none text-lg font-bold uppercase tracking-widest px-8 py-7 border-2 border-transparent transition-all duration-300 hover:shadow-[8px_8px_0px_#D4C8BB] hover:-translate-y-2 hover:-translate-x-2 group">
                Get Started — It&apos;s Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <div className="flex items-center gap-4 text-landing-espresso-light">
              <span className="w-12 h-[1px] bg-landing-clay"></span>
              <span className="text-sm tracking-widest uppercase font-semibold">No credit card needed</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Phone mockups side */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="hidden lg:flex items-center justify-center gap-[-20px] relative"
        >
          {/* Left phone - "You" */}
          <PhoneMockup side="left">
            <div className="text-[10px] font-bold text-landing-terracotta uppercase tracking-widest mb-1">You</div>
            <div className="text-xs text-landing-espresso font-semibold mb-3">Morning Run — Day 14</div>
            {/* Simulated photo proof */}
            <div className="relative bg-gradient-to-br from-landing-terracotta/10 to-landing-sand rounded-lg h-28 flex items-center justify-center mb-2 border border-landing-clay">
              <Camera className="h-8 w-8 text-landing-terracotta/40" />
              <div className="absolute bottom-1 right-1 bg-landing-sage rounded-full p-0.5">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-landing-sage" />
              <span className="text-[10px] text-landing-espresso-light">Verified • 7:32 AM</span>
            </div>
            {/* Streak bar */}
            <div className="mt-auto">
              <div className="flex items-center gap-1 mb-1">
                <Flame className="h-3 w-3 text-landing-terracotta" />
                <span className="text-[10px] text-landing-espresso-light font-bold">14 day streak</span>
              </div>
              <div className="h-1.5 w-full bg-landing-sand rounded-full overflow-hidden">
                <div className="h-full w-[70%] bg-gradient-to-r from-landing-terracotta to-landing-gold rounded-full" />
              </div>
            </div>
          </PhoneMockup>

          <div className="-ml-6 z-10">
            <PhoneMockup side="right">
              <div className="text-[10px] font-bold text-landing-sage uppercase tracking-widest mb-1">Your Partner</div>
              <div className="text-xs text-landing-espresso font-semibold mb-3">Morning Run — Day 14</div>
              {/* Partner waiting state */}
              <div className="bg-landing-sand/50 rounded-lg h-28 flex flex-col items-center justify-center mb-2 border border-landing-clay border-dashed">
                <div className="w-8 h-8 rounded-full border-2 border-landing-clay border-t-landing-terracotta animate-spin mb-2" />
                <span className="text-[10px] text-landing-espresso-light">Waiting for proof...</span>
              </div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-landing-gold" />
                <span className="text-[10px] text-landing-espresso-light">Last active • 6:58 AM</span>
              </div>
              {/* Streak bar */}
              <div className="mt-auto">
                <div className="flex items-center gap-1 mb-1">
                  <Flame className="h-3 w-3 text-landing-terracotta" />
                  <span className="text-[10px] text-landing-espresso-light font-bold">13 day streak</span>
                </div>
                <div className="h-1.5 w-full bg-landing-sand rounded-full overflow-hidden">
                  <div className="h-full w-[65%] bg-gradient-to-r from-landing-gold to-landing-terracotta rounded-full" />
                </div>
              </div>
            </PhoneMockup>
          </div>

          {/* Connecting line between phones */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-[2px] bg-gradient-to-r from-landing-terracotta to-landing-sage opacity-30 z-20" />
        </motion.div>
      </div>
    </section>
  );
}
