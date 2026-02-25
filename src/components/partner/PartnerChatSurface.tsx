"use client";

import { useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Expand, Minimize2, ArrowLeft } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { ChatInterface } from "@/components/chat";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface PartnerChatSurfaceProps {
  partnerId?: Id<"users">;
  partnershipId?: Id<"partnerships">;
  partnerName: string;
  partnerAvatar?: string;
  partnerInitials?: string;
  isPartnerOnline?: boolean;
  partnerLastSeen?: Date;
  mode: "embedded" | "fullscreen";
  onCloseOverlay?: () => void;
  onOpenFullscreen?: () => void;
}

export default function PartnerChatSurface({
  partnerId,
  partnershipId,
  partnerName,
  partnerAvatar,
  partnerInitials,
  isPartnerOnline = false,
  partnerLastSeen,
  mode,
  onCloseOverlay,
  onOpenFullscreen,
}: PartnerChatSurfaceProps) {
  const router = useRouter();
  const heartbeat = useMutation((api as any).chat.heartbeat);
  const partnerPresence = useQuery(
    (api as any).chat.getPartnerPresence,
    partnerId ? { partner_id: partnerId } : "skip"
  ) as { is_online: boolean; last_seen_at?: number } | undefined;

  const sendHeartbeat = useCallback(() => {
    heartbeat({}).catch((error: unknown) => {
      console.error("Failed to send presence heartbeat:", error);
    });
  }, [heartbeat]);

  useEffect(() => {
    if (!partnerId && !partnershipId) {
      return;
    }

    const pingIfVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      sendHeartbeat();
    };

    pingIfVisible();

    const intervalId = window.setInterval(pingIfVisible, 30_000);
    window.addEventListener("focus", pingIfVisible);
    window.addEventListener("online", pingIfVisible);
    document.addEventListener("visibilitychange", pingIfVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", pingIfVisible);
      window.removeEventListener("online", pingIfVisible);
      document.removeEventListener("visibilitychange", pingIfVisible);
    };
  }, [partnerId, partnershipId, sendHeartbeat]);

  const derivedIsPartnerOnline = partnerPresence?.is_online ?? isPartnerOnline;
  const derivedPartnerLastSeen = partnerPresence?.last_seen_at
    ? new Date(partnerPresence.last_seen_at)
    : partnerLastSeen;

  const statusText = useMemo(() => {
    return derivedIsPartnerOnline ? "Online now" : "Away";
  }, [derivedIsPartnerOnline]);

  if (mode === "embedded") {
    return (
      <section className="overflow-hidden rounded-2xl border border-landing-clay bg-landing-cream shadow-sm">
        <div className="flex items-center justify-between border-b border-landing-clay px-4 py-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-landing-espresso-light">Conversation</h2>
            <p className="text-xs text-landing-espresso-light">{statusText}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenFullscreen}
              className="inline-flex items-center gap-1 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
            >
              <Expand className="h-3.5 w-3.5" />
              Fullscreen Overlay
            </button>
            <button
              onClick={() => router.push("/partner/chat")}
              className="inline-flex items-center gap-1 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
            >
              <Expand className="h-3.5 w-3.5" />
              Open Chat Page
            </button>
          </div>
        </div>
        <div className="h-[calc(100dvh-18.25rem)] min-h-[420px] sm:h-[560px]">
          <ChatInterface
            partnerId={partnerId}
            partnershipId={partnershipId}
            partnerName={partnerName}
            partnerAvatar={partnerAvatar}
            partnerInitials={partnerInitials}
            isPartnerOnline={derivedIsPartnerOnline}
            partnerLastSeen={derivedPartnerLastSeen}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-[100dvh] flex-col bg-landing-cream">
      <header className="border-b border-landing-clay bg-landing-cream/95 px-3 py-3 sm:px-4">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={onCloseOverlay || (() => router.push("/partner"))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-landing-clay text-landing-espresso-light hover:bg-landing-cream"
              aria-label="Back to partner page"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="relative">
              <img
                src={partnerAvatar || "/placeholder.svg"}
                alt={partnerName}
                className="h-9 w-9 rounded-full border border-landing-clay object-cover sm:h-10 sm:w-10 bg-white"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                  derivedIsPartnerOnline ? "bg-landing-sage" : "bg-landing-espresso-light/60"
                }`}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-landing-espresso sm:text-base">{partnerName}</p>
              <p className="truncate text-xs text-landing-espresso-light">{statusText}</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            {onCloseOverlay ? (
              <button
                onClick={onCloseOverlay}
                className="inline-flex items-center gap-1 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                Exit full screen
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <ChatInterface
          partnerId={partnerId}
          partnershipId={partnershipId}
          partnerName={partnerName}
          partnerAvatar={partnerAvatar}
          partnerInitials={partnerInitials}
          isPartnerOnline={derivedIsPartnerOnline}
          partnerLastSeen={derivedPartnerLastSeen}
          showHeader={false}
          onClose={onCloseOverlay || (() => router.push("/partner"))}
        />
      </div>
    </section>
  );
}
