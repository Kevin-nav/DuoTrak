"use client";

import { format } from "date-fns";
import { Share2, Users, Lock, Smile } from "lucide-react";
import { JournalSpaceType } from "@/hooks/useJournal";
import JournalEntryInteractions from "@/components/journal/JournalEntryInteractions";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MOODS_MAP: Record<string, { emoji: string; color: string }> = {
  Happy: { emoji: "😊", color: "bg-yellow-100 border-yellow-200 text-yellow-700" },
  Grateful: { emoji: "🙏", color: "bg-emerald-100 border-emerald-200 text-emerald-700" },
  Excited: { emoji: "🤩", color: "bg-orange-100 border-orange-200 text-orange-700" },
  Peaceful: { emoji: "😌", color: "bg-blue-100 border-blue-200 text-blue-700" },
  Productive: { emoji: "💪", color: "bg-purple-100 border-purple-200 text-purple-700" },
  Tired: { emoji: "😴", color: "bg-slate-100 border-slate-200 text-slate-700" },
  Stressed: { emoji: "😫", color: "bg-rose-100 border-rose-200 text-rose-700" },
  Sad: { emoji: "😢", color: "bg-indigo-100 border-indigo-200 text-indigo-700" },
};

interface JournalEntriesListProps {
  entries: any[];
  activeSpaceType: JournalSpaceType;
  onSharePrivateEntry: (entryId: string) => Promise<any>;
}

export default function JournalEntriesList({
  entries,
  activeSpaceType,
  onSharePrivateEntry,
}: JournalEntriesListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-landing-clay bg-white p-6 text-center text-sm text-landing-espresso-light">
        No entries yet. Start your first journal note.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const moodData = entry.mood ? MOODS_MAP[entry.mood] : null;

        return (
          <article key={entry._id} className="rounded-2xl border border-landing-clay bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-bold text-landing-espresso">{entry.title}</h3>
                  {entry.mood && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                        moodData ? moodData.color : "bg-landing-cream border-landing-clay text-landing-espresso-light"
                      )}
                    >
                      {moodData ? moodData.emoji : <Smile className="h-3 w-3" />}
                      {entry.mood}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-landing-espresso-light">
                  {format(new Date(entry.entry_date || entry.created_at), "MMM d, yyyy p")} by {entry.author_name}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-landing-clay bg-landing-cream px-2 py-1 text-[11px] font-semibold text-landing-espresso-light">
                {activeSpaceType === "shared" ? <Users className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {activeSpaceType}
              </span>
            </div>

            <div className="prose prose-sm mt-3 max-w-none text-landing-espresso-light prose-headings:text-landing-espresso prose-p:my-1.5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.body || ""}</ReactMarkdown>
            </div>

            {(entry.tags || []).length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {entry.tags.map((tag: string) => (
                  <span
                    key={`${entry._id}-${tag}`}
                    className="rounded-full bg-landing-sand px-2 py-0.5 text-[11px] font-medium text-landing-espresso-light"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            {activeSpaceType === "private" ? (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => onSharePrivateEntry(entry._id)}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream sm:w-auto"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share with partner
                </button>
              </div>
            ) : null}

            {activeSpaceType === "shared" ? (
              <JournalEntryInteractions entryId={entry._id} />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
