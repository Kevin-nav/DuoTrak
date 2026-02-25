"use client";

import React, { useEffect, useRef, useState } from "react";
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
    Hand,
    X,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
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
    onJumpToRepliedMessage?: (messageId: Id<"messages">) => void;
    isHighlighted?: boolean;
}

type ChatAttachment = NonNullable<Message["attachments"]>[number];

interface VoiceAttachmentPlayerProps {
    attachment: ChatAttachment;
    isOwn: boolean;
}

function formatDuration(seconds?: number): string {
    if (!seconds || !Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function VoiceAttachmentPlayer({ attachment, isOwn }: VoiceAttachmentPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(attachment.duration || 0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        const onLoaded = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : attachment.duration || 0);
        const onTime = () => setCurrentTime(audio.currentTime || 0);
        const onEnd = () => setIsPlaying(false);
        const onError = () => {
            setIsPlaying(false);
            setError("Playback unavailable");
        };
        audio.addEventListener("loadedmetadata", onLoaded);
        audio.addEventListener("timeupdate", onTime);
        audio.addEventListener("ended", onEnd);
        audio.addEventListener("error", onError);
        return () => {
            audio.pause();
            audio.removeEventListener("loadedmetadata", onLoaded);
            audio.removeEventListener("timeupdate", onTime);
            audio.removeEventListener("ended", onEnd);
            audio.removeEventListener("error", onError);
        };
    }, [attachment.duration, attachment.url]);

    const togglePlayback = async () => {
        const audio = audioRef.current;
        if (!audio) return;
        setError(null);
        try {
            if (audio.paused) {
                await audio.play();
                setIsPlaying(true);
            } else {
                audio.pause();
                setIsPlaying(false);
            }
        } catch {
            setIsPlaying(false);
            setError("Tap to retry");
        }
    };

    const cycleRate = () => {
        const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
        const audio = audioRef.current;
        if (audio) audio.playbackRate = nextRate;
        setPlaybackRate(nextRate);
    };

    const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

    return (
        <div className={`rounded-lg px-3 py-2 ${isOwn ? "bg-landing-espresso-light/70" : "bg-landing-cream"}`}>
            <audio ref={audioRef} src={attachment.url} preload="metadata" />
            <div className="flex items-center gap-3">
                <button onClick={() => void togglePlayback()} className={`w-10 h-10 rounded-full flex items-center justify-center ${isOwn ? "bg-landing-terracotta text-white" : "bg-landing-sand text-landing-espresso"}`}>
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>
                <div className="flex-1">
                    <div className="relative h-1.5 rounded-full bg-landing-clay/70 overflow-hidden">
                        <div className={`h-full rounded-full ${isOwn ? "bg-white/80" : "bg-landing-terracotta"}`} style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className={`mt-1 flex items-center justify-between text-[11px] ${isOwn ? "text-white/85" : "text-landing-espresso-light"}`}>
                        <span>{formatDuration(currentTime)}</span>
                        <span>{formatDuration(duration || attachment.duration)}</span>
                    </div>
                </div>
                <button onClick={cycleRate} className={`h-7 min-w-10 rounded-full px-2 text-xs font-medium ${isOwn ? "bg-white/15 text-white" : "bg-white text-landing-espresso"} transition-colors`}>
                    {playbackRate}x
                </button>
            </div>
            {error && <p className={`mt-1 text-[11px] ${isOwn ? "text-white/80" : "text-red-600"}`}>{error}</p>}
        </div>
    );
}


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
    onJumpToRepliedMessage,
    isHighlighted = false,
}: MessageBubbleProps) {
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    // Swipe to reply
    const x = useMotionValue(0);
    const replyIconOpacity = useTransform(x, [0, 50], [0, 1]);
    const replyIconScale = useTransform(x, [0, 50], [0.5, 1]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Double tap for heart reaction
    const lastTap = useRef<number>(0);
    const handleDoubleTap = () => {
        if (message.is_deleted) return;
        const now = Date.now();
        if (now - lastTap.current < 300) {
            onReaction("\u2764\uFE0F");
            lastTap.current = 0;
        } else {
            lastTap.current = now;
        }
    };

    // Long press for context menu
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const handleLongPressStart = () => {
        if (message.is_deleted) return;
        longPressTimer.current = setTimeout(() => {
            setShowReactionPicker(true);
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        }, 500);
    };
    const handleLongPressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleLongPressMove = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    // Handle swipe gesture
    const handleDragEnd = (_: any, info: PanInfo) => {
        if (message.is_deleted) return;
        if (info.offset.x > 60 && Math.abs(info.offset.y) < 24) {
            onReply();
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        }
    };

    // Status icon
    const getStatusIcon = () => {
        switch (message.status) {
            case "sending":
                return <Clock className="h-3 w-3 text-landing-espresso-light" />;
            case "sent":
                return <Check className="h-3 w-3 text-landing-espresso-light" />;
            case "delivered":
                return <CheckCheck className="h-3 w-3 text-landing-espresso" />;
            case "read":
                return <CheckCheck className="h-3 w-3 text-landing-sage" />;
            case "failed":
                return <AlertCircle className="h-3 w-3 text-red-600" />;
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

    const bubbleClasses = isOwn
        ? "bg-gradient-to-br from-landing-terracotta to-[#D7A88B] text-white"
        : "bg-white text-landing-espresso border border-landing-clay";

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
                dragDirectionLock
                onDragEnd={handleDragEnd}
                onDragStart={handleLongPressEnd}
                style={{ x }}
                data-message-id={message._id}
            >
                {/* Reply indicator on swipe */}
                {!isOwn && (
                    <motion.div
                        className="absolute left-0 flex items-center justify-center w-10 h-10"
                        style={{ opacity: replyIconOpacity, scale: replyIconScale }}
                    >
                        <div className="bg-landing-sand rounded-full p-2">
                            <Reply className="h-4 w-4 text-landing-espresso-light" />
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
                            <div className="w-8 h-8 bg-gradient-to-br from-landing-terracotta to-landing-espresso-light rounded-full flex items-center justify-center text-white text-xs font-semibold">
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
                        <button
                            type="button"
                            disabled={!message.reply_to_id || !onJumpToRepliedMessage}
                            onClick={() => {
                                if (message.reply_to_id && onJumpToRepliedMessage) {
                                    onJumpToRepliedMessage(message.reply_to_id);
                                }
                            }}
                            className={`px-3 py-2 mb-1 rounded-t-2xl text-xs ${isOwn
                                    ? "bg-[#CEA287] border-l-2 border-landing-sand"
                                    : "bg-landing-cream border-l-2 border-landing-clay"
                                } ${message.reply_to_id && onJumpToRepliedMessage ? "cursor-pointer hover:opacity-90" : ""}`}
                        >
                            <span className={`font-medium ${isOwn ? "text-white/90" : "text-landing-espresso-light"}`}>
                                {message.reply_preview.sender_name}
                            </span>
                            <p className={`truncate ${isOwn ? "text-white/85" : "text-landing-espresso-light/80"}`}>
                                {message.reply_preview.content}
                            </p>
                        </button>
                    )}

                    {/* Main bubble */}
                    <div
                        className={`relative px-4 py-2.5 shadow-sm ${bubbleClasses} ${message.reply_preview ? "rounded-b-2xl" : "rounded-2xl"
                            } ${isOwn && isLastInGroup ? "rounded-br-sm" : ""} ${!isOwn && isLastInGroup ? "rounded-bl-sm" : ""
                            } ${isHighlighted ? "ring-2 ring-landing-gold" : ""}`}
                        onClick={handleDoubleTap}
                        onTouchStart={handleLongPressStart}
                        onTouchEnd={handleLongPressEnd}
                        onTouchMove={handleLongPressMove}
                        onMouseDown={handleLongPressStart}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onContextMenu={(e) => {
                            if (message.is_deleted) return;
                            e.preventDefault();
                            setShowReactionPicker(true);
                        }}
                        style={{ touchAction: "pan-y" }}
                    >
                        {/* Nudge indicator */}
                        {message.is_nudge && (
                            <div className={`flex items-center gap-1 mb-1 text-xs ${isOwn ? "text-white/85" : "text-landing-espresso-light"}`}>
                                <Hand className="h-3 w-3" />
                                <span className="font-medium">Nudge</span>
                            </div>
                        )}

                        {/* Deleted message */}
                        {message.is_deleted ? (
                            <p className={`text-sm italic ${isOwn ? "text-white/85" : "text-landing-espresso-light"}`}>
                                {isOwn ? "You deleted this message" : "This message was deleted"}
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
                                                    <div className="rounded-lg overflow-hidden bg-black/60 border border-black/10">
                                                        <video
                                                            src={attachment.url}
                                                            poster={attachment.thumbnail_url}
                                                            controls
                                                            preload="metadata"
                                                            playsInline
                                                            className="w-full max-h-[360px]"
                                                        />
                                                    </div>
                                                )}

                                                {/* Voice message */}
                                                {attachment.type === "voice" && (
                                                    <VoiceAttachmentPlayer attachment={attachment} isOwn={isOwn} />
                                                )}

                                                {/* Document */}
                                                {attachment.type === "document" && (
                                                    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isOwn ? "bg-landing-espresso-light" : "bg-landing-cream"}`}>
                                                        <FileText className={`h-8 w-8 ${isOwn ? "text-white/85" : "text-landing-espresso-light"}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-medium truncate ${isOwn ? "text-white" : "text-landing-espresso"}`}>
                                                                {attachment.name || "Document"}
                                                            </p>
                                                            <p className={`text-xs ${isOwn ? "text-white/85" : "text-landing-espresso-light"}`}>
                                                                {formatFileSize(attachment.size)}
                                                            </p>
                                                        </div>
                                                        <button className={`p-2 hover:bg-white/10 rounded-full transition-colors`}>
                                                            <Download className={`h-4 w-4 ${isOwn ? "text-white" : "text-landing-espresso-light"}`} />
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
                            <span className={`text-[10px] ${isOwn ? "text-white/80" : "text-landing-espresso-light"}`}>
                                {format(new Date(message.created_at), "p")}
                            </span>
                            {isOwn && !message.is_deleted && getStatusIcon()}
                        </div>

                        {/* WhatsApp-style bubble tail */}
                        {isLastInGroup && (
                            <div
                                className={`absolute bottom-0 ${isOwn ? "-right-1" : "-left-1"} w-3 h-3 overflow-hidden`}
                            >
                                <div
                                    className={`absolute ${isOwn ? "right-0" : "left-0"} bottom-0 w-4 h-4 ${isOwn
                                            ? "bg-[#D7A88B]"
                                            : "bg-white"
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
                    {!message.is_deleted && message.reactions && message.reactions.length > 0 && (
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
                                    className="flex items-center gap-0.5 bg-white border border-landing-clay rounded-full px-1.5 py-0.5 shadow-sm hover:bg-landing-cream transition-colors"
                                    onClick={() => onReaction(emoji)}
                                >
                                    <span className="text-sm">{emoji}</span>
                                    {count > 1 && (
                                        <span className="text-xs text-landing-espresso-light">{count}</span>
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
                                }}
                                onClose={() => setShowReactionPicker(false)}
                                onReply={!message.is_deleted ? () => {
                                    onReply();
                                    setShowReactionPicker(false);
                                } : undefined}
                                onDelete={isOwn && !message.is_deleted ? () => {
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
                        <div className="w-8 h-8 bg-gradient-to-br from-landing-terracotta to-landing-espresso-light rounded-full flex items-center justify-center text-white text-xs font-semibold">
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

