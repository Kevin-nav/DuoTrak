"use client";

import { MessageCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface FloatingChatButtonProps {
  partnerId?: Id<"users"> | null;
}

export default function FloatingChatButton({ partnerId }: FloatingChatButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const conversation = useQuery(
    api.chat.getConversationByPartnerId,
    partnerId ? { partner_id: partnerId } : "skip"
  );

  const unreadCount = useQuery(
    api.chat.getUnreadCount,
    conversation?._id ? { conversation_id: conversation._id } : "skip"
  );

  if (!partnerId || pathname.startsWith("/partner/chat")) {
    return null;
  }

  const count = typeof unreadCount === "number" ? unreadCount : 0;

  return (
    <button
      type="button"
      aria-label="Open chat"
      onClick={() => router.push("/partner/chat")}
      className="fixed bottom-24 right-4 z-[70] inline-flex h-12 w-12 items-center justify-center rounded-full border border-landing-clay bg-landing-espresso text-landing-cream shadow-lg transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-landing-clay sm:bottom-24 sm:right-6 md:bottom-6 md:right-6"
    >
      <MessageCircle className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}

