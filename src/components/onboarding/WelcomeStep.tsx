'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Heart, Target, Users, Zap } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

interface WelcomeStepProps {
  onValidationChange: (isValid: boolean) => void;
}

const FEATURES = [
  {
    icon: Heart,
    title: 'Shared Goals',
    description: 'Create meaningful goals together with your partner',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  {
    icon: Target,
    title: 'Daily Tasks',
    description: 'Break down goals into manageable daily actions',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Users,
    title: 'Partner Support',
    description: 'Encourage each other and celebrate victories',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    description: 'Stay connected with instant progress sharing',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
];

export default function WelcomeStep({ onValidationChange }: WelcomeStepProps) {
  const { userDetails } = useUser();

  useEffect(() => {
    onValidationChange(true);
  }, [onValidationChange]);

  return (
    <div className="text-center max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="mb-8">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
            className="inline-block mb-4"
          >
            <div className="w-20 h-20 bg-gradient-to-r from-[var(--theme-primary)] to-[#D4BCA9] rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Heart className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-[var(--theme-foreground)] mb-4"
          >
            Welcome to DuoTrak, {userDetails?.full_name || 'partner'}!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl text-[var(--theme-muted-foreground)] mb-8 leading-relaxed"
          >
            You have successfully joined {userDetails?.partner_full_name || 'your partner'}.<br />
            Let's get your first goal set up!
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-[var(--theme-card)] rounded-xl p-6 shadow-sm border border-[var(--theme-border)] hover:shadow-md transition-all duration-200 card-hover"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto bg-[var(--theme-muted)]`}>
                <feature.icon className={`w-6 h-6 text-[var(--theme-primary)]`} />
              </div>
              <h3 className="text-lg font-semibold text-[var(--theme-foreground)] mb-2">{feature.title}</h3>
              <p className="text-[var(--theme-muted-foreground)] text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
