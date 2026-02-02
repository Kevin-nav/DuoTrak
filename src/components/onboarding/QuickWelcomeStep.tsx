'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Star, Users, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/contexts/UserContext';

interface QuickWelcomeStepProps {
    data: { nickname: string };
    updateData: (updates: { nickname: string }) => void;
    onValidationChange: (isValid: boolean) => void;
}

export default function QuickWelcomeStep({
    data,
    updateData,
    onValidationChange,
}: QuickWelcomeStepProps) {
    const { userDetails } = useUser();
    const [nickname, setNickname] = useState(data.nickname || '');

    useEffect(() => {
        // Always valid - nickname is optional
        onValidationChange(true);
    }, [onValidationChange]);

    const handleNicknameChange = (value: string) => {
        setNickname(value);
        updateData({ nickname: value });
    };

    const partnerName = userDetails?.partner_full_name || 'Your partner';

    return (
        <div className="text-center max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Celebration animation */}
                <motion.div
                    className="relative inline-block mb-6"
                    animate={{
                        y: [0, -10, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg">
                        <Heart className="w-12 h-12 text-white" fill="white" />
                    </div>
                    {/* Sparkles around */}
                    <motion.div
                        className="absolute -top-2 -right-2"
                        animate={{ scale: [1, 1.3, 1], rotate: [0, 15, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <Sparkles className="w-8 h-8 text-yellow-400" />
                    </motion.div>
                    <motion.div
                        className="absolute -bottom-2 -left-2"
                        animate={{ scale: [1, 1.2, 1], rotate: [0, -15, 0] }}
                        transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }}
                    >
                        <Star className="w-6 h-6 text-yellow-400" fill="#facc15" />
                    </motion.div>
                </motion.div>

                {/* Main heading */}
                <motion.h1
                    className="text-4xl font-bold text-[var(--theme-foreground)] mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    You're partnered with {partnerName}! 🎉
                </motion.h1>

                <motion.p
                    className="text-lg text-[var(--theme-muted-foreground)] mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    Day 1 of your Partner Streak starts now!
                </motion.p>

                {/* XP Banner */}
                <motion.div
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-3 rounded-full mb-10 border border-purple-200"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                >
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="font-bold text-purple-700">+50 XP</span>
                    <span className="text-purple-600">for joining!</span>
                </motion.div>

                {/* Quick Profile */}
                <motion.div
                    className="bg-[var(--theme-card)] rounded-2xl p-8 border border-[var(--theme-border)] shadow-sm"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <div className="flex items-center gap-4 mb-6">
                        <Avatar className="w-16 h-16 ring-4 ring-purple-100">
                            <AvatarImage src={userDetails?.profile_picture_url ?? undefined} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold">
                                {userDetails?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                            <h3 className="font-semibold text-[var(--theme-foreground)]">
                                {userDetails?.full_name || 'Welcome!'}
                            </h3>
                            <p className="text-sm text-[var(--theme-muted-foreground)]">
                                {userDetails?.email}
                            </p>
                        </div>
                    </div>

                    <div className="text-left">
                        <label className="block text-sm font-medium text-[var(--theme-foreground)] mb-2">
                            Nickname for {partnerName} to use{' '}
                            <span className="text-[var(--theme-muted-foreground)] font-normal">
                                (optional)
                            </span>
                        </label>
                        <Input
                            placeholder="e.g., Alex, Bestie, Partner"
                            value={nickname}
                            onChange={(e) => handleNicknameChange(e.target.value)}
                            className="text-lg py-6"
                        />
                        <p className="text-xs text-[var(--theme-muted-foreground)] mt-2">
                            This is what your partner will see when cheering you on
                        </p>
                    </div>
                </motion.div>

                {/* Partner connection indicator */}
                <motion.div
                    className="flex items-center justify-center gap-3 mt-8 text-[var(--theme-muted-foreground)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                >
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                        Partners who set goals together are{' '}
                        <span className="font-semibold text-green-600">3x more likely</span>{' '}
                        to succeed!
                    </span>
                </motion.div>
            </motion.div>
        </div>
    );
}
