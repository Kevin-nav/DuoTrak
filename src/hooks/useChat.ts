"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState, useCallback, useEffect, useRef } from "react";

// Types
export interface Message {
    _id: Id<"messages">;
    conversation_id: Id<"conversations">;
    sender_id: Id<"users">;
    content: string;
    message_type: string;
    attachments?: {
        type: string;
        url: string;
        name?: string;
        size?: number;
        thumbnail_url?: string;
        duration?: number;
        mime_type?: string;
    }[];
    reply_to_id?: Id<"messages">;
    reply_preview?: {
        sender_id: Id<"users">;
        sender_name: string;
        content: string;
        message_type: string;
    };
    status: string;
    delivered_at?: number;
    read_at?: number;
    reactions?: {
        user_id: Id<"users">;
        emoji: string;
        created_at: number;
    }[];
    is_deleted?: boolean;
    is_nudge?: boolean;
    created_at: number;
    updated_at: number;
    sender?: {
        id: Id<"users">;
        name: string;
        avatar?: string;
    } | null;
}

export interface Conversation {
    _id: Id<"conversations">;
    partnership_id: Id<"partnerships">;
    last_message_text?: string;
    last_message_at?: number;
    last_message_sender_id?: Id<"users">;
    user1_unread_count: number;
    user2_unread_count: number;
}

export interface OptimisticMessage {
    tempId: string;
    content: string;
    message_type: string;
    attachments?: Message["attachments"];
    reply_to_id?: Id<"messages">;
    reply_preview?: Message["reply_preview"];
    status: "sending" | "failed";
    is_nudge?: boolean;
    created_at: number;
}

interface UseChatOptions {
    partnerId?: Id<"users">;
    partnershipId?: Id<"partnerships">;
    autoMarkAsRead?: boolean;
}

export function useChat(options: UseChatOptions) {
    const { partnerId, partnershipId, autoMarkAsRead = true } = options;

    // State for optimistic updates
    const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [partnerIsTyping, setPartnerIsTyping] = useState(false);

    // Typing timeout ref
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get conversation - try by partner ID first, then by partnership ID
    const conversationByPartner = useQuery(
        api.chat.getConversationByPartnerId,
        partnerId ? { partner_id: partnerId } : "skip"
    );

    const conversationByPartnership = useQuery(
        api.chat.getConversation,
        partnershipId && !partnerId ? { partnership_id: partnershipId } : "skip"
    );

    const conversation = conversationByPartner || conversationByPartnership;

    // Get messages if we have a conversation
    const messages = useQuery(
        api.chat.getMessages,
        conversation?._id ? { conversation_id: conversation._id, limit: 50 } : "skip"
    ) as Message[] | undefined;

    // Get unread count
    const unreadCount = useQuery(
        api.chat.getUnreadCount,
        conversation?._id ? { conversation_id: conversation._id } : "skip"
    ) as number | undefined;

    // Mutations
    const sendMessageMutation = useMutation(api.chat.sendMessage);
    const markAsReadMutation = useMutation(api.chat.markAsRead);
    const addReactionMutation = useMutation(api.chat.addReaction);
    const removeReactionMutation = useMutation(api.chat.removeReaction);
    const deleteMessageMutation = useMutation(api.chat.deleteMessage);
    const getOrCreateConversationMutation = useMutation(api.chat.getOrCreateConversation);

    // Auto mark as read when messages change
    useEffect(() => {
        if (autoMarkAsRead && conversation?._id && messages && messages.length > 0) {
            markAsReadMutation({ conversation_id: conversation._id }).catch(console.error);
        }
    }, [autoMarkAsRead, conversation?._id, messages?.length, markAsReadMutation]);

    // Send message with optimistic update
    const sendMessage = useCallback(
        async (
            content: string,
            opts?: {
                message_type?: string;
                attachments?: Message["attachments"];
                reply_to_id?: Id<"messages">;
                reply_preview?: Message["reply_preview"];
                is_nudge?: boolean;
            }
        ) => {
            if (!conversation?._id && !partnershipId) {
                console.error("No conversation or partnership ID available");
                return null;
            }

            // Create optimistic message
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const optimisticMessage: OptimisticMessage = {
                tempId,
                content,
                message_type: opts?.message_type || "text",
                attachments: opts?.attachments,
                reply_to_id: opts?.reply_to_id,
                reply_preview: opts?.reply_preview,
                status: "sending",
                is_nudge: opts?.is_nudge,
                created_at: Date.now(),
            };

            setOptimisticMessages((prev) => [...prev, optimisticMessage]);

            try {
                // If no conversation, create one first
                let conversationId = conversation?._id;
                if (!conversationId && partnershipId) {
                    conversationId = await getOrCreateConversationMutation({
                        partnership_id: partnershipId,
                    });
                }

                if (!conversationId) {
                    throw new Error("Could not get or create conversation");
                }

                // Send the message
                const messageId = await sendMessageMutation({
                    conversation_id: conversationId,
                    content,
                    message_type: opts?.message_type,
                    attachments: opts?.attachments,
                    reply_to_id: opts?.reply_to_id,
                    is_nudge: opts?.is_nudge,
                });

                // Remove optimistic message (real message will appear via subscription)
                setOptimisticMessages((prev) => prev.filter((m) => m.tempId !== tempId));

                return messageId;
            } catch (error) {
                // Mark optimistic message as failed
                setOptimisticMessages((prev) =>
                    prev.map((m) =>
                        m.tempId === tempId ? { ...m, status: "failed" } : m
                    )
                );
                console.error("Failed to send message:", error);
                throw error;
            }
        },
        [conversation?._id, partnershipId, sendMessageMutation, getOrCreateConversationMutation]
    );

    // Add reaction
    const addReaction = useCallback(
        async (messageId: Id<"messages">, emoji: string) => {
            try {
                await addReactionMutation({ message_id: messageId, emoji });
            } catch (error) {
                console.error("Failed to add reaction:", error);
                throw error;
            }
        },
        [addReactionMutation]
    );

    // Remove reaction
    const removeReaction = useCallback(
        async (messageId: Id<"messages">, emoji: string) => {
            try {
                await removeReactionMutation({ message_id: messageId, emoji });
            } catch (error) {
                console.error("Failed to remove reaction:", error);
                throw error;
            }
        },
        [removeReactionMutation]
    );

    // Delete message
    const deleteMessage = useCallback(
        async (messageId: Id<"messages">) => {
            try {
                await deleteMessageMutation({ message_id: messageId });
            } catch (error) {
                console.error("Failed to delete message:", error);
                throw error;
            }
        },
        [deleteMessageMutation]
    );

    // Mark as read
    const markAsRead = useCallback(async () => {
        if (!conversation?._id) return;
        try {
            await markAsReadMutation({ conversation_id: conversation._id });
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    }, [conversation?._id, markAsReadMutation]);

    // Handle typing indicator
    const handleTyping = useCallback(() => {
        if (!isTyping) {
            setIsTyping(true);
            // TODO: Send typing status to Redis via API
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            // TODO: Send stop typing to Redis via API
        }, 3000);
    }, [isTyping]);

    // Cleanup typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    // Retry failed message
    const retryMessage = useCallback(
        async (tempId: string) => {
            const failedMessage = optimisticMessages.find((m) => m.tempId === tempId);
            if (!failedMessage) return;

            // Remove the failed message
            setOptimisticMessages((prev) => prev.filter((m) => m.tempId !== tempId));

            // Retry sending
            await sendMessage(failedMessage.content, {
                message_type: failedMessage.message_type,
                attachments: failedMessage.attachments,
                reply_to_id: failedMessage.reply_to_id,
                reply_preview: failedMessage.reply_preview,
                is_nudge: failedMessage.is_nudge,
            });
        },
        [optimisticMessages, sendMessage]
    );

    // Combine real messages with optimistic ones
    const allMessages: (Message | (OptimisticMessage & { _id?: never }))[] = [
        ...(messages || []),
        ...optimisticMessages,
    ];

    return {
        // Data
        conversation,
        messages: allMessages,
        unreadCount: unreadCount || 0,
        isLoading: messages === undefined && conversation !== undefined,
        hasConversation: !!conversation,

        // Actions
        sendMessage,
        addReaction,
        removeReaction,
        deleteMessage,
        markAsRead,
        retryMessage,

        // Typing
        isTyping,
        partnerIsTyping,
        handleTyping,

        // Optimistic state
        optimisticMessages,
    };
}

export default useChat;
