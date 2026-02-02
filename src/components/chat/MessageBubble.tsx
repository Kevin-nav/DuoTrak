"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { format } from "date-fns";
import {
    Check,
    CheckCheck,
    Clock,
    AlertCircle,
    Play,
    Pause,
    FileText,
    Download,
    Reply,
    Trash2,
    Hand,
    X,
} from "lucide-react";
import { Message } from "@/hooks/useChat";
import ReactionPicker from "./ReactionPicker";

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
    showAvatar?: boolean;
    isLastInGroup?: boolean;
    partnerName: string;
    partnerAvatar?: string;
    partnerInitials?: string;
    onReply: () => void;
    onReaction: (emoji: string) => void;
    onDelete: () => void;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export default function MessageBubble({
    message,
    isOwn,
    showAvatar = true,
    isLastInGroup = true,
    partnerName,
    partnerAvatar,
    partnerInitials,
    onReply,
    onReaction,
    onDelete,
}: MessageBubbleProps) {
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    // Swipe to reply
    const x = useMotionValue(0);
    const replyIconOpacity = useTransform(x, [0, 50], [0, 1]);
    const replyIconScale = useTransform(x, [0, 50], [0.5, 1]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Double tap for heart reaction
    const lastTap = useRef<number>(0);
    const handleDoubleTap = () => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            onReaction("❤️");
            lastTap.current = 0;
        } else {
            lastTap.current = now;
        }
    };

    // Long press for context menu
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const handleLongPressStart = () => {
        longPressTimer.current = setTimeout(() => {
            setShowReactionPicker(true);
        }, 500);
    };
    const handleLongPressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    // Handle swipe gesture
    const handleDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.x > 60) {
            onReply();
        }
    };

    // Status icon
    const getStatusIcon = () => {
        switch (message.status) {
            case "sending":
                return <Clock className="h-3 w-3 text-gray-400" />;
            case "sent":
                return <Check className="h-3 w-3 text-gray-400" />;
            case "delivered":
                return <CheckCheck className="h-3 w-3 text-gray-400" />;
            case "read":
                return <CheckCheck className="h-3 w-3 text-blue-400" />;
            case "failed":
                return <AlertCircle className="h-3 w-3 text-red-400" />;
            default:
                return null;
        }
    };

    // Format file size
    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    // Format duration for voice messages
    const formatDuration = (seconds?: number) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const bubbleClasses = isOwn
        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700";

    const tailClasses = isOwn
        ? "border-t-blue-500"
        : "border-t-white dark:border-t-gray-800";

    return (
        <>
            <motion.div
                ref={containerRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className={`flex items-end gap-2 mb-1 ${isOwn ? "justify-end" : "justify-start"}`}
                drag="x"
                dragConstraints={{ left: 0, right: 80 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                style={{ x }}
            >
                {/* Reply indicator on swipe */}
                {!isOwn && (
                    <motion.div
                        className="absolute left-0 flex items-center justify-center w-10 h-10"
                        style={{ opacity: replyIconOpacity, scale: replyIconScale }}
                    >
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-2">
                            <Reply className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </div>
                    </motion.div>
                )}

                {/* Partner avatar */}
                {!isOwn && showAvatar && (
                    <div className="flex-shrink-0 w-8 h-8">
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
                )}

                {/* Spacer when avatar hidden */}
                {!isOwn && !showAvatar && <div className="w-8" />}

                {/* Message bubble */}
                <div className="relative max-w-[80%] sm:max-w-[70%]">
                    {/* Reply preview */}
                    {message.reply_preview && (
                        <div
                            className={`px-3 py-2 mb-1 rounded-t-2xl text-xs ${isOwn
                                    ? "bg-blue-600 border-l-2 border-blue-300"
                                    : "bg-gray-50 dark:bg-gray-700/50 border-l-2 border-gray-400"
                                }`}
                        >
                            <span className={`font-medium ${isOwn ? "text-blue-200" : "text-gray-600 dark:text-gray-300"}`}>
                                {message.reply_preview.sender_name}
                            </span>
                            <p className={`truncate ${isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                                {message.reply_preview.content}
                            </p>
                        </div>
                    )}

                    {/* Main bubble */}
                    <div
                        className={`relative px-4 py-2.5 shadow-sm ${bubbleClasses} ${message.reply_preview ? "rounded-b-2xl" : "rounded-2xl"
                            } ${isOwn && isLastInGroup ? "rounded-br-sm" : ""} ${!isOwn && isLastInGroup ? "rounded-bl-sm" : ""
                            }`}
                        onClick={handleDoubleTap}
                        onTouchStart={handleLongPressStart}
                        onTouchEnd={handleLongPressEnd}
                        onMouseDown={handleLongPressStart}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setShowReactionPicker(true);
                        }}
                    >
                        {/* Nudge indicator */}
                        {message.is_nudge && (
                            <div className={`flex items-center gap-1 mb-1 text-xs ${isOwn ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
                                <Hand className="h-3 w-3" />
                                <span className="font-medium">Nudge</span>
                            </div>
                        )}

                        {/* Deleted message */}
                        {message.is_deleted ? (
                            <p className={`text-sm italic ${isOwn ? "text-blue-200" : "text-gray-400 dark:text-gray-500"}`}>
                                This message was deleted
                            </p>
                        ) : (
                            <>
                                {/* Text content */}
                                {message.content && (
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                        {message.content}
                                    </p>
                                )}

                                {/* Attachments */}
                                {message.attachments && message.attachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {message.attachments.map((attachment, index) => (
                                            <div key={index}>
                                                {/* Image */}
                                                {attachment.type === "image" && (
                                                    <img
                                                        src={attachment.thumbnail_url || attachment.url}
                                                        alt={attachment.name || "Image"}
                                                        className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => setExpandedImage(attachment.url)}
                                                    />
                                                )}

                                                {/* Video */}
                                                {attachment.type === "video" && (
                                                    <div className="relative rounded-lg overflow-hidden">
                                                        <img
                                                            src={attachment.thumbnail_url || "/placeholder-video.jpg"}
                                                            alt={attachment.name || "Video"}
                                                            className="w-full"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                                                <Play className="h-6 w-6 text-gray-800 ml-1" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Voice message */}
                                                {attachment.type === "voice" && (
                                                    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isOwn ? "bg-blue-600" : "bg-gray-100 dark:bg-gray-700"}`}>
                                                        <button
                                                            onClick={() => setIsPlaying(!isPlaying)}
                                                            className={`w-10 h-10 rounded-full flex items-center justify-center ${isOwn ? "bg-blue-400" : "bg-gray-200 dark:bg-gray-600"}`}
                                                        >
                                                            {isPlaying ? (
                                                                <Pause className={`h-5 w-5 ${isOwn ? "text-white" : "text-gray-700 dark:text-gray-200"}`} />
                                                            ) : (
                                                                <Play className={`h-5 w-5 ml-0.5 ${isOwn ? "text-white" : "text-gray-700 dark:text-gray-200"}`} />
                                                            )}
                                                        </button>
                                                        <div className="flex-1">
                                                            <div className="h-1 bg-gray-300 dark:bg-gray-500 rounded-full">
                                                                <div className="h-full w-1/3 bg-current rounded-full" />
                                                            </div>
                                                            <span className={`text-xs mt-1 ${isOwn ? "text-blue-200" : "text-gray-500"}`}>
                                                                {formatDuration(attachment.duration)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Document */}
                                                {attachment.type === "document" && (
                                                    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isOwn ? "bg-blue-600" : "bg-gray-100 dark:bg-gray-700"}`}>
                                                        <FileText className={`h-8 w-8 ${isOwn ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-medium truncate ${isOwn ? "text-white" : "text-gray-900 dark:text-white"}`}>
                                                                {attachment.name || "Document"}
                                                            </p>
                                                            <p className={`text-xs ${isOwn ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}`}>
                                                                {formatFileSize(attachment.size)}
                                                            </p>
                                                        </div>
                                                        <button className={`p-2 hover:bg-white/10 rounded-full transition-colors`}>
                                                            <Download className={`h-4 w-4 ${isOwn ? "text-white" : "text-gray-600 dark:text-gray-300"}`} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Timestamp and status */}
                        <div className={`flex items-center gap-1.5 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                            <span className={`text-[10px] ${isOwn ? "text-blue-200" : "text-gray-400 dark:text-gray-500"}`}>
                                {format(new Date(message.created_at), "p")}
                            </span>
                            {isOwn && getStatusIcon()}
                        </div>

                        {/* WhatsApp-style bubble tail */}
                        {isLastInGroup && (
                            <div
                                className={`absolute bottom-0 ${isOwn ? "-right-1" : "-left-1"} w-3 h-3 overflow-hidden`}
                            >
                                <div
                                    className={`absolute ${isOwn ? "right-0" : "left-0"} bottom-0 w-4 h-4 ${isOwn
                                            ? "bg-blue-600"
                                            : "bg-white dark:bg-gray-800"
                                        }`}
                                    style={{
                                        clipPath: isOwn
                                            ? "polygon(100% 0, 0 100%, 100% 100%)"
                                            : "polygon(0 0, 100% 100%, 0 100%)",
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Reactions display */}
                    {message.reactions && message.reactions.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                            {/* Group reactions by emoji */}
                            {Object.entries(
                                message.reactions.reduce((acc, r) => {
                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>)
                            ).map(([emoji, count]) => (
                                <motion.button
                                    key={emoji}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="flex items-center gap-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-1.5 py-0.5 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => onReaction(emoji)}
                                >
                                    <span className="text-sm">{emoji}</span>
                                    {count > 1 && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{count}</span>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    )}

                    {/* Reaction picker */}
                    <AnimatePresence>
                        {showReactionPicker && (
                            <ReactionPicker
                                onSelect={(emoji) => {
                                    onReaction(emoji);
                                    setShowReactionPicker(false);
                                }}
                                onClose={() => setShowReactionPicker(false)}
                                onReply={() => {
                                    onReply();
                                    setShowReactionPicker(false);
                                }}
                                onDelete={isOwn ? () => {
                                    onDelete();
                                    setShowReactionPicker(false);
                                } : undefined}
                                position={isOwn ? "left" : "right"}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {/* Own avatar (optional, usually hidden) */}
                {isOwn && showAvatar && false && (
                    <div className="flex-shrink-0 w-8 h-8">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            You
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Image lightbox */}
            <AnimatePresence>
                {expandedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setExpandedImage(null)}
                    >
                        <button
                            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                            onClick={() => setExpandedImage(null)}
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            src={expandedImage}
                            alt="Expanded"
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
