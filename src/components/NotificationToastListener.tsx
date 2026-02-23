"use client";

import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { useNotificationPreferences, useNotifications } from "@/hooks/useNotifications";

const SESSION_KEY = "duotrak_seen_notification_ids";

function parseTimeToMinutes(value: string): number {
  const [hh, mm] = value.split(":").map((v) => Number(v));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
  return hh * 60 + mm;
}

function isInQuietHours(now: Date, start: string, end: string): boolean {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

async function playToneForCategory(category: string, priority: string) {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  if (ctx.state === "suspended") {
    await ctx.resume().catch(() => null);
  }

  const master = ctx.createGain();
  master.gain.value = priority === "high" ? 0.06 : 0.045;
  master.connect(ctx.destination);

  const sequence =
    category === "chat"
      ? [880, 1175]
      : category === "task"
      ? [660, 660, 880]
      : category === "partner"
      ? [740, 988]
      : [587, 784];

  const now = ctx.currentTime;
  sequence.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + index * 0.12);
    gain.gain.exponentialRampToValueAtTime(1, now + index * 0.12 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 0.09);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now + index * 0.12);
    osc.stop(now + index * 0.12 + 0.11);
  });

  window.setTimeout(() => {
    void ctx.close();
  }, sequence.length * 130 + 180);
}

export default function NotificationToastListener() {
  const router = useRouter();
  const pathname = usePathname();
  const { notifications, isLoading } = useNotifications({ limit: 30, includeArchived: false });
  const { preferences } = useNotificationPreferences();
  const isInitializedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      seenIdsRef.current = new Set(parsed);
    } catch {
      // Ignore storage parse errors and continue with empty set.
    }
  }, []);

  const unreadRows = useMemo(
    () =>
      notifications
        .filter((row: any) => !row.read && !row.archived)
        .sort((a: any, b: any) => a.created_at - b.created_at),
    [notifications]
  );

  useEffect(() => {
    if (isLoading) return;

    if (!isInitializedRef.current) {
      for (const row of unreadRows) {
        seenIdsRef.current.add(String(row._id));
      }
      isInitializedRef.current = true;
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(Array.from(seenIdsRef.current)));
      } catch {
        // ignore
      }
      return;
    }

    for (const row of unreadRows) {
      const id = String(row._id);
      if (seenIdsRef.current.has(id)) continue;
      seenIdsRef.current.add(id);

      // Avoid chat popup noise while already in fullscreen chat.
      if (row.category === "chat" && pathname.startsWith("/partner/chat")) {
        continue;
      }

      toast(row.title, {
        description: row.message,
        action: {
          label: row.category === "chat" ? "Open Chat" : "Open",
          onClick: () => {
            if (row.category === "chat") {
              router.push("/partner/chat");
              return;
            }
            router.push("/notifications");
          },
        },
      });

      const soundsEnabled = preferences?.sound_enabled ?? true;
      if (!soundsEnabled) continue;
      const quietHoursEnabled = preferences?.quiet_hours_enabled ?? false;
      const quietStart = preferences?.quiet_hours_start ?? "22:00";
      const quietEnd = preferences?.quiet_hours_end ?? "07:00";
      const now = new Date();
      const mutedByQuietHours =
        quietHoursEnabled && isInQuietHours(now, quietStart, quietEnd);
      if (mutedByQuietHours) continue;

      void playToneForCategory(row.category || "system", row.priority || "medium").catch(() => null);
    }

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(Array.from(seenIdsRef.current)));
    } catch {
      // ignore
    }
  }, [isLoading, pathname, preferences, router, unreadRows]);

  return null;
}
