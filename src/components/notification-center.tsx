"use client";

import { useMemo, useState } from "react";
import { Archive, Bell, CheckCheck, Clock3 } from "lucide-react";
import { useNotificationActions, useNotifications } from "@/hooks/useNotifications";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const categories = ["all", "task", "partner", "chat", "journal", "progress", "system"] as const;

export default function NotificationCenter() {
  const router = useRouter();
  const [category, setCategory] = useState<(typeof categories)[number]>("all");
  const [showArchived, setShowArchived] = useState(false);
  const { notifications, unreadCount, isLoading } = useNotifications({
    category,
    includeArchived: showArchived,
    limit: 120,
  });
  const { markRead, markAllRead, archive, snooze, bulkAction } = useNotificationActions();

  const rows = useMemo(() => notifications, [notifications]);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-landing-clay bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="inline-flex items-center gap-2 text-xl font-black tracking-tight text-landing-espresso">
              <Bell className="h-5 w-5" />
              Notifications
            </h1>
            <p className="mt-1 text-sm text-landing-espresso-light">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : "You are all caught up."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
            >
              {showArchived ? "Hide archived" : "Show archived"}
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await markAllRead();
                  toast.success("All notifications marked as read.");
                } catch (error: any) {
                  toast.error(error?.message || "Could not mark all as read.");
                }
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-landing-espresso px-3 py-1.5 text-xs font-semibold text-landing-cream"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                category === item
                  ? "bg-landing-espresso text-landing-cream"
                  : "border border-landing-clay text-landing-espresso-light hover:bg-landing-cream"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        {isLoading ? (
          <div className="rounded-2xl border border-landing-clay bg-white p-6 text-sm text-landing-espresso-light">
            Loading notifications...
          </div>
        ) : null}

        {!isLoading && rows.length === 0 ? (
          <div className="rounded-2xl border border-landing-clay bg-white p-6 text-sm text-landing-espresso-light">
            No notifications yet.
          </div>
        ) : null}

        {!isLoading
          ? rows.map((notification: any) => (
              (() => {
                const meta =
                  typeof notification.metadata_json === "string"
                    ? (() => {
                        try {
                          return JSON.parse(notification.metadata_json);
                        } catch {
                          return null;
                        }
                      })()
                    : null;
                const chatCount =
                  notification.category === "chat" && meta && typeof meta.count === "number"
                    ? meta.count
                    : null;

                return (
              <motion.article
                key={notification._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border p-3 shadow-sm sm:p-4 ${
                  notification.read
                    ? "border-landing-clay bg-white"
                    : "border-landing-terracotta/35 bg-landing-cream"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-landing-espresso">{notification.title}</p>
                    <p className="mt-1 text-sm text-landing-espresso-light">{notification.message}</p>
                    <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-landing-espresso-light">
                      <Clock3 className="h-3 w-3" />
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className="rounded-full border border-landing-clay bg-white px-2 py-0.5 text-[11px] font-semibold text-landing-espresso-light">
                    {chatCount && chatCount > 1
                      ? `${notification.category} • ${chatCount}`
                      : notification.category}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {notification.category === "journal" ? (
                    <button
                      type="button"
                      onClick={() => {
                        const entryId =
                          notification.related_entity_type === "journal_entry"
                            ? notification.related_entity_id
                            : meta?.entryId;
                        const href = entryId ? `/journal?entryId=${encodeURIComponent(entryId)}` : "/journal";
                        router.push(href);
                      }}
                      className="rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                    >
                      Open entry
                    </button>
                  ) : null}
                  {!notification.read ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await markRead(notification._id);
                        } catch (error: any) {
                          toast.error(error?.message || "Could not mark notification as read.");
                        }
                      }}
                      className="rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                    >
                      Mark read
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await snooze(notification._id, 60);
                        toast.success("Snoozed for 1 hour.");
                      } catch (error: any) {
                        toast.error(error?.message || "Could not snooze notification.");
                      }
                    }}
                    className="rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                  >
                    Snooze 1h
                  </button>
                  {!notification.archived ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await archive(notification._id);
                        } catch (error: any) {
                          toast.error(error?.message || "Could not archive notification.");
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </button>
                  ) : null}
                </div>
              </motion.article>
                );
              })()
            ))
          : null}
      </section>

      {!isLoading && rows.length > 0 ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={async () => {
              try {
                await bulkAction(
                  rows.map((n: any) => n._id),
                  "archive"
                );
                toast.success("All visible notifications archived.");
              } catch (error: any) {
                toast.error(error?.message || "Could not archive visible notifications.");
              }
            }}
            className="rounded-lg border border-landing-clay px-3 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
          >
            Archive visible
          </button>
        </div>
      ) : null}
    </div>
  );
}
