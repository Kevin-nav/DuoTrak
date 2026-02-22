'use client';

import { HeartHandshake, ShieldCheck, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const values = [
  {
    icon: HeartHandshake,
    title: 'Supportive Partnership',
    description: 'Goals feel lighter when someone is in it with you.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest Accountability',
    description: 'Proof-based check-ins keep progress real and transparent.',
  },
  {
    icon: Trophy,
    title: 'Celebrate Consistency',
    description: 'Small daily wins build momentum that lasts.',
  },
];

export default function ValuesStrip() {
  return (
    <section className="border-y border-landing-clay bg-white/80 py-8 sm:py-10">
      <div className="container mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:gap-4 sm:px-6 lg:px-10">
        {values.map((value, index) => {
          const Icon = value.icon;
          return (
            <motion.article
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="rounded-2xl border border-landing-clay/70 bg-landing-cream/70 p-4 shadow-sm sm:p-5"
            >
              <div className="mb-3 inline-flex rounded-lg bg-white p-2">
                <Icon className="h-4 w-4 text-landing-terracotta sm:h-5 sm:w-5" />
              </div>
              <h3 className="text-base font-bold tracking-tight text-landing-espresso sm:text-lg">{value.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-landing-espresso-light">{value.description}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
