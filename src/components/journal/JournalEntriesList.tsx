"use client";

import { format } from "date-fns";
import { Share2, Users, Lock } from "lucide-react";
import { JournalSpaceType } from "@/hooks/useJournal";

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
      {entries.map((entry) => (
        <article key={entry._id} className="rounded-2xl border border-landing-clay bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-landing-espresso">{entry.title}</h3>
              <p className="mt-1 text-xs text-landing-espresso-light">
                {format(new Date(entry.entry_date || entry.created_at), "MMM d, yyyy p")} by {entry.author_name}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-landing-clay bg-landing-cream px-2 py-1 text-[11px] font-semibold text-landing-espresso-light">
              {activeSpaceType === "shared" ? <Users className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {activeSpaceType}
            </span>
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm text-landing-espresso-light">{entry.body}</p>

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
        </article>
      ))}
    </div>
  );
}
