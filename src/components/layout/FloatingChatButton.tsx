"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { motion, type PanInfo } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface FloatingChatButtonProps {
  partnerId?: Id<"users"> | null;
}

type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const STORAGE_KEY = "duotrak-chat-fab-corner";

const cornerClasses: Record<Corner, string> = {
  "top-left": "top-20 left-4 sm:top-24 sm:left-6",
  "top-right": "top-20 right-4 sm:top-24 sm:right-6",
  "bottom-left": "bottom-24 left-4 sm:bottom-24 sm:left-6 md:bottom-6",
  "bottom-right": "bottom-24 right-4 sm:bottom-24 sm:right-6 md:bottom-6",
};

export default function FloatingChatButton({ partnerId }: FloatingChatButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [corner, setCorner] = useState<Corner>("bottom-left");
  const suppressClickRef = useRef(false);
  const suppressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const conversation = useQuery(
    api.chat.getConversationByPartnerId,
    partnerId ? { partner_id: partnerId } : "skip"
  );

  const unreadCount = useQuery(
    api.chat.getUnreadCount,
    conversation?._id ? { conversation_id: conversation._id } : "skip"
  );

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Corner | null;
      if (stored && Object.prototype.hasOwnProperty.call(cornerClasses, stored)) {
        setCorner(stored);
      }
    } catch {
      // Ignore storage errors; keep default corner.
    }
  }, []);

  useEffect(() => {
    return () => {
      if (suppressTimeoutRef.current) {
        clearTimeout(suppressTimeoutRef.current);
        suppressTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, corner);
    } catch {
      // Ignore storage errors.
    }
  }, [corner]);

  const positionClass = useMemo(() => cornerClasses[corner], [corner]);

  const setCornerFromPoint = (point: PanInfo["point"]) => {
    const horizontal: "left" | "right" = point.x <= window.innerWidth / 2 ? "left" : "right";
    const vertical: "top" | "bottom" = point.y <= window.innerHeight / 2 ? "top" : "bottom";
    setCorner(`${vertical}-${horizontal}` as Corner);
  };

  const count = typeof unreadCount === "number" ? unreadCount : 0;

  if (!partnerId || pathname.startsWith("/partner/chat")) {
    return null;
  }

  return (
    <motion.button
      type="button"
      aria-label="Open chat"
      title="Drag to move chat button to another corner"
      animate={{ x: 0, y: 0 }}
      drag
      dragMomentum={false}
      dragElastic={0.12}
      onDragStart={(_, info) => {
        dragStartRef.current = { x: info.point.x, y: info.point.y };
      }}
      onDragEnd={(_, info) => {
        const start = dragStartRef.current;
        if (start) {
          const dx = info.point.x - start.x;
          const dy = info.point.y - start.y;
          const moved = Math.hypot(dx, dy);
          if (moved > 8) {
            suppressClickRef.current = true;
            if (suppressTimeoutRef.current) {
              clearTimeout(suppressTimeoutRef.current);
            }
            suppressTimeoutRef.current = setTimeout(() => {
              suppressClickRef.current = false;
              suppressTimeoutRef.current = null;
            }, 160);
          }
        }
        setCornerFromPoint(info.point);
        dragStartRef.current = null;
      }}
      onClick={() => {
        if (suppressClickRef.current) return;
        router.push("/partner/chat");
      }}
      className={`fixed z-[70] inline-flex h-12 w-12 cursor-grab items-center justify-center rounded-full border border-landing-clay bg-landing-espresso text-landing-cream shadow-lg transition-transform hover:scale-[1.03] active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-landing-clay ${positionClass}`}
    >
      <MessageCircle className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </motion.button>
  );
}
