'use client';

import { motion } from 'framer-motion';
import { UserIcon, GoalsIcon, FlameIcon } from '@/components/ui/icons';

const steps = [
  {
    icon: <UserIcon className="h-12 w-12 text-primary-blue" />,
    title: 'Find Your Partner',
    description: 'Connect with a friend, colleague, or fellow creator. This is a focused, private space for two.',
  },
  {
    icon: <GoalsIcon className="h-12 w-12 text-primary-blue" />,
    title: 'Build Your Plan',
    description: 'Our AI Duo Planner turns your ambitions into a concrete, step-by-step daily plan.',
  },
  {
    icon: <FlameIcon className="h-12 w-12 text-primary-blue" />,
    title: 'Start Your Journey',
    description: 'With a clear plan and a dedicated partner, your success is not just possible—it’s inevitable.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-charcoal">How It Works</h2>
          <p className="text-lg text-slate-600 mt-4 max-w-2xl mx-auto">
            Getting started with DuoTrak is simple. Here’s your path to success.
          </p>
        </div>
        <div className="relative">
          {/* Dotted line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center text-center p-6 bg-white rounded-lg z-10"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true, amount: 0.5 }}
              >
                <div className="bg-primary-blue/10 p-4 rounded-full mb-6">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold text-charcoal mb-3">{step.title}</h3>
                <p className="text-slate-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
