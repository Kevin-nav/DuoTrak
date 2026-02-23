import { v } from "convex/values";
import { query, mutation, action, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { api, internal } from "./_generated/api";
import { uploadToR2 } from "./lib/r2";

const ONLINE_WINDOW_MS = 70_000;
const IMAGE_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;
const VIDEO_UPLOAD_LIMIT_BYTES = 50 * 1024 * 1024;

function decodeBase64ToBytes(base64Data: string): Uint8Array {
    if (typeof atob !== "function") {
        throw new Error("Base64 decoder is unavailable in this runtime");
    }
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function getAttachmentTypeFromMime(mimeType: string): "image" | "video" | "document" {
    if (mimeType.startsWith("image/")) {
        return "image";
    }
    if (mimeType.startsWith("video/")) {
        return "video";
    }
    return "document";
}

function sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function normalizeLegacyAttachmentUrl(url: string): string {
    const trimmed = url.trim().replace(/^['"]+|['"]+$/g, "");
    const bucketName = (process.env.R2_BUCKET_NAME || "duotrak").toLowerCase();

    try {
        const parsed = new URL(trimmed);
        const pathSegments = parsed.pathname.split("/").filter(Boolean);
        if (pathSegments.length < 2) {
            return trimmed;
        }

        // Legacy format:
        // https://pub-<id>.r2.dev/<bucket>/<key>
        // should become:
        // https://pub-<id>.r2.dev/<key>
        if (parsed.hostname.endsWith(".r2.dev") && pathSegments[0].toLowerCase() === bucketName) {
            const key = pathSegments.slice(1).join("/");
            return `${parsed.origin}/${key}`;
        }

        // Legacy backend format used API endpoint URLs, which are not browser-public:
        // https://<account>.r2.cloudflarestorage.com/<bucket>/<key>
        // should become:
        // https://pub-<account>.r2.dev/<key>
        if (parsed.hostname.endsWith(".r2.cloudflarestorage.com") && pathSegments[0].toLowerCase() === bucketName) {
            const accountId = parsed.hostname.split(".")[0];
            const key = pathSegments.slice(1).join("/");
            return `https://pub-${accountId}.r2.dev/${key}`;
        }
    } catch {
        return trimmed;
    }

    return trimmed;
}

async function isUserOnline(
    ctx: any,
    userId: Id<"users">
): Promise<boolean> {
    const presence = await ctx.db
        .query("user_presence")
        .withIndex("by_user", (q: any) => q.eq("user_id", userId))
        .first();

    if (!presence) {
        return false;
    }

    return Date.now() - presence.last_heartbeat_at <= ONLINE_WINDOW_MS;
}

async function markIncomingMessagesAsDelivered(
    ctx: any,
    conversationId: Id<"conversations">,
    recipientUserId: Id<"users">
): Promise<number> {
    const now = Date.now();
    const pendingMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q: any) => q.eq("conversation_id", conversationId))
        .filter((q: any) =>
            q.and(
                q.neq(q.field("sender_id"), recipientUserId),
                q.eq(q.field("status"), "sent"),
                q.neq(q.field("is_deleted"), true)
            )
        )
        .collect();

    await Promise.all(
        pendingMessages.map((message: any) =>
            ctx.db.patch(message._id, {
                status: "delivered",
                delivered_at: now,
                updated_at: now,
            })
        )
    );

    return pendingMessages.length;
}

async function markConversationAsReadForUser(
    ctx: any,
    conversationId: Id<"conversations">,
    currentUserId: Id<"users">
): Promise<{ success: true; messagesMarkedRead: number }> {
    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
        throw new Error("Conversation not found");
    }

    const partnership = await ctx.db.get(conversation.partnership_id);
    if (!partnership) {
        throw new Error("Partnership not found");
    }

    const now = Date.now();
    const isUser1 = currentUserId === partnership.user1_id;

    await ctx.db.patch(conversation._id, {
        user1_unread_count: isUser1 ? 0 : conversation.user1_unread_count,
        user2_unread_count: isUser1 ? conversation.user2_unread_count : 0,
        user1_last_read_at: isUser1 ? now : conversation.user1_last_read_at,
        user2_last_read_at: isUser1 ? conversation.user2_last_read_at : now,
        updated_at: now,
    });

    const partnerId = isUser1 ? partnership.user2_id : partnership.user1_id;

    const unreadMessages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q: any) => q.eq("conversation_id", conversationId))
        .filter((q: any) =>
            q.and(
                q.eq(q.field("sender_id"), partnerId),
                q.neq(q.field("status"), "read")
            )
        )
        .collect();

    await Promise.all(
        unreadMessages.map((msg: any) =>
            ctx.db.patch(msg._id, {
                status: "read",
                read_at: now,
                updated_at: now,
            })
        )
    );

    return { success: true, messagesMarkedRead: unreadMessages.length };
}

// ============================================
// QUERIES
// ============================================

/**
 * Get or create a conversation for a partnership
 */
export const getOrCreateConversation = mutation({
    args: {
        partnership_id: v.id("partnerships"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        // Check if conversation already exists
        const existing = await ctx.db
            .query("conversations")
            .withIndex("by_partnership", (q) => q.eq("partnership_id", args.partnership_id))
            .first();

        if (existing) {
            return existing._id;
        }

        // Create new conversation
        const now = Date.now();
        const conversationId = await ctx.db.insert("conversations", {
            partnership_id: args.partnership_id,
            user1_unread_count: 0,
            user2_unread_count: 0,
            created_at: now,
            updated_at: now,
        });

        return conversationId;
    },
});

/**
 * Get conversation by partnership ID
 */
export const getConversation = query({
    args: {
        partnership_id: v.id("partnerships"),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_partnership", (q) => q.eq("partnership_id", args.partnership_id))
            .first();

        return conversation;
    },
});

/**
 * Get messages for a conversation with pagination
 */
export const getMessages = query({
    args: {
        conversation_id: v.id("conversations"),
        limit: v.optional(v.number()),
        cursor: v.optional(v.id("messages")),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        let messagesQuery = ctx.db
            .query("messages")
            .withIndex("by_conversation_recent", (q) =>
                q.eq("conversation_id", args.conversation_id)
                    .eq("is_deleted", false)
            )
            .order("desc");

        // If cursor provided, get messages before it
        if (args.cursor) {
            const cursorMessage = await ctx.db.get(args.cursor);
            if (cursorMessage) {
                messagesQuery = ctx.db
                    .query("messages")
                    .withIndex("by_conversation", (q) =>
                        q.eq("conversation_id", args.conversation_id)
                            .lt("created_at", cursorMessage.created_at)
                    )
                    .order("desc");
            }
        }

        const messages = await messagesQuery.take(limit);

        // Fetch sender info for each message
        const messagesWithSenders = await Promise.all(
            messages.map(async (message) => {
                const sender = await ctx.db.get(message.sender_id);
                const normalizedAttachments = message.attachments?.map((attachment: any) => ({
                    ...attachment,
                    url: normalizeLegacyAttachmentUrl(attachment.url),
                    thumbnail_url: attachment.thumbnail_url
                        ? normalizeLegacyAttachmentUrl(attachment.thumbnail_url)
                        : attachment.thumbnail_url,
                }));
                return {
                    ...message,
                    attachments: normalizedAttachments,
                    sender: sender ? {
                        id: sender._id,
                        name: sender.full_name || sender.nickname || "Unknown",
                        avatar: sender.profile_picture_url,
                    } : null,
                };
            })
        );

        // Return in chronological order (oldest first)
        return messagesWithSenders.reverse();
    },
});

/**
 * Get unread message count for current user in a conversation
 */
export const getUnreadCount = query({
    args: {
        conversation_id: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return 0;
        }

        const conversation = await ctx.db.get(args.conversation_id);
        if (!conversation) {
            return 0;
        }

        // Get partnership to determine which user we are
        const partnership = await ctx.db.get(conversation.partnership_id);
        if (!partnership) {
            return 0;
        }

        // Get current user by firebase UID
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .first();

        if (!currentUser) {
            return 0;
        }

        // Return appropriate unread count
        if (currentUser._id === partnership.user1_id) {
            return conversation.user1_unread_count;
        } else if (currentUser._id === partnership.user2_id) {
            return conversation.user2_unread_count;
        }

        return 0;
    },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Send a new message
 */
export const sendMessage = mutation({
    args: {
        conversation_id: v.id("conversations"),
        content: v.string(),
        message_type: v.optional(v.string()),
        attachments: v.optional(v.array(v.object({
            type: v.string(),
            url: v.string(),
            name: v.optional(v.string()),
            size: v.optional(v.number()),
            thumbnail_url: v.optional(v.string()),
            duration: v.optional(v.number()),
            mime_type: v.optional(v.string()),
        }))),
        reply_to_id: v.optional(v.id("messages")),
        is_nudge: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        // Get current user
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .first();

        if (!currentUser) {
            throw new Error("User not found");
        }

        // Get conversation
        const conversation = await ctx.db.get(args.conversation_id);
        if (!conversation) {
            throw new Error("Conversation not found");
        }

        // Get partnership to find other user
        const partnership = await ctx.db.get(conversation.partnership_id);
        if (!partnership) {
            throw new Error("Partnership not found");
        }
        const recipientUserId =
            partnership.user1_id === currentUser._id ? partnership.user2_id : partnership.user1_id;
        const recipientOnline = await isUserOnline(ctx, recipientUserId);

        // Build reply preview if replying
        let reply_preview = undefined;
        if (args.reply_to_id) {
            const replyMessage = await ctx.db.get(args.reply_to_id);
            if (replyMessage) {
                const replySender = await ctx.db.get(replyMessage.sender_id);
                reply_preview = {
                    sender_id: replyMessage.sender_id,
                    sender_name: replySender?.full_name || replySender?.nickname || "Unknown",
                    content: replyMessage.content.substring(0, 100), // Truncate for preview
                    message_type: replyMessage.message_type,
                };
            }
        }

        const now = Date.now();
        const messageType = args.message_type || "text";

        // Create message
        const messageId = await ctx.db.insert("messages", {
            conversation_id: args.conversation_id,
            sender_id: currentUser._id,
            content: args.content,
            message_type: messageType,
            attachments: args.attachments,
            reply_to_id: args.reply_to_id,
            reply_preview,
            status: recipientOnline ? "delivered" : "sent",
            delivered_at: recipientOnline ? now : undefined,
            is_nudge: args.is_nudge,
            is_deleted: false,
            created_at: now,
            updated_at: now,
        });

        // Update conversation with last message
        const isUser1 = currentUser._id === partnership.user1_id;

        await ctx.db.patch(conversation._id, {
            last_message_text: args.content.substring(0, 100),
            last_message_at: now,
            last_message_sender_id: currentUser._id,
            // Increment unread count for the OTHER user
            user1_unread_count: isUser1
                ? conversation.user1_unread_count
                : conversation.user1_unread_count + 1,
            user2_unread_count: isUser1
                ? conversation.user2_unread_count + 1
                : conversation.user2_unread_count,
            updated_at: now,
        });

        await ctx.scheduler.runAfter(
            0,
            (internal as any).notifications.dispatchEvent,
            {
                eventType: args.is_nudge ? "partner_nudge" : "new_message",
                recipientUserId,
                actorUserId: currentUser._id,
                context: JSON.stringify({
                    conversationId: String(conversation._id),
                    preview: args.content.substring(0, 140),
                    messageId: String(messageId),
                }),
            }
        );

        return messageId;
    },
});

/**
 * Mark messages as read
 */
export const markAsRead = mutation({
    args: {
        conversation_id: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        // Get current user
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .first();

        if (!currentUser) {
            throw new Error("User not found");
        }

        const result = await markConversationAsReadForUser(
            ctx,
            args.conversation_id,
            currentUser._id
        );

        await ctx.scheduler.runAfter(
            0,
            (internal as any).notifications.clearChatNotificationsForConversation,
            {
                userId: currentUser._id,
                conversationId: String(args.conversation_id),
            }
        );

        return result;
    },
});

export const markConversationReadForUser = mutation({
    args: {
        conversation_id: v.id("conversations"),
        user_id: v.id("users"),
    },
    handler: async (ctx, args) => {
        return await markConversationAsReadForUser(ctx, args.conversation_id, args.user_id);
    },
});

/**
 * Add a reaction to a message
 */
export const addReaction = mutation({
    args: {
        message_id: v.id("messages"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        // Get current user
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .first();

        if (!currentUser) {
            throw new Error("User not found");
        }

        const message = await ctx.db.get(args.message_id);
        if (!message) {
            throw new Error("Message not found");
        }

        const now = Date.now();
        const reactions = message.reactions || [];

        // Check if user already reacted with this emoji
        const existingReactionIndex = reactions.findIndex(
            (r) => r.user_id === currentUser._id && r.emoji === args.emoji
        );

        if (existingReactionIndex >= 0) {
            // Remove existing reaction (toggle off)
            reactions.splice(existingReactionIndex, 1);
        } else {
            // Remove any existing reaction from this user (only one reaction per user)
            const userReactionIndex = reactions.findIndex((r) => r.user_id === currentUser._id);
            if (userReactionIndex >= 0) {
                reactions.splice(userReactionIndex, 1);
            }

            // Add new reaction
            reactions.push({
                user_id: currentUser._id,
                emoji: args.emoji,
                created_at: now,
            });
        }

        await ctx.db.patch(args.message_id, {
            reactions,
            updated_at: now,
        });

        return { success: true };
    },
});

/**
 * Remove a reaction from a message
 */
export const removeReaction = mutation({
    args: {
        message_id: v.id("messages"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        // Get current user
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .first();

        if (!currentUser) {
            throw new Error("User not found");
        }

        const message = await ctx.db.get(args.message_id);
        if (!message) {
            throw new Error("Message not found");
        }

        const now = Date.now();
        const reactions = (message.reactions || []).filter(
            (r) => !(r.user_id === currentUser._id && r.emoji === args.emoji)
        );

        await ctx.db.patch(args.message_id, {
            reactions,
            updated_at: now,
        });

        return { success: true };
    },
});

/**
 * Soft delete a message
 */
export const deleteMessage = mutation({
    args: {
        message_id: v.id("messages"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        // Get current user
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .first();

        if (!currentUser) {
            throw new Error("User not found");
        }

        const message = await ctx.db.get(args.message_id);
        if (!message) {
            throw new Error("Message not found");
        }

        // Only the sender can delete their message
        if (message.sender_id !== currentUser._id) {
            throw new Error("You can only delete your own messages");
        }

        const now = Date.now();
        await ctx.db.patch(args.message_id, {
            is_deleted: true,
            deleted_at: now,
            content: "This message was deleted",
            attachments: undefined,
            updated_at: now,
        });

        return { success: true };
    },
});

/**
 * Get conversation for a partner (by partner's user ID)
 */
export const getConversationByPartnerId = query({
    args: {
        partner_id: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        // Get current user
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .first();

        if (!currentUser) {
            return null;
        }

        // Find partnership between current user and partner
        // Check both directions since partnerships can be created either way
        let partnership = await ctx.db
            .query("partnerships")
            .withIndex("by_user1", (q) => q.eq("user1_id", currentUser._id))
            .filter((q) => q.eq(q.field("user2_id"), args.partner_id))
            .first();

        if (!partnership) {
            partnership = await ctx.db
                .query("partnerships")
                .withIndex("by_user2", (q) => q.eq("user2_id", currentUser._id))
                .filter((q) => q.eq(q.field("user1_id"), args.partner_id))
                .first();
        }

        if (!partnership) {
            return null;
        }

        // Get or return null for conversation
        const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_partnership", (q) => q.eq("partnership_id", partnership._id))
            .first();

        return conversation;
    },
});

/**
 * Record the current user's presence heartbeat.
 */
export const heartbeat = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .first();

        if (!currentUser) {
            throw new Error("User not found");
        }

        const now = Date.now();
        const existingPresence = await ctx.db
            .query("user_presence")
            .withIndex("by_user", (q) => q.eq("user_id", currentUser._id))
            .first();

        if (existingPresence) {
            await ctx.db.patch(existingPresence._id, {
                last_heartbeat_at: now,
                updated_at: now,
            });
        } else {
            await ctx.db.insert("user_presence", {
                user_id: currentUser._id,
                last_heartbeat_at: now,
                updated_at: now,
            });
        }

        const [partnershipsAsUser1, partnershipsAsUser2] = await Promise.all([
            ctx.db
                .query("partnerships")
                .withIndex("by_user1", (q) => q.eq("user1_id", currentUser._id))
                .filter((q) => q.eq(q.field("status"), "active"))
                .collect(),
            ctx.db
                .query("partnerships")
                .withIndex("by_user2", (q) => q.eq("user2_id", currentUser._id))
                .filter((q) => q.eq(q.field("status"), "active"))
                .collect(),
        ]);

        const partnerships = [...partnershipsAsUser1, ...partnershipsAsUser2];
        const conversations = await Promise.all(
            partnerships.map((partnership) =>
                ctx.db
                    .query("conversations")
                    .withIndex("by_partnership", (q) => q.eq("partnership_id", partnership._id))
                    .first()
            )
        );

        await Promise.all(
            conversations
                .filter((conversation): conversation is NonNullable<typeof conversation> => !!conversation)
                .map((conversation) =>
                    markIncomingMessagesAsDelivered(ctx, conversation._id, currentUser._id)
                )
        );

        return { success: true };
    },
});

/**
 * Upload a chat attachment and return a permanent R2 URL.
 */
export const uploadAttachment = action({
    args: {
        file_name: v.string(),
        content_type: v.string(),
        base64_data: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const currentUser = await ctx.runQuery(api.users.current, {});
        if (!currentUser?.id) {
            throw new Error("User not found");
        }

        const fileBytes = decodeBase64ToBytes(args.base64_data);
        const attachmentType = getAttachmentTypeFromMime(args.content_type);
        if (attachmentType === "image" && fileBytes.byteLength > IMAGE_UPLOAD_LIMIT_BYTES) {
            throw new Error("Image exceeds 10MB limit");
        }
        if (attachmentType === "video" && fileBytes.byteLength > VIDEO_UPLOAD_LIMIT_BYTES) {
            throw new Error("Video exceeds 50MB limit");
        }

        const safeName = sanitizeFileName(args.file_name);
        const key = `chat/${currentUser.id}/${Date.now()}-${safeName}`;
        const url = await uploadToR2(key, fileBytes, args.content_type);

        return {
            type: attachmentType,
            url,
            name: args.file_name,
            size: fileBytes.byteLength,
            mime_type: args.content_type,
        };
    },
});

/**
 * Get partner presence status for chat.
 */
export const getPartnerPresence = query({
    args: {
        partner_id: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { is_online: false as const, last_seen_at: undefined as number | undefined };
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .first();

        if (!currentUser) {
            return { is_online: false as const, last_seen_at: undefined as number | undefined };
        }

        // Authorize: ensure current user and partner are in an active partnership.
        let partnership = await ctx.db
            .query("partnerships")
            .withIndex("by_user1", (q) => q.eq("user1_id", currentUser._id))
            .filter((q) =>
                q.and(
                    q.eq(q.field("user2_id"), args.partner_id),
                    q.eq(q.field("status"), "active")
                )
            )
            .first();

        if (!partnership) {
            partnership = await ctx.db
                .query("partnerships")
                .withIndex("by_user2", (q) => q.eq("user2_id", currentUser._id))
                .filter((q) =>
                    q.and(
                        q.eq(q.field("user1_id"), args.partner_id),
                        q.eq(q.field("status"), "active")
                    )
                )
                .first();
        }

        if (!partnership) {
            return { is_online: false as const, last_seen_at: undefined as number | undefined };
        }

        const presence = await ctx.db
            .query("user_presence")
            .withIndex("by_user", (q) => q.eq("user_id", args.partner_id))
            .first();

        if (!presence) {
            return { is_online: false as const, last_seen_at: undefined as number | undefined };
        }

        const now = Date.now();
        const isOnline = now - presence.last_heartbeat_at <= 70_000;

        return {
            is_online: isOnline,
            last_seen_at: presence.last_heartbeat_at,
        };
    },
});

/**
 * Set current user's typing status for a conversation.
 */
export const setTypingStatus = mutation({
    args: {
        conversation_id: v.id("conversations"),
        is_typing: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .first();

        if (!currentUser) {
            throw new Error("User not found");
        }

        const conversation = await ctx.db.get(args.conversation_id);
        if (!conversation) {
            throw new Error("Conversation not found");
        }

        const partnership = await ctx.db.get(conversation.partnership_id);
        if (!partnership) {
            throw new Error("Partnership not found");
        }

        const isParticipant =
            currentUser._id === partnership.user1_id || currentUser._id === partnership.user2_id;

        if (!isParticipant || partnership.status !== "active") {
            throw new Error("Forbidden");
        }

        const now = Date.now();
        const existing = await ctx.db
            .query("chat_typing")
            .withIndex("by_conversation_user", (q) =>
                q.eq("conversation_id", args.conversation_id).eq("user_id", currentUser._id)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                is_typing: args.is_typing,
                updated_at: now,
            });
            return existing._id;
        }

        return await ctx.db.insert("chat_typing", {
            conversation_id: args.conversation_id,
            user_id: currentUser._id,
            is_typing: args.is_typing,
            updated_at: now,
        });
    },
});

export const setActiveConversationView = mutation({
    args: {
        conversation_id: v.id("conversations"),
        is_active: v.boolean(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q: any) => q.eq("firebase_uid", identity.subject))
            .first();

        if (!currentUser) {
            throw new Error("User not found");
        }

        const now = Date.now();
        const existing = await ctx.db
            .query("chat_active_views")
            .withIndex("by_conversation_user", (q: any) =>
                q.eq("conversation_id", args.conversation_id).eq("user_id", currentUser._id)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                is_active: args.is_active,
                updated_at: now,
            });
            return existing._id;
        }

        return await ctx.db.insert("chat_active_views", {
            conversation_id: args.conversation_id,
            user_id: currentUser._id,
            is_active: args.is_active,
            updated_at: now,
        });
    },
});

export const isUserActivelyViewingConversation = internalQuery({
    args: {
        user_id: v.id("users"),
        conversation_id: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const view = await ctx.db
            .query("chat_active_views")
            .withIndex("by_conversation_user", (q: any) =>
                q.eq("conversation_id", args.conversation_id).eq("user_id", args.user_id)
            )
            .first();

        if (!view || !view.is_active) {
            return false;
        }

        // Consider active if heartbeat is fresh within 20s.
        return Date.now() - view.updated_at <= 20_000;
    },
});

/**
 * Get partner typing status for a conversation.
 */
export const getPartnerTypingStatus = query({
    args: {
        conversation_id: v.id("conversations"),
        partner_id: v.id("users"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { is_typing: false as const };
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .first();

        if (!currentUser) {
            return { is_typing: false as const };
        }

        const conversation = await ctx.db.get(args.conversation_id);
        if (!conversation) {
            return { is_typing: false as const };
        }

        const partnership = await ctx.db.get(conversation.partnership_id);
        if (!partnership || partnership.status !== "active") {
            return { is_typing: false as const };
        }

        const isValidParticipantPair =
            (partnership.user1_id === currentUser._id && partnership.user2_id === args.partner_id) ||
            (partnership.user2_id === currentUser._id && partnership.user1_id === args.partner_id);

        if (!isValidParticipantPair) {
            return { is_typing: false as const };
        }

        const partnerTyping = await ctx.db
            .query("chat_typing")
            .withIndex("by_conversation_user", (q) =>
                q.eq("conversation_id", args.conversation_id).eq("user_id", args.partner_id)
            )
            .first();

        if (!partnerTyping || !partnerTyping.is_typing) {
            return { is_typing: false as const };
        }

        const now = Date.now();
        const isFresh = now - partnerTyping.updated_at <= 5_000;
        return { is_typing: isFresh };
    },
});
