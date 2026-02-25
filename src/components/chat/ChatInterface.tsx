"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isToday, isYesterday } from "date-fns";
import {
    ArrowDown,
    Loader2,
    WifiOff,
    AlertCircle,
    RefreshCw
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { useChat, Message, OptimisticMessage } from "@/hooks/useChat";
import { useUser } from "@/contexts/UserContext";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import ChatHeader from "./ChatHeader";
import TypingIndicator from "./TypingIndicator";

interface ChatInterfaceProps {
    partnerId?: Id<"users">;
    partnershipId?: Id<"partnerships">;
    partnerName: string;
    partnerAvatar?: string;
    partnerInitials?: string;
    isPartnerOnline?: boolean;
    partnerLastSeen?: Date;
    onClose?: () => void;
    showHeader?: boolean;
}

export default function ChatInterface({
    partnerId,
    partnershipId,
    partnerName,
    partnerAvatar,
    partnerInitials,
    isPartnerOnline = false,
    partnerLastSeen,
    onClose,
    showHeader = true,
}: ChatInterfaceProps) {
    const { userDetails } = useUser();
    const currentUserId = userDetails?._id;

    const {
        messages,
        conversation,
        unreadCount,
        isLoading,
        sendMessage,
        addReaction,
        deleteMessage,
        markAsRead,
        retryMessage,
        handleTyping,
        partnerIsTyping,
        optimisticMessages,
    } = useChat({ partnerId, partnershipId });

    const realMessages = useMemo(
        () => messages.filter((message): message is Message => !("tempId" in message)),
        [messages]
    );

    const partnerLastActivityAt = useMemo(() => {
        for (let i = realMessages.length - 1; i >= 0; i -= 1) {
            const message = realMessages[i];
            const isFromPartner = currentUserId
                ? message.sender_id !== currentUserId
                : partnerId
                    ? message.sender_id === partnerId
                    : false;

            if (isFromPartner) {
                return message.created_at;
            }
        }

        return undefined;
    }, [realMessages, currentUserId, partnerId]);

    const hasExternalPresence = partnerLastSeen !== undefined;
    const derivedPartnerLastSeen = hasExternalPresence
        ? partnerLastSeen
        : partnerLastActivityAt
            ? new Date(partnerLastActivityAt)
            : undefined;
    const derivedIsPartnerOnline = hasExternalPresence
        ? isPartnerOnline
        : partnerLastActivityAt
            ? Date.now() - partnerLastActivityAt < 2 * 60 * 1000
            : isPartnerOnline;

    // Refs
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // State
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [isOffline, setIsOffline] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState<Id<"messages"> | null>(null);

    // Check online status
    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        setIsOffline(!navigator.onLine);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container && !showScrollButton) {
            container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        }
    }, [messages.length, showScrollButton]);

    // Track scroll position for scroll button
    const handleScroll = useCallback(() => {
        if (!messagesContainerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

        setShowScrollButton(distanceFromBottom > 200);
    }, []);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }, []);

    const jumpToMessage = useCallback((messageId: Id<"messages">) => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const target = container.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement | null;
        if (!target) return;

        target.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedMessageId(messageId);
        window.setTimeout(() => setHighlightedMessageId((prev) => (prev === messageId ? null : prev)), 1500);
    }, []);

    // Group messages by date
    const groupMessagesByDate = useCallback((msgs: (Message | OptimisticMessage)[]) => {
        const groups: { date: string; messages: (Message | OptimisticMessage)[] }[] = [];

        msgs.forEach((message) => {
            const messageDate = new Date(message.created_at);
            const dateKey = format(messageDate, "yyyy-MM-dd");

            const existingGroup = groups.find((g) => g.date === dateKey);
            if (existingGroup) {
                existingGroup.messages.push(message);
            } else {
                groups.push({ date: dateKey, messages: [message] });
            }
        });

        return groups;
    }, []);

    // Format date label
    const getDateLabel = (dateKey: string) => {
        const date = new Date(dateKey);
        if (isToday(date)) return "Today";
        if (isYesterday(date)) return "Yesterday";
        return format(date, "MMMM d, yyyy");
    };

    // Handle send message
    const handleSendMessage = useCallback(
        async (content: string, attachments?: Message["attachments"]) => {
            if (!content.trim() && !attachments?.length) return;
            const hasVoiceAttachment = attachments?.some((attachment) => attachment.type === "voice") ?? false;
            const inferredMessageType = !content.trim() && hasVoiceAttachment ? "voice" : undefined;

            try {
                await sendMessage(content, {
                    message_type: inferredMessageType,
                    attachments,
                    reply_to_id: replyingTo?._id,
                    reply_preview: replyingTo
                        ? {
                            sender_id: replyingTo.sender_id,
                            sender_name:
                                replyingTo.sender_id === currentUserId
                                    ? "You"
                                    : partnerName,
                            content: replyingTo.content.substring(0, 100),
                            message_type: replyingTo.message_type,
                        }
                        : undefined,
                });
                setReplyingTo(null);
                scrollToBottom();
            } catch (error) {
                console.error("Failed to send message:", error);
            }
        },
        [sendMessage, replyingTo, scrollToBottom, currentUserId, partnerName]
    );

    // Handle nudge
    const handleSendNudge = useCallback(
        async (nudgeMessage: string) => {
            try {
                await sendMessage(nudgeMessage, { is_nudge: true, message_type: "nudge" });
                scrollToBottom();
            } catch (error) {
                console.error("Failed to send nudge:", error);
            }
        },
        [sendMessage, scrollToBottom]
    );

    // Handle reply
    const handleReply = useCallback((message: Message) => {
        setReplyingTo(message);
        inputRef.current?.focus();
    }, []);

    // Cancel reply
    const handleCancelReply = useCallback(() => {
        setReplyingTo(null);
    }, []);

    // Handle reaction
    const handleReaction = useCallback(
        async (messageId: Id<"messages">, emoji: string) => {
            try {
                await addReaction(messageId, emoji);
            } catch (error) {
                console.error("Failed to add reaction:", error);
            }
        },
        [addReaction]
    );

    // Handle delete
    const handleDelete = useCallback(
        async (messageId: Id<"messages">) => {
            try {
                await deleteMessage(messageId);
            } catch (error) {
                console.error("Failed to delete message:", error);
            }
        },
        [deleteMessage]
    );

    const messageGroups = groupMessagesByDate(messages);

    // No conversation partner provided - demo/empty state
    if (!partnerId && !partnershipId) {
        return (
            <div className="flex flex-col h-full bg-gradient-to-b from-landing-cream to-landing-sand/35">
                {showHeader ? (
                    <ChatHeader
                        partnerName={partnerName}
                        partnerAvatar={partnerAvatar}
                        partnerInitials={partnerInitials}
                        isOnline={derivedIsPartnerOnline}
                        lastSeen={derivedPartnerLastSeen}
                        onClose={onClose}
                    />
                ) : null}
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-landing-sand rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">💬</span>
                        </div>
                        <h3 className="text-lg font-semibold text-landing-espresso mb-2">
                            Start chatting with {partnerName}
                        </h3>
                        <p className="text-sm text-landing-espresso-light mb-6">
                            Send your first message to start your accountability journey together!
                        </p>
                    </div>
                </div>
                <MessageInput
                    onSend={handleSendMessage}
                    onSendNudge={handleSendNudge}
                    onTyping={handleTyping}
                    replyingTo={replyingTo}
                    onCancelReply={handleCancelReply}
                    partnerName={partnerName}
                    currentUserId={currentUserId}

                    disabled={true}
                    ref={inputRef}
                />
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-gradient-to-b from-landing-cream to-landing-sand/35">
                {showHeader ? (
                    <ChatHeader
                        partnerName={partnerName}
                        partnerAvatar={partnerAvatar}
                        partnerInitials={partnerInitials}
                        isOnline={derivedIsPartnerOnline}
                        lastSeen={derivedPartnerLastSeen}
                        onClose={onClose}
                    />
                ) : null}
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-landing-terracotta mx-auto mb-3" />
                        <p className="text-sm text-landing-espresso-light">Loading messages...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col h-full bg-gradient-to-b from-landing-cream to-landing-sand/35"
        >
            {/* Header */}
            {showHeader ? (
                <ChatHeader
                    partnerName={partnerName}
                    partnerAvatar={partnerAvatar}
                    partnerInitials={partnerInitials}
                    isOnline={derivedIsPartnerOnline}
                    isTyping={partnerIsTyping}
                    lastSeen={derivedPartnerLastSeen}
                    onClose={onClose}
                />
            ) : null}

            {/* Offline banner */}
            <AnimatePresence>
                {isOffline && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-landing-gold/15 border-b border-landing-clay"
                    >
                        <div className="flex items-center gap-2 px-4 py-2 text-sm text-landing-espresso">
                            <WifiOff className="h-4 w-4 flex-shrink-0" />
                            <span>You're offline. Messages will send when you reconnect.</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages container */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-20 sm:pb-24"
            >
                {/* Empty state */}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-landing-sand to-landing-clay rounded-full flex items-center justify-center mb-4">
                            <span className="text-3xl">👋</span>
                        </div>
                        <h3 className="text-lg font-semibold text-landing-espresso mb-2">
                            Start a conversation
                        </h3>
                        <p className="text-sm text-landing-espresso-light max-w-xs">
                            Say hi to {partnerName}! Your messages will appear here.
                        </p>
                    </div>
                )}

                {/* Message groups by date */}
                {messageGroups.map((group) => (
                    <div key={group.date}>
                        {/* Floating date header */}
                        <div className="flex justify-center my-4 sticky top-0 z-10">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-landing-cream/90 backdrop-blur-sm text-xs font-medium text-landing-espresso-light px-3 py-1.5 rounded-full shadow-sm border border-landing-clay/70"
                            >
                                {getDateLabel(group.date)}
                            </motion.div>
                        </div>

                        {/* Messages */}
                        {group.messages.map((message, index) => {
                            const isOptimistic = "tempId" in message;
                            const prevMessage = index > 0 ? group.messages[index - 1] : null;
                            const nextMessage = index < group.messages.length - 1 ? group.messages[index + 1] : null;

                            // Determine if we should show avatar/name (first in a group from same sender)
                            const showAvatar =
                                !isOptimistic &&
                                (!prevMessage ||
                                    ("sender_id" in prevMessage && "sender_id" in message && prevMessage.sender_id !== message.sender_id) ||
                                    message.created_at - (prevMessage?.created_at || 0) > 5 * 60 * 1000);

                            // Determine if this is the last message in a group from same sender
                            const isLastInGroup =
                                !nextMessage ||
                                ("sender_id" in nextMessage && "sender_id" in message && nextMessage.sender_id !== message.sender_id) ||
                                (nextMessage?.created_at || 0) - message.created_at > 5 * 60 * 1000;

                            if (isOptimistic) {
                                // Render optimistic message
                                const optMsg = message as OptimisticMessage;
                                return (
                                    <motion.div
                                        key={optMsg.tempId}
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="flex justify-end mb-1"
                                    >
                                        <div className="max-w-[80%] sm:max-w-[70%]">
                                            <div className="bg-gradient-to-br from-landing-terracotta to-[#D7A88B] text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm">
                                                {optMsg.content ? (
                                                    <p className="text-sm leading-relaxed">{optMsg.content}</p>
                                                ) : optMsg.attachments?.some((attachment) => attachment.type === "voice") ? (
                                                    <p className="text-sm leading-relaxed">Voice note</p>
                                                ) : null}
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-xs text-landing-sand">
                                                        {format(new Date(optMsg.created_at), "p")}
                                                    </span>
                                                    {optMsg.status === "sending" && (
                                                        <Loader2 className="h-3 w-3 animate-spin text-landing-sand" />
                                                    )}
                                                    {optMsg.status === "failed" && (
                                                        <button
                                                            onClick={() => retryMessage(optMsg.tempId)}
                                                            className="flex items-center gap-1 text-xs text-red-200 hover:text-white"
                                                        >
                                                            <AlertCircle className="h-3 w-3" />
                                                            <RefreshCw className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }

                            // Render real message
                            const msg = message as Message;
                            const isOwnMessage = currentUserId
                                ? msg.sender_id === currentUserId
                                : partnerId
                                    ? msg.sender_id !== partnerId
                                    : false;

                            return (
                                <MessageBubble
                                    key={msg._id}
                                    message={msg}
                                    isOwn={isOwnMessage}
                                    showAvatar={showAvatar}
                                    isLastInGroup={isLastInGroup}
                                    partnerName={partnerName}
                                    partnerAvatar={partnerAvatar}
                                    partnerInitials={partnerInitials}
                                    onReply={() => handleReply(msg)}
                                    onReaction={(emoji) => handleReaction(msg._id, emoji)}
                                    onDelete={() => handleDelete(msg._id)}
                                    onJumpToRepliedMessage={jumpToMessage}
                                    isHighlighted={highlightedMessageId === msg._id}
                                />
                            );
                        })}
                    </div>
                ))}

                {/* Typing indicator */}
                <AnimatePresence>
                    {partnerIsTyping && (
                        <TypingIndicator
                            partnerName={partnerName}
                            partnerAvatar={partnerAvatar}
                            partnerInitials={partnerInitials}
                        />
                    )}
                </AnimatePresence>

                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            <AnimatePresence>
                {showScrollButton && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={scrollToBottom}
                        className="absolute bottom-24 right-4 w-10 h-10 bg-white rounded-full shadow-lg border border-landing-clay flex items-center justify-center hover:bg-landing-cream transition-colors z-20"
                    >
                        <ArrowDown className="h-5 w-5 text-landing-espresso-light" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-landing-terracotta text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Message input */}
            <MessageInput
                ref={inputRef}
                replyingTo={replyingTo}
                onCancelReply={handleCancelReply}
                onSend={handleSendMessage}
                onSendNudge={handleSendNudge}
                onTyping={handleTyping}
                partnerName={partnerName}
                currentUserId={currentUserId}
                disabled={false}
            />
        </div>
    );
}
