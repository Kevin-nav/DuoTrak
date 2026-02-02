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
            className="flex items-end gap-2 mb-2"
        >
            {/* Avatar */}
            <div className="flex-shrink-0">
                {partnerAvatar ? (
                    <img
                        src={partnerAvatar}
                        alt={partnerName}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                        {partnerInitials || partnerName.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Typing bubble */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1">
                    <motion.div
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
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
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
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
                        className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
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
