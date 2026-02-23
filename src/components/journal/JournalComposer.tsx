"use client";

import { FormEvent, useState } from "react";
import { Plus, Save } from "lucide-react";
import { JournalSpaceType } from "@/hooks/useJournal";

interface JournalComposerProps {
  spaceType: JournalSpaceType;
  onCreate: (payload: {
    spaceType: JournalSpaceType;
    title: string;
    body: string;
    mood?: string;
    tags?: string[];
  }) => Promise<any>;
}

export default function JournalComposer({ spaceType, onCreate }: JournalComposerProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() && !body.trim()) return;

    setIsSaving(true);
    try {
      await onCreate({
        spaceType,
        title: title.trim() || "Untitled Entry",
        body,
        mood: mood.trim() || undefined,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setTitle("");
      setBody("");
      setMood("");
      setTags("");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-landing-clay bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-landing-espresso">
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New {spaceType === "shared" ? "Shared" : "Private"} Entry
          </span>
        </h2>
      </div>

      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title"
          className="w-full rounded-xl border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none focus:border-landing-terracotta"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Write your journal entry..."
          className="w-full rounded-xl border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none focus:border-landing-terracotta"
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="Mood (optional)"
            className="w-full rounded-xl border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none focus:border-landing-terracotta"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="w-full rounded-xl border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none focus:border-landing-terracotta"
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-landing-espresso px-3 py-2 text-sm font-semibold text-landing-cream disabled:opacity-70"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Entry"}
        </button>
      </div>
    </form>
  );
}
