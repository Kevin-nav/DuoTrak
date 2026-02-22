'use client';

import { motion } from 'framer-motion';
import { UserPlus, Target, Camera } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: <UserPlus className="h-8 w-8 text-white" />,
    title: 'Pick your partner',
    description: 'Invite a friend, a sibling, a coworker — anyone who won\'t let you off the hook. Send them a link and lock in your duo.',
    color: 'bg-landing-espresso',
  },
  {
    num: '02',
    icon: <Target className="h-8 w-8 text-white" />,
    title: 'Set a shared goal',
    description: 'Choose what you want to achieve together. Morning workouts, reading, study sessions — break it down into daily check-ins.',
    color: 'bg-landing-terracotta',
  },
  {
    num: '03',
    icon: <Camera className="h-8 w-8 text-white" />,
    title: 'Prove it with a photo',
    description: 'Did you do it? Show it. Upload a photo as proof and your partner will see exactly what you accomplished. No faking it.',
    color: 'bg-landing-sage',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative border-t border-landing-clay bg-white py-20 sm:py-24 md:py-28">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
        <div className="relative mb-14 flex flex-col justify-between gap-4 md:mb-20 md:flex-row md:items-end">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-black uppercase tracking-tighter text-landing-espresso sm:text-5xl md:text-8xl"
          >
            How It
            <br />
            Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-1 max-w-xs text-left text-sm font-medium text-landing-espresso-light sm:text-base md:mt-0 md:text-right"
          >
            Three steps. That&apos;s it. No complicated setup, no learning curve.
          </motion.p>
        </div>

        <div className="relative">
          {/* Vertical axis line */}
          <div className="absolute left-8 top-0 bottom-0 w-[1px] bg-landing-clay hidden md:block"></div>

          <div className="relative z-10 flex flex-col gap-12 sm:gap-16 md:gap-24">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 group">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", bounce: 0.4, duration: 0.8, delay: 0.1 }}
                  className={`${step.color} relative z-10 shrink-0 rounded-xl p-5 transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2 sm:p-6 md:p-8`}
                >
                  {step.icon}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex w-full flex-col items-start justify-between border-b border-landing-clay/50 pb-7 transition-colors duration-500 group-hover:border-landing-terracotta md:flex-row md:items-center md:pb-8"
                >
                  <div className="max-w-xl">
                    <div className="absolute -z-10 -ml-3 -mt-8 text-6xl font-black tracking-tighter text-landing-clay opacity-40 transition-all duration-300 group-hover:translate-x-3 group-hover:text-landing-sand sm:text-7xl md:-ml-8 md:-mt-16 md:text-9xl">
                      {step.num}
                    </div>
                    <h3 className="mb-3 text-2xl font-black uppercase tracking-tight text-landing-espresso sm:text-3xl md:mb-4 md:text-5xl">{step.title}</h3>
                    <p className="text-base font-medium text-landing-espresso-light sm:text-lg md:text-xl">{step.description}</p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
