"use client";

import React from "react";
import { motion } from "framer-motion";

interface TypingIndicatorProps {
    partnerName: string;
    partnerAvatar?: string;
    partnerInitials?: string;
}

export default function TypingIndicator({
    partnerName,
    partnerAvatar,
    partnerInitials,
}: TypingIndicatorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-end gap-1.5 mb-3"
        >
            {/* Avatar */}
            <div className="flex-shrink-0">
                {partnerAvatar ? (
                    <img
                        src={partnerAvatar}
                        alt={partnerName}
                        className="w-6 h-6 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-landing-terracotta to-landing-espresso-light rounded-full flex items-center justify-center text-white text-[10px] font-semibold">
                        {partnerInitials || partnerName.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Typing bubble */}
            <div className="bg-white border border-landing-clay rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
                <div className="flex items-center gap-1">
                    <motion.div
                        className="w-1.5 h-1.5 bg-landing-espresso-light rounded-full"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0
                        }}
                    />
                    <motion.div
                        className="w-1.5 h-1.5 bg-landing-espresso-light rounded-full"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.2
                        }}
                    />
                    <motion.div
                        className="w-1.5 h-1.5 bg-landing-espresso-light rounded-full"
                        animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.4
                        }}
                    />
                </div>
            </div>
        </motion.div>
    );
}
