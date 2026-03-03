"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, Loader2, Lock, Pencil, Share2, Smile, Users, X } from "lucide-react";
import { toast } from "sonner";
import { JournalSpaceType } from "@/hooks/useJournal";
import InlineMarkdownEditor from "@/components/journal/InlineMarkdownEditor";
import JournalEntryInteractions from "@/components/journal/JournalEntryInteractions";
import JournalRichText from "@/components/journal/JournalRichText";
import { cn } from "@/lib/utils";

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
  onUpdateEntry: (payload: { entryId: string; title?: string; body?: string }) => Promise<any>;
}

export default function JournalEntriesList({
  entries,
  activeSpaceType,
  onSharePrivateEntry,
  onUpdateEntry,
}: JournalEntriesListProps) {
  const [sharingEntryId, setSharingEntryId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);

  const hasMeaningfulBodyContent = (html: string) => {
    const normalized = html
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/<[^>]*>/g, "")
      .trim();
    return normalized.length > 0;
  };

  const handleShareClick = async (entryId: string) => {
    if (sharingEntryId === entryId) return;
    try {
      setSharingEntryId(entryId);
      await onSharePrivateEntry(entryId);
    } catch (error: any) {
      toast.error(error?.message || "Could not share entry.");
    } finally {
      setSharingEntryId(null);
    }
  };

  const startEditing = (entry: any) => {
    setEditingEntryId(entry._id);
    setDraftTitle(entry.title || "");
    setDraftBody(entry.body || "");
  };

  const cancelEditing = () => {
    setEditingEntryId(null);
    setDraftTitle("");
    setDraftBody("");
  };

  const handleSaveEdit = async (entry: any) => {
    const normalizedTitle = draftTitle.trim() || "Untitled Entry";
    const hasBody = hasMeaningfulBodyContent(draftBody);
    if (!draftTitle.trim() && !hasBody) {
      toast.error("Entry cannot be empty.");
      return;
    }

    const originalTitle = (entry.title || "").trim() || "Untitled Entry";
    const originalBody = entry.body || "";
    const hasChanges = normalizedTitle !== originalTitle || draftBody !== originalBody;
    if (!hasChanges) {
      cancelEditing();
      return;
    }

    try {
      setSavingEntryId(entry._id);
      await onUpdateEntry({
        entryId: entry._id,
        title: normalizedTitle,
        body: draftBody,
      });
      toast.success("Entry updated.");
      cancelEditing();
    } catch (error: any) {
      toast.error(error?.message || "Could not update entry.");
    } finally {
      setSavingEntryId(null);
    }
  };

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
        const isEditing = editingEntryId === entry._id;
        const isSaving = savingEntryId === entry._id;
        const isEdited = Number(entry.updated_at || 0) > Number(entry.created_at || 0) + 1000;

        return (
          <article key={entry._id} className="min-w-0 rounded-2xl border border-landing-clay bg-white p-3 shadow-sm sm:p-4">
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
              <div className="min-w-0">
                <div className="flex min-w-0 items-start gap-2">
                  <h3 className="line-clamp-2 break-words text-base font-bold leading-tight text-landing-espresso">
                    {entry.title}
                  </h3>
                  {entry.mood && (
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                        moodData ? moodData.color : "bg-landing-cream border-landing-clay text-landing-espresso-light"
                      )}
                    >
                      {moodData ? moodData.emoji : <Smile className="h-3 w-3" />}
                      {entry.mood}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-landing-espresso-light">
                  <span>{format(new Date(entry.entry_date || entry.created_at), "MMM d, yyyy p")}</span>
                  <span>by {entry.author_name}</span>
                  {isEdited ? (
                    <span className="rounded-full border border-landing-clay bg-landing-cream px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-landing-espresso-light">
                      Edited
                    </span>
                  ) : null}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-landing-clay bg-landing-cream px-2 py-1 text-[11px] font-semibold text-landing-espresso-light">
                {activeSpaceType === "shared" ? <Users className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {activeSpaceType}
              </span>
            </div>

            {isEditing ? (
              <div className="mt-3 space-y-3">
                <input
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  placeholder="Entry title"
                  className="w-full rounded-lg border border-landing-clay px-3 py-2 text-sm font-semibold text-landing-espresso outline-none focus:border-landing-terracotta"
                />
                <InlineMarkdownEditor
                  value={draftBody}
                  onChange={setDraftBody}
                  placeholder="Update your reflection..."
                  minHeightClass="min-h-[180px]"
                />
              </div>
            ) : (
              <JournalRichText html={entry.body || ""} className="mt-3" />
            )}

            {(entry.tags || []).length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {entry.tags.map((tag: string) => (
                  <span
                    key={`${entry._id}-${tag}`}
                    className="inline-flex max-w-full break-all rounded-full bg-landing-sand px-2 py-0.5 text-[11px] font-medium text-landing-espresso-light"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap justify-end gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSaving}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream disabled:opacity-60 sm:w-auto"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleSaveEdit(entry);
                    }}
                    disabled={isSaving}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-landing-espresso px-2.5 py-1.5 text-xs font-semibold text-landing-cream hover:bg-landing-espresso-light disabled:opacity-60 sm:w-auto"
                  >
                    {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => startEditing(entry)}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream disabled:opacity-60 sm:w-auto"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit entry
                </button>
              )}

              {activeSpaceType === "private" && !isEditing ? (
                <button
                  onClick={() => {
                    void handleShareClick(entry._id);
                  }}
                  disabled={sharingEntryId === entry._id}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream disabled:opacity-60 sm:w-auto"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {sharingEntryId === entry._id ? "Sharing..." : "Share with partner"}
                </button>
              ) : null}
            </div>

            {activeSpaceType === "shared" ? (
              <JournalEntryInteractions entryId={entry._id} />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
