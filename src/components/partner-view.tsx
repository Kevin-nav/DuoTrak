"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock3,
  ImageIcon,
  Mail,
  MessageCircle,
  PartyPopper,
  Send,
  Target,
  Timer,
  UserCircle2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import DashboardLayout from "./dashboard-layout";
import PartnerChatSurface from "@/components/partner/PartnerChatSurface";
import { useUser } from "@/contexts/UserContext";
import { api } from "../../convex/_generated/api";
import { usePartnerJournalActivity } from "@/hooks/useJournal";
import JournalEntryInteractions from "@/components/journal/JournalEntryInteractions";

interface Task {
  id: string;
  description: string;
  scheduledTime?: string;
  status: "todo" | "completed" | "skipped" | "awaiting-verification";
  progress?: {
    current: number;
    total: number;
    unit: string;
  };
  attachments?: {
    photos?: string[];
    notes?: string;
  };
}

interface ActivityItem {
  id: string;
  type: "task-completion" | "reflection" | "system-update" | "achievement" | "duo-challenge";
  timestamp: number;
  summary: string;
  details?: {
    notes?: string;
    photo?: string;
  };
}

interface PartnerInfo {
  id: string;
  username: string;
  profilePicture: string;
  timezone: string;
  localTime: string;
  initials: string;
  lastActive?: Date;
}

const tabItems = [
  { id: "day", label: "Partner's Day", mobileLabel: "Day", icon: CalendarDays },
  { id: "activity", label: "Activity Feed", mobileLabel: "Feed", icon: Target },
  { id: "chat", label: "Chat", mobileLabel: "Chat", icon: MessageCircle },
] as const;

const statusStyles: Record<Task["status"], { label: string; className: string }> = {
  todo: { label: "Upcoming", className: "bg-landing-sand text-landing-espresso-light" },
  completed: { label: "Completed", className: "bg-landing-sage/20 text-landing-espresso" },
  skipped: { label: "Skipped", className: "bg-red-100 text-red-700" },
  "awaiting-verification": { label: "Awaiting verification", className: "bg-landing-gold/25 text-landing-espresso" },
};

const tabPanelMotion = {
  initial: { opacity: 0, y: 10, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -8, filter: "blur(3px)" },
};

const getInitials = (name: string = "") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function PartnerView() {
  const router = useRouter();
  const { userDetails } = useUser();
  const [activeTab, setActiveTab] = useState<(typeof tabItems)[number]["id"]>("day");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isFullscreenOverlayOpen, setIsFullscreenOverlayOpen] = useState(false);
  const partnerViewData = useQuery(
    (api as any).taskInstances.getPartnerViewData,
    userDetails?.partner_id ? { activity_limit: 24, activity_days: 7 } : "skip"
  ) as
    | {
        day_tasks: Task[];
        activities: ActivityItem[];
      }
    | undefined;
  const partnerConversation = useQuery(
    api.chat.getConversationByPartnerId,
    userDetails?.partner_id ? { partner_id: userDetails.partner_id } : "skip"
  );
  const liveUnreadCount = useQuery(
    api.chat.getUnreadCount,
    partnerConversation?._id ? { conversation_id: partnerConversation._id } : "skip"
  );
  const partnerPresence = useQuery(
    (api as any).chat.getPartnerPresence,
    userDetails?.partner_id ? { partner_id: userDetails.partner_id } : "skip"
  ) as { is_online: boolean; last_seen_at?: number } | undefined;

  const tasks = partnerViewData?.day_tasks ?? [];
  const activities = partnerViewData?.activities ?? [];
  const unreadMessagesCount = typeof liveUnreadCount === "number" ? liveUnreadCount : 0;
  const isOnline = partnerPresence?.is_online ?? false;
  const partnerLastSeen = partnerPresence?.last_seen_at ? new Date(partnerPresence.last_seen_at) : undefined;
  const isLoading = !!userDetails?.partner_id && partnerViewData === undefined;
  const { entries: partnerJournalEntries, isLoading: isPartnerJournalLoading } = usePartnerJournalActivity(6);

  const formatPartnerLocalTime = (timezone?: string | null) => {
    if (!timezone) return "Local time unavailable";
    try {
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: timezone,
      }).format(new Date());
    } catch {
      return "Local time unavailable";
    }
  };

  const completionSummary = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "completed").length;
    return {
      completed,
      total: tasks.length,
      percent: tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100),
    };
  }, [tasks]);

  const sendNudge = () => toast.success("Nudge sent to your partner.");
  const celebrate = () => toast.success("Celebration message sent.");
  const goToChat = () => setActiveTab("chat");

  const resolvedPartner: PartnerInfo = {
    id: String(userDetails?.partner_id ?? "partner"),
    username: userDetails?.partner_nickname || userDetails?.partner_full_name || "Partner",
    profilePicture: userDetails?.partner_profile_picture_url || "/placeholder.svg?height=60&width=60",
    timezone: userDetails?.partner_timezone || "UTC",
    localTime: formatPartnerLocalTime(userDetails?.partner_timezone || "UTC"),
    initials: getInitials(userDetails?.partner_nickname || userDetails?.partner_full_name || "Partner"),
    lastActive: partnerLastSeen,
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-landing-clay bg-white">
          <div className="text-center">
            <Clock3 className="mx-auto mb-3 h-7 w-7 animate-pulse text-landing-terracotta" />
            <p className="text-sm text-landing-espresso-light">Loading partner information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!userDetails?.partner_id) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-landing-clay bg-white p-6 text-center">
          <UserCircle2 className="mx-auto mb-3 h-8 w-8 text-landing-espresso-light" />
          <h2 className="text-lg font-bold text-landing-espresso">No partner connected yet</h2>
          <p className="mt-2 text-sm text-landing-espresso-light">
            Connect with a partner to see their profile and activity here.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-3 pb-2 sm:space-y-5">
        <section className="rounded-2xl border border-landing-clay bg-white/95 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative">
                <img
                  src={resolvedPartner.profilePicture || "/placeholder.svg"}
                  alt={resolvedPartner.username}
                  className="h-12 w-12 rounded-full border border-landing-clay object-cover sm:h-14 sm:w-14"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
                    isOnline ? "bg-landing-sage" : "bg-gray-400"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-black tracking-tight text-landing-espresso">{resolvedPartner.username}</h1>
                <p className="text-base text-landing-espresso-light sm:text-sm">{resolvedPartner.localTime}</p>
                <p className="text-sm text-landing-espresso-light">{resolvedPartner.timezone}</p>
              </div>
            </div>
            <span className="w-fit rounded-full border border-landing-clay bg-landing-sand px-2.5 py-1 text-xs font-semibold text-landing-espresso-light">
              {isOnline ? "Online now" : "Away"}
            </span>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={sendNudge}
              className="inline-flex min-w-[104px] items-center justify-center gap-1.5 rounded-xl border border-landing-clay bg-landing-cream px-3 py-2 text-sm font-semibold text-landing-espresso transition-colors hover:bg-landing-sand"
            >
              <Send className="h-4 w-4 text-landing-terracotta" />
              Nudge
            </button>
            <button
              onClick={celebrate}
              className="inline-flex min-w-[116px] items-center justify-center gap-1.5 rounded-xl border border-landing-clay bg-landing-cream px-3 py-2 text-sm font-semibold text-landing-espresso transition-colors hover:bg-landing-sand"
            >
              <PartyPopper className="h-4 w-4 text-landing-gold" />
              Celebrate
            </button>
            <button
              onClick={goToChat}
              className="inline-flex min-w-[118px] items-center justify-center gap-1.5 rounded-xl border border-landing-clay bg-landing-cream px-3 py-2 text-sm font-semibold text-landing-espresso transition-colors hover:bg-landing-sand"
            >
              <MessageCircle className="h-4 w-4 text-landing-sage" />
              Message
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-landing-clay bg-white/95 p-4 shadow-sm">
          <h2 className="text-base font-bold text-landing-espresso sm:text-lg">About Partner</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-landing-clay bg-landing-cream p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-landing-espresso-light">Name</p>
              <p className="mt-1 text-sm font-semibold text-landing-espresso">{resolvedPartner.username}</p>
            </div>
            <div className="rounded-xl border border-landing-clay bg-landing-cream p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-landing-espresso-light">Email</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-landing-espresso">
                <Mail className="h-3.5 w-3.5 text-landing-espresso-light" />
                {userDetails.partner_email || "Not shared"}
              </p>
            </div>
            <div className="rounded-xl border border-landing-clay bg-landing-cream p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-landing-espresso-light">Timezone</p>
              <p className="mt-1 text-sm font-semibold text-landing-espresso">{resolvedPartner.timezone || "Not set"}</p>
            </div>
            <div className="rounded-xl border border-landing-clay bg-landing-cream p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-landing-espresso-light">Stats</p>
              <p className="mt-1 text-sm text-landing-espresso">
                {userDetails.partner_current_streak ?? 0} day streak · {userDetails.partner_goals_conquered ?? 0} goals
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-landing-clay bg-landing-cream p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-landing-espresso-light">Bio</p>
            <p className="mt-1 text-sm text-landing-espresso-light">
              {userDetails.partner_bio || "No bio added yet."}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-landing-clay bg-white/95 p-2 shadow-sm">
          <div className="grid grid-cols-3 gap-2">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                    isActive
                      ? "text-landing-cream"
                      : "text-landing-espresso-light hover:bg-landing-cream"
                  }`}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="partner-tab-pill"
                      className="absolute inset-0 rounded-xl bg-landing-espresso"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <Icon className="h-4 w-4" />
                    <span className="sm:hidden">{tab.mobileLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.id === "chat" && unreadMessagesCount > 0 ? (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {unreadMessagesCount}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "day" ? (
            <motion.section
              key="tab-day"
              className="space-y-3"
              variants={tabPanelMotion}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <article className="rounded-2xl border border-landing-clay bg-white/95 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-landing-espresso sm:text-lg">Today Summary</h2>
                  <span className="text-sm font-semibold text-landing-espresso-light">
                    {completionSummary.completed}/{completionSummary.total}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-landing-sand">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-landing-terracotta to-landing-sage"
                    style={{ width: `${completionSummary.percent}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-landing-espresso-light">{completionSummary.percent}% tasks completed today</p>
              </article>

              {tasks.length === 0 ? (
                <article className="rounded-2xl border border-landing-clay bg-white p-4 text-sm text-landing-espresso-light shadow-sm">
                  No scheduled partner tasks for today yet.
                </article>
              ) : null}

              {tasks.map((task) => (
                <motion.article
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-landing-clay bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-landing-espresso">{task.description}</h3>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-landing-espresso-light">
                        <Timer className="h-4 w-4" />
                        {task.scheduledTime || "No time set"}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[task.status].className}`}>
                      {statusStyles[task.status].label}
                    </span>
                  </div>

                  {task.progress ? (
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-sm text-landing-espresso-light">
                        <span>Progress</span>
                        <span>
                          {task.progress.current}/{task.progress.total} {task.progress.unit}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-landing-sand">
                        <div
                          className="h-full rounded-full bg-landing-terracotta"
                          style={{ width: `${(task.progress.current / task.progress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {task.attachments?.photos?.[0] ? (
                    <button
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                      onClick={() => setExpandedImage(task.attachments?.photos?.[0] || null)}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      View proof image
                    </button>
                  ) : null}
                </motion.article>
              ))}
            </motion.section>
          ) : null}

          {activeTab === "activity" ? (
            <motion.section
              key="tab-activity"
              className="space-y-3"
              variants={tabPanelMotion}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <article className="rounded-2xl border border-landing-clay bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-landing-espresso sm:text-base">Journal Activity</h3>
                  <button
                    type="button"
                    onClick={() => router.push("/journal")}
                    className="text-[11px] font-semibold text-landing-terracotta hover:underline"
                  >
                    Open Journal
                  </button>
                </div>
                {isPartnerJournalLoading ? (
                  <p className="text-xs text-landing-espresso-light">Loading partner journal activity...</p>
                ) : null}
                {!isPartnerJournalLoading && partnerJournalEntries.length === 0 ? (
                  <p className="text-xs text-landing-espresso-light">No shared reflections from your partner yet.</p>
                ) : null}
                <div className="space-y-2">
                  {partnerJournalEntries.map((entry: any) => (
                    <div key={entry._id} className="rounded-xl border border-landing-clay bg-landing-cream p-3">
                      <p className="text-sm font-semibold text-landing-espresso">{entry.title}</p>
                      <p className="mt-1 line-clamp-3 text-xs text-landing-espresso-light">{entry.body}</p>
                      <JournalEntryInteractions entryId={entry._id} />
                    </div>
                  ))}
                </div>
              </article>

              {activities.length === 0 ? (
                <article className="rounded-2xl border border-landing-clay bg-white p-4 text-sm text-landing-espresso-light shadow-sm">
                  No recent partner task activity yet.
                </article>
              ) : null}

              {activities.map((activity) => (
                <article key={activity.id} className="rounded-2xl border border-landing-clay bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-landing-espresso sm:text-base">{activity.summary}</h3>
                    <span className="text-xs text-landing-espresso-light">{format(activity.timestamp, "p")}</span>
                  </div>
                  <p className="mt-1 text-xs text-landing-espresso-light">{format(activity.timestamp, "MMM d, yyyy")}</p>
                  {activity.details?.notes ? (
                    <p className="mt-3 rounded-lg bg-landing-cream px-3 py-2 text-sm text-landing-espresso-light">{activity.details.notes}</p>
                  ) : null}
                  {activity.details?.photo ? (
                    <button
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                      onClick={() => setExpandedImage(activity.details?.photo || null)}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      View attachment
                    </button>
                  ) : null}
                </article>
              ))}
            </motion.section>
          ) : null}

          {activeTab === "chat" ? (
            <motion.div
              key="tab-chat"
              variants={tabPanelMotion}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <PartnerChatSurface
                mode="embedded"
                partnerId={userDetails?.partner_id ?? undefined}
                partnershipId={userDetails?.partnership_id ?? undefined}
                partnerName={resolvedPartner.username}
                partnerAvatar={resolvedPartner.profilePicture}
                partnerInitials={resolvedPartner.initials}
                isPartnerOnline={isOnline}
                partnerLastSeen={resolvedPartner.lastActive}
                onOpenFullscreen={() => setIsFullscreenOverlayOpen(true)}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {expandedImage ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4" onClick={() => setExpandedImage(null)}>
          <img
            src={expandedImage || "/placeholder.svg"}
            alt="Expanded attachment"
            className="max-h-[86vh] max-w-full rounded-xl object-contain"
          />
        </div>
      ) : null}

      {isFullscreenOverlayOpen ? (
        <div className="fixed inset-0 z-[90] bg-landing-cream">
          <PartnerChatSurface
            mode="fullscreen"
            partnerId={userDetails?.partner_id ?? undefined}
            partnershipId={userDetails?.partnership_id ?? undefined}
            partnerName={resolvedPartner.username}
            partnerAvatar={resolvedPartner.profilePicture}
            partnerInitials={resolvedPartner.initials}
            isPartnerOnline={isOnline}
            partnerLastSeen={resolvedPartner.lastActive}
            onCloseOverlay={() => setIsFullscreenOverlayOpen(false)}
          />
        </div>
      ) : null}
    </DashboardLayout>
  );
}
