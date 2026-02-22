'use client';

import { motion } from 'framer-motion';
import { Camera, Users, CalendarDays, MessageCircle } from 'lucide-react';

const features = [
  {
    icon: <Camera className="h-10 w-10" />,
    title: 'Photo Proof',
    description: 'Snap a photo of your completed task. Your partner sees it instantly. No more self-reported check-ins — if you didn\'t photograph it, it didn\'t happen.',
    colSpan: 'col-span-12 md:col-span-7',
    color: 'border-landing-terracotta',
    offset: 'md:mt-0',
  },
  {
    icon: <Users className="h-10 w-10" />,
    title: 'Real Partner',
    description: 'A real human who cares about your progress and calls you out when you slack. You can trick an app — you can\'t trick a friend.',
    colSpan: 'col-span-12 md:col-span-5',
    color: 'border-landing-sage',
    offset: 'md:mt-24',
  },
  {
    icon: <CalendarDays className="h-10 w-10" />,
    title: 'Streak Tracking',
    description: 'A visual calendar that shows exactly when you showed up and when you didn\'t. Shared with your partner so you both stay honest.',
    colSpan: 'col-span-12 md:col-span-6',
    color: 'border-landing-gold',
    offset: 'md:-mt-12 md:ml-12 relative z-10',
  },
  {
    icon: <MessageCircle className="h-10 w-10" />,
    title: 'Partner Chat',
    description: 'Celebrate wins together, talk through setbacks, and keep the motivation alive. A dedicated space for your accountability duo.',
    colSpan: 'col-span-12 md:col-span-6',
    color: 'border-landing-clay',
    offset: 'md:mt-16',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden border-t border-landing-clay bg-landing-cream py-20 sm:py-24 md:py-28">
      {/* Dynamic background lines */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-[20%] left-[-10%] w-[120%] h-[1px] bg-landing-terracotta rotate-[-5deg]"></div>
        <div className="absolute top-[60%] left-[-10%] w-[120%] h-[1px] bg-landing-sage rotate-[3deg]"></div>
      </div>

      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl relative z-10">
        <div className="mb-14 md:mb-20 md:w-2/3">
          <motion.h2
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl font-black uppercase leading-[0.9] tracking-tighter text-landing-espresso sm:text-5xl md:text-7xl"
          >
            Built for Two
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 max-w-lg text-base text-landing-espresso-light sm:text-lg"
          >
            Everything you need to keep each other accountable — nothing you don&apos;t.
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="h-1 w-32 bg-landing-terracotta mt-6 origin-left"
          />
        </div>

        <div className="grid grid-cols-12 gap-4 sm:gap-5 md:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className={`${feature.colSpan} ${feature.offset} group border-l-4 ${feature.color} bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:bg-landing-sand sm:p-7 md:p-12`}
            >
              <div className="mb-8 opacity-40 group-hover:opacity-100 transition-opacity duration-300 text-landing-espresso">
                {feature.icon}
              </div>
              <h3 className="mb-4 text-2xl font-black uppercase leading-none tracking-tight text-landing-espresso sm:text-3xl lg:text-4xl">
                {feature.title}
              </h3>
              <p className="text-base font-medium leading-relaxed text-landing-espresso-light group-hover:text-landing-espresso sm:text-lg">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
