"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useNotifications(params?: {
  category?: "all" | "task" | "partner" | "progress" | "system" | "chat" | "journal";
  includeArchived?: boolean;
  limit?: number;
}) {
  const category = params?.category ?? "all";
  const includeArchived = params?.includeArchived ?? false;
  const limit = params?.limit ?? 100;
  const notifications = useQuery((api as any).notifications.list, {
    category,
    includeArchived,
    limit,
  }) as any[] | undefined;
  const unreadCount = useQuery((api as any).notifications.unreadCount, {}) as number | undefined;

  return {
    notifications: notifications ?? [],
    unreadCount: unreadCount ?? 0,
    isLoading: notifications === undefined || unreadCount === undefined,
  };
}

export function useNotificationActions() {
  const markReadMutation = useMutation((api as any).notifications.markRead);
  const markAllReadMutation = useMutation((api as any).notifications.markAllRead);
  const archiveMutation = useMutation((api as any).notifications.archive);
  const snoozeMutation = useMutation((api as any).notifications.snooze);
  const bulkActionMutation = useMutation((api as any).notifications.bulkAction);

  return {
    markRead: (notificationId: string) => markReadMutation({ notificationId } as any),
    markAllRead: () => markAllReadMutation({}),
    archive: (notificationId: string) => archiveMutation({ notificationId } as any),
    snooze: (notificationId: string, durationMinutes: number) =>
      snoozeMutation({ notificationId, durationMinutes } as any),
    bulkAction: (notificationIds: string[], action: "mark-read" | "archive") =>
      bulkActionMutation({ notificationIds, action } as any),
  };
}

export function useNotificationPreferences() {
  const preferences = useQuery((api as any).notifications.getPreferences, {}) as
    | {
        sound_enabled?: boolean;
        quiet_hours_enabled?: boolean;
        quiet_hours_start?: string;
        quiet_hours_end?: string;
      }
    | undefined;

  return {
    preferences: preferences ?? null,
    isLoading: preferences === undefined,
  };
}
