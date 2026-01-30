'use client';

import { motion, type Variants } from 'framer-motion';
import { GoalSettingIcon, ProgressTrackingIcon, SharedAccountabilityIcon, ChatIcon, ReflectionIcon, MorningIcon } from '@/components/ui/icons';

const features = [
  {
    icon: <GoalSettingIcon className="h-10 w-10 text-primary-blue" />,
    title: 'From Dream to Daily Practice',
    description: 'Our AI Duo Planner acts as your personal strategist, turning your biggest ambitions into a concrete, step-by-step daily plan. No more guessing—just doing.',
  },
  {
    icon: <ProgressTrackingIcon className="h-10 w-10 text-primary-blue" />,
    title: 'Visualize Your Victory',
    description: 'Watch your consistency come to life on a beautiful Progress Calendar. Track streaks, analyze performance, and stay motivated with a clear view of how far you\'ve come.',
  },
  {
    icon: <SharedAccountabilityIcon className="h-10 w-10 text-primary-blue" />,
    title: 'Proof, Not Promises',
    description: 'With optional photo verification, you build real trust. It’s a powerful, tangible way to ensure true follow-through and celebrate real-world achievements together.',
  },
  {
    icon: <ChatIcon className="h-10 w-10 text-primary-blue" />,
    title: 'A Space to Connect',
    description: 'A rich, integrated chat designed for support. Reply to messages, react to accomplishments, and share images to keep the connection strong and personal.',
  },
  {
    icon: <ReflectionIcon className="h-10 w-10 text-primary-blue" />,
    title: 'Reflect & Grow',
    description: 'End each day with a mindful reflection, tracking not just productivity, but your mood and learnings. Personal growth is more than just checking boxes.',
  },
  {
    icon: <MorningIcon className="h-10 w-10 text-primary-blue" />,
    title: 'An Interface That Inspires Calm',
    description: 'In a world of stressful apps, DuoTrak is your sanctuary. Our warm, minimalist interface is designed to reduce anxiety and make work feel like self-care.',
  },
];

const cardVariants: Variants = {
  offscreen: {
    y: 50,
    opacity: 0,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.4,
      duration: 0.8,
    },
  },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-off-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-charcoal">Features Designed for Real Commitment</h2>
          <p className="text-lg text-slate-600 mt-4 max-w-3xl mx-auto">
            Every feature within DuoTrak is meticulously crafted to foster genuine accountability and turn your goals into achievements.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center"
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.5 }}
              variants={cardVariants}
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-2xl font-bold text-charcoal mb-4">{feature.title}</h3>
              <p className="text-slate-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
