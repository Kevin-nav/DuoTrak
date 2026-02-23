"use client";

import { FormEvent, useState } from "react";
import { FileText, PlusSquare } from "lucide-react";
import { JournalSpaceType } from "@/hooks/useJournal";
import { motion, useReducedMotion } from "framer-motion";

interface JournalPagesPanelProps {
  spaceType: JournalSpaceType;
  pages: any[];
  onCreatePage: (payload: { spaceType: JournalSpaceType; title: string; icon?: string }) => Promise<any>;
  onOpenPage: (pageId: string) => void;
}

export default function JournalPagesPanel({
  spaceType,
  pages,
  onCreatePage,
  onOpenPage,
}: JournalPagesPanelProps) {
  const reduceMotion = useReducedMotion();
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
    <motion.section
      initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-landing-clay bg-white p-4 shadow-sm"
    >
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
        <motion.button
          type="submit"
          disabled={isSaving}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="inline-flex items-center gap-1 rounded-lg border border-landing-clay px-2.5 py-2 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream disabled:opacity-70"
        >
          <PlusSquare className="h-3.5 w-3.5" />
          {isSaving ? "Adding..." : "Add"}
        </motion.button>
      </form>

      {pages.length === 0 ? (
        <p className="text-sm text-landing-espresso-light">No pages yet.</p>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <motion.button
              type="button"
              key={page._id}
              onClick={() => onOpenPage(page._id)}
              whileHover={reduceMotion ? undefined : { y: -1 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
              className="rounded-lg border border-landing-clay bg-landing-cream px-3 py-2 text-sm text-landing-espresso"
            >
              {page.icon ? `${page.icon} ` : ""}
              {page.title}
            </motion.button>
          ))}
        </div>
      )}
    </motion.section>
  );
}
