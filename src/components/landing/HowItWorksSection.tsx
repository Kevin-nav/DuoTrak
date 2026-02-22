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
    <section id="how-it-works" className="py-32 bg-white relative border-t border-landing-clay">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between relative mb-24 items-end">
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-6xl md:text-8xl font-black text-landing-espresso uppercase tracking-tighter"
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
            className="text-landing-espresso-light font-medium text-base max-w-xs text-right mt-8 md:mt-0"
          >
            Three steps. That&apos;s it. No complicated setup, no learning curve.
          </motion.p>
        </div>

        <div className="relative">
          {/* Vertical axis line */}
          <div className="absolute left-8 top-0 bottom-0 w-[1px] bg-landing-clay hidden md:block"></div>

          <div className="flex flex-col gap-24 relative z-10">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 group">
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ type: "spring", bounce: 0.4, duration: 0.8, delay: 0.1 }}
                  className={`${step.color} p-6 md:p-8 shrink-0 relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 rounded-sm`}
                >
                  {step.icon}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between w-full border-b border-landing-clay/50 pb-8 group-hover:border-landing-terracotta transition-colors duration-500"
                >
                  <div className="max-w-xl">
                    <div className="text-landing-clay font-black text-7xl md:text-9xl tracking-tighter absolute -z-10 -mt-10 md:-mt-16 -ml-4 md:-ml-8 opacity-40 transition-all duration-300 group-hover:text-landing-sand group-hover:translate-x-4">
                      {step.num}
                    </div>
                    <h3 className="text-3xl md:text-5xl font-black text-landing-espresso mb-4 uppercase tracking-tight">{step.title}</h3>
                    <p className="text-landing-espresso-light text-lg md:text-xl font-medium">{step.description}</p>
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
