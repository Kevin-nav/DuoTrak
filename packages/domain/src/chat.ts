export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export const normalizeChatMessage = (
  message: Omit<ChatMessage, "createdAt"> & { createdAt?: string | number | Date }
): ChatMessage => ({
  ...message,
  createdAt: new Date(message.createdAt ?? Date.now()).toISOString(),
});
