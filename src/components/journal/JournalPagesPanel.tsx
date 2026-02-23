"use client";

import { FormEvent, useState } from "react";
import { FileText, PlusSquare } from "lucide-react";
import { JournalSpaceType } from "@/hooks/useJournal";

interface JournalPagesPanelProps {
  spaceType: JournalSpaceType;
  pages: any[];
  onCreatePage: (payload: { spaceType: JournalSpaceType; title: string; icon?: string }) => Promise<any>;
}

export default function JournalPagesPanel({
  spaceType,
  pages,
  onCreatePage,
}: JournalPagesPanelProps) {
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await onCreatePage({ spaceType, title: title.trim() });
      setTitle("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-landing-clay bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-base font-bold text-landing-espresso">
          <FileText className="h-4 w-4" />
          Workspace Pages
        </h2>
      </div>

      <form onSubmit={onSubmit} className="mb-3 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Create a Notion-style page"
          className="flex-1 rounded-xl border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none focus:border-landing-terracotta"
        />
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-1 rounded-lg border border-landing-clay px-2.5 py-2 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream disabled:opacity-70"
        >
          <PlusSquare className="h-3.5 w-3.5" />
          {isSaving ? "Adding..." : "Add"}
        </button>
      </form>

      {pages.length === 0 ? (
        <p className="text-sm text-landing-espresso-light">No pages yet.</p>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <div
              key={page._id}
              className="rounded-lg border border-landing-clay bg-landing-cream px-3 py-2 text-sm text-landing-espresso"
            >
              {page.icon ? `${page.icon} ` : ""}
              {page.title}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
