'use client';

import { motion } from 'framer-motion';
import { EyeOff, FlameKindling, UserX } from 'lucide-react';

const painPoints = [
    {
        icon: <EyeOff className="h-6 w-6" />,
        title: 'You mark it done, but did you really?',
        description: 'Traditional habit trackers trust you to be honest. But when nobody\'s checking, it\'s easy to round up, skip, or just lie.',
    },
    {
        icon: <FlameKindling className="h-6 w-6" />,
        title: 'Streaks break and nobody notices.',
        description: 'You miss a day. Then two. Then a week. Your app doesn\'t care. There\'s no one to pull you back.',
    },
    {
        icon: <UserX className="h-6 w-6" />,
        title: 'Willpower alone isn\'t enough.',
        description: 'Research shows 95% of people who go at it solo fail within 6 months. You\'re not weak — you\'re just alone.',
    },
];

export default function ProblemSection() {
    return (
        <section className="relative overflow-hidden bg-white py-20 sm:py-24 md:py-28">
            {/* Subtle diagonal lines */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
                <div className="absolute top-0 left-0 w-full h-full" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #2C2520, #2C2520 1px, transparent 1px, transparent 40px)',
                }} />
            </div>

            <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="mb-14 text-center sm:mb-16 md:mb-20"
                >
                    <h2 className="mb-4 text-3xl font-black tracking-tighter text-landing-espresso sm:text-4xl md:mb-6 md:text-6xl">
                        You&apos;ve tried tracking alone.
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg font-light text-landing-espresso-light sm:text-xl md:text-2xl">
                        It didn&apos;t work. Here&apos;s why.
                    </p>
                </motion.div>

                <div className="mb-16 grid grid-cols-1 gap-4 sm:gap-6 md:mb-20 md:grid-cols-3">
                    {painPoints.map((point, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-80px" }}
                            transition={{ duration: 0.5, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
                            className="group relative rounded-xl border border-landing-clay/50 bg-landing-cream p-5 transition-all duration-500 hover:border-landing-terracotta/40 sm:p-7 md:p-8"
                        >
                            <div className="text-landing-terracotta/60 mb-6 group-hover:text-landing-terracotta transition-colors duration-300">
                                {point.icon}
                            </div>
                            <h3 className="mb-3 text-lg font-bold tracking-tight text-landing-espresso sm:text-xl">
                                {point.title}
                            </h3>
                            <p className="text-landing-espresso-light font-medium leading-relaxed">
                                {point.description}
                            </p>
                            {/* Number watermark */}
                            <div className="absolute top-4 right-6 text-5xl font-black text-landing-espresso/[0.04] select-none">
                                {String(index + 1).padStart(2, '0')}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Transition */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center"
                >
                    <div className="inline-flex items-center gap-4">
                        <span className="w-12 h-[1px] bg-landing-terracotta/40" />
                        <p className="text-lg md:text-xl font-bold text-landing-terracotta tracking-wide">
                            DuoTrak is different. You have a real partner watching.
                        </p>
                        <span className="w-12 h-[1px] bg-landing-terracotta/40" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
