'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, Camera, Quote } from 'lucide-react';

const stats = [
    { value: '1,200+', label: 'Goals tracked', icon: <TrendingUp className="h-5 w-5" /> },
    { value: '92%', label: 'Streak completion rate', icon: <Camera className="h-5 w-5" /> },
    { value: '2x', label: 'More consistent with a partner', icon: <Users className="h-5 w-5" /> },
];

const testimonials = [
    {
        quote: "I tried every habit app out there. The difference with DuoTrak? My sister actually sees if I skipped my morning run. Haven't missed a day in 3 months.",
        name: 'Amara K.',
        role: 'Fitness enthusiast',
    },
    {
        quote: "My study partner and I use DuoTrak to keep each other on track for exams. The photo proof is genius — you can't fake a library selfie at 6am.",
        name: 'Daniel M.',
        role: 'University student',
    },
    {
        quote: "We built a 60-day streak together before I even realized it. Having someone who genuinely cares about your progress changes everything.",
        name: 'Priya S.',
        role: 'Product designer',
    },
];

export default function SocialProofSection() {
    return (
        <section className="relative overflow-hidden border-t border-landing-clay bg-landing-cream py-20 sm:py-24 md:py-28">
            {/* Subtle glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-[40vw] bg-landing-terracotta/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-7xl relative z-10">
                {/* Stats bar */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mb-14 grid grid-cols-1 gap-4 sm:gap-5 md:mb-20 md:grid-cols-3"
                >
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group border border-landing-clay/50 bg-white p-5 text-center shadow-sm transition-all duration-500 hover:border-landing-terracotta/30 sm:p-7"
                        >
                            <div className="flex items-center justify-center gap-2 text-landing-terracotta mb-3">
                                {stat.icon}
                            </div>
                            <div className="mb-2 text-3xl font-black tracking-tighter text-landing-espresso sm:text-4xl md:text-5xl">
                                {stat.value}
                            </div>
                            <div className="text-landing-espresso-light font-medium text-sm uppercase tracking-widest">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Testimonials */}
                <div className="mb-16">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="mb-4 text-3xl font-black tracking-tighter text-landing-espresso sm:text-4xl md:text-5xl"
                    >
                        Real people. Real results.
                    </motion.h3>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="h-1 w-24 bg-landing-terracotta origin-left mb-16"
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            className="group flex flex-col border-l-2 border-landing-terracotta/30 bg-white p-5 shadow-sm transition-all duration-500 hover:border-landing-terracotta sm:p-7"
                        >
                            <Quote className="h-6 w-6 text-landing-terracotta/20 mb-4 group-hover:text-landing-terracotta transition-colors duration-300" />
                            <p className="text-landing-espresso-light text-base leading-relaxed mb-6 flex-1 font-medium">
                                &ldquo;{testimonial.quote}&rdquo;
                            </p>
                            <div className="border-t border-landing-clay/50 pt-4">
                                <p className="text-landing-espresso font-bold text-sm">{testimonial.name}</p>
                                <p className="text-landing-espresso-light text-xs uppercase tracking-widest">{testimonial.role}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
