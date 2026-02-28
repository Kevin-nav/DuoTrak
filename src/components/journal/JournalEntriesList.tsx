"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Share2, Users, Lock, Smile } from "lucide-react";
import { toast } from "sonner";
import { JournalSpaceType } from "@/hooks/useJournal";
import JournalEntryInteractions from "@/components/journal/JournalEntryInteractions";
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
}

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "UL",
  "OL",
  "LI",
  "H1",
  "H2",
  "H3",
  "DIV",
  "SPAN",
  "LABEL",
  "INPUT",
]);

const sanitizeRichBodyServer = (html: string) => {
  if (!html) return "";

  const withoutUnsafeBlocks = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  return withoutUnsafeBlocks.replace(/<(\/?)([a-z0-9-]+)([^>]*)>/gi, (_full, slash, rawTag, attrs) => {
    const tag = String(rawTag || "").toUpperCase();
    const isClosing = slash === "/";
    if (!ALLOWED_TAGS.has(tag)) {
      return "";
    }

    if (isClosing) {
      if (tag === "INPUT") return "";
      return `</${rawTag.toLowerCase()}>`;
    }

    if (tag === "INPUT") {
      const hasChecked = /\schecked(?:\s*=\s*(?:"checked"|'checked'|checked))?/i.test(String(attrs || ""));
      return hasChecked ? '<input type="checkbox" checked="checked">' : '<input type="checkbox">';
    }

    return `<${rawTag.toLowerCase()}>`;
  });
};

const sanitizeRichBody = (html: string) => {
  if (!html) return "";
  if (typeof window === "undefined") return sanitizeRichBodyServer(html);

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return "";

  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (!ALLOWED_TAGS.has(element.tagName)) {
        const parent = element.parentNode;
        while (element.firstChild) {
          parent?.insertBefore(element.firstChild, element);
        }
        parent?.removeChild(element);
        return;
      }

      Array.from(element.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (element.tagName === "INPUT") {
          if (name !== "type" && name !== "checked") {
            element.removeAttribute(attr.name);
          }
          return;
        }
        element.removeAttribute(attr.name);
      });

      if (element.tagName === "INPUT") {
        const input = element as HTMLInputElement;
        input.type = "checkbox";
      }
    }

    const children = Array.from(node.childNodes);
    children.forEach(walk);
  };

  walk(root);
  return root.innerHTML;
};

export default function JournalEntriesList({
  entries,
  activeSpaceType,
  onSharePrivateEntry,
}: JournalEntriesListProps) {
  const [sharingEntryId, setSharingEntryId] = useState<string | null>(null);

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
                <p className="mt-1 text-xs text-landing-espresso-light">
                  {format(new Date(entry.entry_date || entry.created_at), "MMM d, yyyy p")} by {entry.author_name}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-landing-clay bg-landing-cream px-2 py-1 text-[11px] font-semibold text-landing-espresso-light">
                {activeSpaceType === "shared" ? <Users className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {activeSpaceType}
              </span>
            </div>

            <div
              className="journal-entry-body mt-3 max-w-none break-words text-sm text-landing-espresso-light [&_h1]:my-1 [&_h1]:text-base [&_h1]:font-black [&_h1]:text-landing-espresso [&_h2]:my-1 [&_h2]:text-[15px] [&_h2]:font-extrabold [&_h2]:text-landing-espresso [&_h3]:my-1 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-landing-espresso [&_li]:my-0.5 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: sanitizeRichBody(entry.body || "") }}
            />

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

            {activeSpaceType === "private" ? (
              <div className="mt-3 flex justify-end">
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
