"use client";

import React from "react";
import { motion } from "framer-motion";
import { Reply, Trash2 } from "lucide-react";

interface ReactionPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
    onReply?: () => void;
    onDelete?: () => void;
    position?: "left" | "right";
}

const REACTIONS = ["\u{1F44D}", "\u2764\uFE0F", "\u{1F602}", "\u{1F62E}", "\u{1F622}", "\u{1F525}"];

export default function ReactionPicker({
    onSelect,
    onClose,
    onReply,
    onDelete,
    position = "right",
}: ReactionPickerProps) {
    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Picker */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className={`absolute bottom-full mb-2 z-50 ${position === "right" ? "left-0" : "right-0"
                    }`}
            >
                <div className="bg-white rounded-full shadow-xl border border-landing-clay p-1 flex items-center gap-0.5">
                    {/* Reaction emojis */}
                    {REACTIONS.map((emoji, index) => (
                        <motion.button
                            key={emoji}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => onSelect(emoji)}
                            className="w-10 h-10 flex items-center justify-center text-xl hover:bg-landing-cream rounded-full transition-colors"
                        >
                            {emoji}
                        </motion.button>
                    ))}

                    {/* Divider */}
                    {(onReply || onDelete) && (
                        <div className="w-px h-6 bg-landing-clay mx-1" />
                    )}

                    {/* Reply button */}
                    {onReply && (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: REACTIONS.length * 0.03 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onReply}
                            className="w-10 h-10 flex items-center justify-center text-landing-espresso-light hover:text-landing-terracotta hover:bg-landing-cream rounded-full transition-colors"
                        >
                            <Reply className="h-5 w-5" />
                        </motion.button>
                    )}

                    {/* Delete button */}
                    {onDelete && (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: (REACTIONS.length + 1) * 0.03 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onDelete}
                            className="w-10 h-10 flex items-center justify-center text-landing-espresso-light hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <Trash2 className="h-5 w-5" />
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </>
    );
}

