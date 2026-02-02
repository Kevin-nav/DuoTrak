"use client";

import React, { useState, useRef, useCallback, useEffect, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send,
    Mic,
    Plus,
    Image as ImageIcon,
    File,
    X,
    Smile,
    StopCircle,
    Hand,
    Loader2,
} from "lucide-react";
import { Message } from "@/hooks/useChat";

interface MessageInputProps {
    replyingTo: Message | null;
    onCancelReply: () => void;
    onSend: (content: string, attachments?: Message["attachments"]) => Promise<void>;
    onSendNudge: (message: string) => Promise<void>;
    onTyping: () => void;
    partnerName: string;
    disabled?: boolean;
}

const NUDGE_MESSAGES = [
    "Checking in! 👋",
    "You got this! 💪",
    "Thinking of you! 💭",
    "How's that goal going? 🎯",
    "Just sending some good vibes! ✨",
    "Hope you're having a great day! 😊",
    "Remember, progress over perfection! 🌟",
    "You're doing amazing! Keep it up! 🚀",
];

const QUICK_EMOJIS = ["😊", "😂", "❤️", "👍", "🔥", "🎉", "💪", "🙌", "👏", "🚀", "⭐", "✨"];

const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
    (
        {
            replyingTo,
            onCancelReply,
            onSend,
            onSendNudge,
            onTyping,
            partnerName,
            disabled = false,
        },
        ref
    ) => {
        const [message, setMessage] = useState("");
        const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
        const [showEmojiPicker, setShowEmojiPicker] = useState(false);
        const [showNudgeMenu, setShowNudgeMenu] = useState(false);
        const [isRecording, setIsRecording] = useState(false);
        const [recordingDuration, setRecordingDuration] = useState(0);
        const [isSending, setIsSending] = useState(false);
        const [pendingAttachments, setPendingAttachments] = useState<Message["attachments"]>([]);

        const internalRef = useRef<HTMLTextAreaElement>(null);
        const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;
        const fileInputRef = useRef<HTMLInputElement>(null);
        const recordingInterval = useRef<NodeJS.Timeout | null>(null);

        // Auto-resize textarea
        const adjustTextareaHeight = useCallback(() => {
            const textarea = textareaRef.current;
            if (textarea) {
                textarea.style.height = "auto";
                const maxHeight = 120;
                textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
            }
        }, [textareaRef]);

        useEffect(() => {
            adjustTextareaHeight();
        }, [message, adjustTextareaHeight]);

        // Handle message change
        const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setMessage(e.target.value);
            onTyping();
        };

        // Handle key press
        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        };

        // Send message
        const handleSend = async () => {
            const trimmedMessage = message.trim();
            if (!trimmedMessage && !pendingAttachments?.length) return;
            if (isSending) return;

            setIsSending(true);
            try {
                await onSend(trimmedMessage, pendingAttachments);
                setMessage("");
                setPendingAttachments([]);
                if (textareaRef.current) {
                    textareaRef.current.style.height = "auto";
                }
            } finally {
                setIsSending(false);
            }
        };

        // Handle file selection
        const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files) return;

            const newAttachments: Message["attachments"] = [];

            Array.from(files).forEach((file) => {
                const isImage = file.type.startsWith("image/");
                const isVideo = file.type.startsWith("video/");

                // Create temporary URL for preview
                const url = URL.createObjectURL(file);

                newAttachments.push({
                    type: isImage ? "image" : isVideo ? "video" : "document",
                    url,
                    name: file.name,
                    size: file.size,
                    mime_type: file.type,
                });
            });

            setPendingAttachments((prev) => [...(prev || []), ...newAttachments]);
            setShowAttachmentMenu(false);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        };

        // Remove pending attachment
        const removeAttachment = (index: number) => {
            setPendingAttachments((prev) => prev?.filter((_, i) => i !== index));
        };

        // Voice recording
        const startRecording = () => {
            setIsRecording(true);
            setRecordingDuration(0);
            recordingInterval.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
            // TODO: Implement actual audio recording
        };

        const stopRecording = () => {
            setIsRecording(false);
            if (recordingInterval.current) {
                clearInterval(recordingInterval.current);
            }
            // TODO: Process and send recording
        };

        // Format recording duration
        const formatDuration = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, "0")}`;
        };

        // Add emoji to message
        const addEmoji = (emoji: string) => {
            setMessage((prev) => prev + emoji);
            textareaRef.current?.focus();
            setShowEmojiPicker(false);
        };

        // Send nudge
        const handleNudge = async (nudgeMessage: string) => {
            setShowNudgeMenu(false);
            await onSendNudge(nudgeMessage);
        };

        const hasContent = message.trim() || pendingAttachments?.length;

        return (
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                {/* Reply preview */}
                <AnimatePresence>
                    {replyingTo && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-b border-gray-100 dark:border-gray-800"
                        >
                            <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20">
                                <div className="w-1 h-10 bg-blue-500 rounded-full" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                        Replying to {replyingTo.sender?.name || "message"}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                        {replyingTo.content}
                                    </p>
                                </div>
                                <button
                                    onClick={onCancelReply}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pending attachments preview */}
                <AnimatePresence>
                    {pendingAttachments && pendingAttachments.length > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-b border-gray-100 dark:border-gray-800"
                        >
                            <div className="flex gap-2 p-3 overflow-x-auto">
                                {pendingAttachments.map((attachment, index) => (
                                    <div key={index} className="relative flex-shrink-0">
                                        {attachment.type === "image" ? (
                                            <img
                                                src={attachment.url}
                                                alt={attachment.name}
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                                <File className="h-6 w-6 text-gray-400" />
                                            </div>
                                        )}
                                        <button
                                            onClick={() => removeAttachment(index)}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main input area */}
                <div className="flex items-end gap-2 p-3">
                    {/* Attachment button */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowAttachmentMenu(!showAttachmentMenu);
                                setShowEmojiPicker(false);
                                setShowNudgeMenu(false);
                            }}
                            disabled={disabled || isRecording}
                            className="p-2.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors disabled:opacity-50"
                        >
                            <Plus className="h-5 w-5" />
                        </button>

                        {/* Attachment menu */}
                        <AnimatePresence>
                            {showAttachmentMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[180px] z-50"
                                >
                                    <button
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.accept = "image/*,video/*";
                                                fileInputRef.current.click();
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                            <ImageIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        Photo or Video
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.accept = ".pdf,.doc,.docx,.txt,.xls,.xlsx";
                                                fileInputRef.current.click();
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                            <File className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        Document
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowAttachmentMenu(false);
                                            setShowNudgeMenu(true);
                                        }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                                    >
                                        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                                            <Hand className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        Send Nudge
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Nudge menu */}
                        <AnimatePresence>
                            {showNudgeMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[240px] max-h-64 overflow-y-auto z-50"
                                >
                                    <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        Quick Nudges
                                    </div>
                                    {NUDGE_MESSAGES.map((nudge, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleNudge(nudge)}
                                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            {nudge}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {/* Text input or recording indicator */}
                    {isRecording ? (
                        <div className="flex-1 flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-2xl px-4 py-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                Recording... {formatDuration(recordingDuration)}
                            </span>
                        </div>
                    ) : (
                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={handleMessageChange}
                                onKeyDown={handleKeyDown}
                                placeholder={`Message ${partnerName}...`}
                                disabled={disabled}
                                rows={1}
                                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                                style={{ maxHeight: "120px" }}
                            />
                        </div>
                    )}

                    {/* Emoji button */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowEmojiPicker(!showEmojiPicker);
                                setShowAttachmentMenu(false);
                                setShowNudgeMenu(false);
                            }}
                            disabled={disabled || isRecording}
                            className="p-2.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors disabled:opacity-50"
                        >
                            <Smile className="h-5 w-5" />
                        </button>

                        {/* Emoji picker */}
                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50"
                                >
                                    <div className="grid grid-cols-6 gap-1">
                                        {QUICK_EMOJIS.map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => addEmoji(emoji)}
                                                className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Send or Voice button */}
                    {hasContent ? (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onClick={handleSend}
                            disabled={disabled || isSending}
                            className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors"
                        >
                            {isSending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send className="h-5 w-5" />
                            )}
                        </motion.button>
                    ) : isRecording ? (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onClick={stopRecording}
                            className="p-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                            <StopCircle className="h-5 w-5" />
                        </motion.button>
                    ) : (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onClick={startRecording}
                            disabled={disabled}
                            className="p-2.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors disabled:opacity-50"
                        >
                            <Mic className="h-5 w-5" />
                        </motion.button>
                    )}
                </div>
            </div>
        );
    }
);

MessageInput.displayName = "MessageInput";

export default MessageInput;
