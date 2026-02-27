"use client";

import { usePartnerJournalActivity } from "@/hooks/useJournal";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageSquare, Sparkles } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function JournalDuoPulse() {
  const { entries, isLoading } = usePartnerJournalActivity(5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-landing-espresso-light" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-landing-clay p-6 text-center">
        <Sparkles className="mx-auto h-5 w-5 text-landing-espresso-light opacity-20" />
        <p className="mt-2 text-xs text-landing-espresso-light">
          No recent partner activity. Shared moments will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-black uppercase tracking-wider text-landing-espresso-light">
          Duo Pulse
        </h3>
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry._id}
            className="group relative rounded-xl border border-landing-clay bg-white p-3 transition hover:border-landing-terracotta/30"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-landing-terracotta">
                  {entry.author_name}'s Reflection
                </p>
                <h4 className="mt-0.5 truncate text-xs font-semibold text-landing-espresso">
                  {entry.title}
                </h4>
                <p className="mt-1 text-[10px] text-landing-espresso-light">
                  {formatDistanceToNow(new Date(entry.entry_date || entry.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3 border-t border-landing-clay/50 pt-2 opacity-60 group-hover:opacity-100 transition-opacity">
               <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-landing-espresso-light" />
                  <span className="text-[10px]">{entry.reaction_count || 0}</span>
               </div>
               <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3 text-landing-espresso-light" />
                  <span className="text-[10px]">{entry.comment_count || 0}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
