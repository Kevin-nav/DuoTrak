"use client";

import { FormEvent, useRef, useState } from "react";
import { 
  Plus, 
  Save, 
  Smile, 
  Target, 
  Bold, 
  Italic, 
  List, 
  Heading2, 
  Type 
} from "lucide-react";
import { JournalSpaceType } from "@/hooks/useJournal";
import { useGoals } from "@/hooks/useGoals";
import { motion, useReducedMotion } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import InlineMarkdownEditor from "@/components/journal/InlineMarkdownEditor";
import { cn } from "@/lib/utils";

const MOODS = [
  { label: "Happy", emoji: "😊", color: "bg-yellow-100 border-yellow-200 text-yellow-700" },
  { label: "Grateful", emoji: "🙏", color: "bg-emerald-100 border-emerald-200 text-emerald-700" },
  { label: "Excited", emoji: "🤩", color: "bg-orange-100 border-orange-200 text-orange-700" },
  { label: "Peaceful", emoji: "😌", color: "bg-blue-100 border-blue-200 text-blue-700" },
  { label: "Productive", emoji: "💪", color: "bg-purple-100 border-purple-200 text-purple-700" },
  { label: "Tired", emoji: "😴", color: "bg-slate-100 border-slate-200 text-slate-700" },
  { label: "Stressed", emoji: "😫", color: "bg-rose-100 border-rose-200 text-rose-700" },
  { label: "Sad", emoji: "😢", color: "bg-indigo-100 border-indigo-200 text-indigo-700" },
];

interface JournalComposerProps {
  spaceType: JournalSpaceType;
  onCreate: (payload: {
    spaceType: JournalSpaceType;
    title: string;
    body: string;
    mood?: string;
    tags?: string[];
    goal_id?: string;
  }) => Promise<any>;
}

export default function JournalComposer({ spaceType, onCreate }: JournalComposerProps) {
  const reduceMotion = useReducedMotion();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState("");
  const [goalId, setGoalId] = useState<string | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const { data: goals } = useGoals();
  const activeGoals = goals?.filter(g => !g.isArchived) || [];

  const selectedMood = MOODS.find((m) => m.label === mood);

  const applyAndPreserveSelection = (
    transform: (value: string, start: number, end: number) => { value: string; start: number; end: number }
  ) => {
    const textarea = bodyRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const next = transform(body, start, end);
    setBody(next.value);

    requestAnimationFrame(() => {
      const current = bodyRef.current;
      if (!current) return;
      current.focus();
      current.setSelectionRange(next.start, next.end);
    });
  };

  const wrapSelection = (prefix: string, suffix: string, placeholder: string) => {
    applyAndPreserveSelection((value, start, end) => {
      const selected = value.slice(start, end);
      const hasSelection = selected.length > 0;
      const text = hasSelection ? selected : placeholder;
      const replacement = `${prefix}${text}${suffix}`;
      const nextValue = `${value.slice(0, start)}${replacement}${value.slice(end)}`;
      const nextStart = start + prefix.length;
      const nextEnd = nextStart + text.length;
      return { value: nextValue, start: nextStart, end: nextEnd };
    });
  };

  const toggleLinePrefix = (prefix: string) => {
    applyAndPreserveSelection((value, start, end) => {
      const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const nextBreak = value.indexOf("\n", end);
      const lineEnd = nextBreak === -1 ? value.length : nextBreak;
      const line = value.slice(lineStart, lineEnd);
      const hasPrefix = line.startsWith(prefix);
      const stripped = hasPrefix ? line.slice(prefix.length) : line;
      const replaced = hasPrefix ? stripped : `${prefix}${line}`;
      const nextValue = `${value.slice(0, lineStart)}${replaced}${value.slice(lineEnd)}`;
      const delta = hasPrefix ? -prefix.length : prefix.length;
      const nextStart = Math.max(lineStart, start + delta);
      const nextEnd = Math.max(lineStart, end + delta);
      return { value: nextValue, start: nextStart, end: nextEnd };
    });
  };

  const clearLineFormatting = () => {
    applyAndPreserveSelection((value, start, end) => {
      const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const nextBreak = value.indexOf("\n", end);
      const lineEnd = nextBreak === -1 ? value.length : nextBreak;
      const line = value.slice(lineStart, lineEnd);
      const prefixMatch = /^(#{1,6}\s+|[-*]\s+|>\s+|\[(?: |x|X)\]\s+)/.exec(line);
      if (!prefixMatch) return { value, start, end };
      const removed = prefixMatch[0];
      const nextLine = line.slice(removed.length);
      const nextValue = `${value.slice(0, lineStart)}${nextLine}${value.slice(lineEnd)}`;
      const nextStart = Math.max(lineStart, start - removed.length);
      const nextEnd = Math.max(lineStart, end - removed.length);
      return { value: nextValue, start: nextStart, end: nextEnd };
    });
  };

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
        goal_id: goalId,
      });
      setTitle("");
      setBody("");
      setMood("");
      setTags("");
      setGoalId(undefined);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-landing-clay bg-white p-3 shadow-sm sm:p-4"
    >
      <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <h2 className="text-base font-bold text-landing-espresso">
          <span className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New {spaceType === "shared" ? "Shared" : "Private"} Entry
          </span>
        </h2>
        
        {/* Goal Selector */}
        <div className="flex items-center gap-2">
          <Target className="h-3.5 w-3.5 text-landing-espresso-light" />
          <Select value={goalId || "none"} onValueChange={(v) => setGoalId(v === "none" ? undefined : v)}>
            <SelectTrigger className="h-8 w-[180px] rounded-lg border-landing-clay bg-landing-cream/30 text-[11px] font-semibold text-landing-espresso-light">
              <SelectValue placeholder="Link to a goal..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">No goal linked</SelectItem>
              {activeGoals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id} className="text-xs">
                  {goal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your entry a title..."
          className="w-full bg-transparent text-lg font-black tracking-tight text-landing-espresso placeholder:text-landing-espresso-light/30 outline-none"
        />

        {/* Markdown Toolbar */}
        <div className="flex items-center gap-1 border-b border-t border-landing-clay/30 py-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearLineFormatting}
            className="h-7 w-7 text-landing-espresso-light hover:bg-landing-cream"
            title="Clear line markdown formatting"
          >
            <Type className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => toggleLinePrefix("## ")}
            className="h-7 w-7 text-landing-espresso-light hover:bg-landing-cream"
            title="Toggle heading"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </Button>
          <div className="mx-1 h-4 w-px bg-landing-clay/30" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => wrapSelection("**", "**", "bold text")}
            className="h-7 w-7 text-landing-espresso-light hover:bg-landing-cream"
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => wrapSelection("*", "*", "italic text")}
            className="h-7 w-7 text-landing-espresso-light hover:bg-landing-cream"
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => toggleLinePrefix("- ")}
            className="h-7 w-7 text-landing-espresso-light hover:bg-landing-cream"
            title="Toggle list item"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
          <div className="ml-auto flex items-center gap-1">
             <p className="text-[10px] font-bold text-landing-espresso-light/40 italic mr-2">Markdown supported</p>
          </div>
        </div>

        <InlineMarkdownEditor
          value={body}
          onChange={setBody}
          placeholder="How was your day? What did you learn together?"
          textareaRef={bodyRef}
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-2 rounded-xl border-landing-clay px-3 py-2 font-normal",
                    selectedMood && selectedMood.color
                  )}
                >
                  {selectedMood ? (
                    <>
                      <span>{selectedMood.emoji}</span>
                      <span>{selectedMood.label}</span>
                    </>
                  ) : (
                    <>
                      <Smile className="h-4 w-4" />
                      <span>How are you feeling?</span>
                    </>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-2" align="start">
                <div className="grid grid-cols-2 gap-1">
                  {MOODS.map((m) => (
                    <button
                      key={m.label}
                      type="button"
                      onClick={() => setMood(m.label)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg p-2 text-xs transition hover:bg-landing-cream",
                        mood === m.label ? "bg-landing-cream font-bold" : ""
                      )}
                    >
                      <span>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMood("")}
                    className="col-span-2 mt-1 rounded-lg border border-dashed border-landing-clay py-1 text-[10px] text-landing-espresso-light hover:bg-landing-cream"
                  >
                    Clear Mood
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add tags (focus, travel, health...)"
            className="w-full rounded-xl border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none focus:border-landing-terracotta"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <motion.button
          type="submit"
          disabled={isSaving}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-landing-espresso px-4 py-2.5 text-sm font-black text-landing-cream shadow-lg shadow-landing-espresso/20 transition hover:bg-landing-espresso-light disabled:opacity-70 sm:w-auto"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving Entry..." : "Save Journal Entry"}
        </motion.button>
      </div>
    </motion.form>
  );
}
