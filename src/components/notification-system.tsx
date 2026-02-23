"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationSystem() {
  const router = useRouter();
  const { unreadCount } = useNotifications({ limit: 1 });

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => router.push("/notifications")}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--theme-border)] bg-[var(--theme-background)] text-[var(--theme-foreground)] hover:bg-[var(--theme-muted)]"
      aria-label="Open notifications"
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[var(--theme-primary)] px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </motion.button>
  );
}
