"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { ArrowLeft, GripVertical, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { useJournalPage, useReplaceJournalPageBlocks } from "@/hooks/useJournal";
import { useGoals } from "@/hooks/useGoals";
import { AnimatePresence, Reorder, motion, useReducedMotion } from "framer-motion";

type BlockInput = {
  id: string;
  type: "paragraph" | "heading" | "todo" | "quote" | "callout";
  content: string;
  checked?: boolean;
};

type CommandType = BlockInput["type"];

type SuggestionState = {
  kind: "command" | "mention";
  blockId: string;
  query: string;
  start: number;
  end: number;
} | null;

type MentionOption = {
  label: string;
  value: string;
};

const BLOCK_TYPES: CommandType[] = ["paragraph", "heading", "todo", "quote", "callout"];
const easing = [0.22, 1, 0.36, 1] as const;

const createBlock = (type: CommandType, content = "", checked = false): BlockInput => ({
  id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  type,
  content,
  checked,
});

export default function JournalPageEditor() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;
  const { page, blocks, isLoading } = useJournalPage(pageId);
  const replaceBlocks = useReplaceJournalPageBlocks();
  const { data: goals = [] } = useGoals();
  const reduceMotion = useReducedMotion();

  const [draftBlocks, setDraftBlocks] = useState<BlockInput[]>([]);
  const [hasInitializedFromServer, setHasInitializedFromServer] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestionState>(null);

  useEffect(() => {
    setHasInitializedFromServer(false);
    setDraftBlocks([]);
    setSuggestion(null);
  }, [pageId]);

  useEffect(() => {
    if (hasInitializedFromServer) return;
    if (isLoading) return;

    if (blocks.length > 0) {
      setDraftBlocks(
        blocks.map((block: any) => ({
          id:
            typeof block._id === "string"
              ? block._id
              : typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,
          type: block.type,
          content: block.content || "",
          checked: block.checked || false,
        }))
      );
    } else {
      setDraftBlocks([createBlock("paragraph")]);
    }
    setHasInitializedFromServer(true);
  }, [blocks, hasInitializedFromServer, isLoading]);

  const mentionOptions = useMemo<MentionOption[]>(() => {
    const options: MentionOption[] = [];
    for (const goal of goals) {
      options.push({
        label: `Goal: ${goal.name}`,
        value: `@goal:${goal.name}`,
      });
      for (const task of goal.tasks) {
        options.push({
          label: `Task: ${task.name}`,
          value: `@task:${task.name}`,
        });
      }
    }
    return options.slice(0, 50);
  }, [goals]);

  const updateBlock = (index: number, patch: Partial<BlockInput>) => {
    const next = [...draftBlocks];
    next[index] = { ...next[index], ...patch };
    setDraftBlocks(next);
  };

  const addBlock = (type: BlockInput["type"]) => {
    setDraftBlocks([...draftBlocks, createBlock(type)]);
  };

  const removeBlock = (index: number) => {
    const next = draftBlocks.filter((_, idx) => idx !== index);
    setDraftBlocks(next.length > 0 ? next : [createBlock("paragraph")]);
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || toIndex >= draftBlocks.length) return;
    const next = [...draftBlocks];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    setDraftBlocks(next);
  };

  const deriveSuggestion = (index: number, event: ChangeEvent<HTMLTextAreaElement>) => {
    const block = draftBlocks[index];
    if (!block) return;
    const content = event.target.value;
    const cursor = event.target.selectionStart ?? content.length;
    const beforeCursor = content.slice(0, cursor);

    const slashMatch = /(?:^|\s)\/([a-z]*)$/.exec(beforeCursor);
    if (slashMatch) {
      const query = slashMatch[1] || "";
      const end = cursor;
      const start = end - query.length - 1;
      setSuggestion({
        kind: "command",
        blockId: block.id,
        query,
        start,
        end,
      });
      return;
    }

    const mentionMatch = /(?:^|\s)@([a-zA-Z0-9:_-]*)$/.exec(beforeCursor);
    if (mentionMatch) {
      const query = mentionMatch[1] || "";
      const end = cursor;
      const start = end - query.length - 1;
      setSuggestion({
        kind: "mention",
        blockId: block.id,
        query,
        start,
        end,
      });
      return;
    }

    setSuggestion(null);
  };

  const applyCommand = (command: CommandType) => {
    if (!suggestion || suggestion.kind !== "command") return;
    const blockIndex = draftBlocks.findIndex((block) => block.id === suggestion.blockId);
    if (blockIndex < 0) return;
    const block = draftBlocks[blockIndex];
    const nextContent = `${block.content.slice(0, suggestion.start)}${block.content.slice(suggestion.end)}`.trimStart();
    updateBlock(blockIndex, { type: command, content: nextContent });
    setSuggestion(null);
  };

  const applyMention = (mentionValue: string) => {
    if (!suggestion || suggestion.kind !== "mention") return;
    const blockIndex = draftBlocks.findIndex((block) => block.id === suggestion.blockId);
    if (blockIndex < 0) return;
    const block = draftBlocks[blockIndex];
    const prefix = block.content.slice(0, suggestion.start);
    const suffix = block.content.slice(suggestion.end);
    const withSpacing = `${prefix}${mentionValue} ${suffix}`.replace(/\s{2,}/g, " ");
    updateBlock(blockIndex, { content: withSpacing });
    setSuggestion(null);
  };

  const filteredCommands = useMemo(
    () =>
      BLOCK_TYPES.filter((type) => type.toLowerCase().includes((suggestion?.query || "").toLowerCase())).slice(0, 6),
    [suggestion?.query]
  );

  const filteredMentions = useMemo(
    () =>
      mentionOptions
        .filter((option) => option.label.toLowerCase().includes((suggestion?.query || "").toLowerCase()))
        .slice(0, 8),
    [mentionOptions, suggestion?.query]
  );

  const save = async () => {
    try {
      await replaceBlocks({
        pageId,
        blocks: draftBlocks.map((block) => ({
          type: block.type,
          content: block.content,
          checked: block.checked,
        })),
      });
      toast.success("Page saved.");
    } catch (error: any) {
      toast.error(error?.message || "Could not save page.");
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: easing }}
        className="space-y-4"
      >
        <motion.section
          initial={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: easing }}
          className="sticky top-20 z-20 rounded-2xl border border-landing-clay bg-white/95 p-4 shadow-sm backdrop-blur-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <motion.button
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => router.push("/journal")}
              className="inline-flex items-center gap-1 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </motion.button>
            <h1 className="truncate text-lg font-bold text-landing-espresso">{page?.title || "Journal Page"}</h1>
            <motion.button
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={save}
              className="inline-flex items-center gap-1 rounded-lg bg-landing-espresso px-3 py-1.5 text-xs font-semibold text-landing-cream"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </motion.button>
          </div>
        </motion.section>

        {isLoading ? (
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            className="rounded-2xl border border-landing-clay bg-white p-6 text-sm text-landing-espresso-light"
          >
            Loading page...
          </motion.div>
        ) : (
          <motion.section
            initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: easing }}
            className="space-y-3 rounded-2xl border border-landing-clay bg-white p-4 shadow-sm"
          >
            <Reorder.Group axis="y" values={draftBlocks} onReorder={setDraftBlocks} className="space-y-3">
              {draftBlocks.map((block, index) => (
                <Reorder.Item
                  key={block.id}
                  value={block}
                  transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                  className="rounded-xl border border-landing-clay bg-landing-cream p-3"
                  whileDrag={reduceMotion ? undefined : { scale: 1.01, boxShadow: "0 14px 30px rgba(0,0,0,0.12)" }}
                  layout
                >
                  <motion.div layout className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-landing-clay px-1.5 py-1 text-xs text-landing-espresso-light hover:bg-white touch-none"
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </button>
                      <select
                        value={block.type}
                        onChange={(e) => updateBlock(index, { type: e.target.value as BlockInput["type"] })}
                        className="rounded-md border border-landing-clay px-2 py-1 text-xs text-landing-espresso"
                      >
                        <option value="paragraph">Paragraph</option>
                        <option value="heading">Heading</option>
                        <option value="todo">Todo</option>
                        <option value="quote">Quote</option>
                        <option value="callout">Callout</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveBlock(index, index - 1)}
                        disabled={index === 0}
                        className="rounded-md border border-landing-clay px-2 py-1 text-xs text-landing-espresso-light hover:bg-white disabled:opacity-50"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlock(index, index + 1)}
                        disabled={index === draftBlocks.length - 1}
                        className="rounded-md border border-landing-clay px-2 py-1 text-xs text-landing-espresso-light hover:bg-white disabled:opacity-50"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBlock(index)}
                        className="rounded-md border border-landing-clay px-2 py-1 text-xs text-landing-espresso-light hover:bg-white"
                      >
                        Remove
                      </button>
                    </div>
                  </motion.div>
                  {block.type === "todo" ? (
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={!!block.checked}
                        onChange={(e) => updateBlock(index, { checked: e.target.checked })}
                        className="mt-1"
                      />
                      <textarea
                        value={block.content}
                        onChange={(e) => {
                          updateBlock(index, { content: e.target.value });
                          deriveSuggestion(index, e);
                        }}
                        onBlur={() =>
                          setTimeout(() => setSuggestion((current) => (current?.blockId === block.id ? null : current)), 120)
                        }
                        rows={2}
                        placeholder="Todo block... type / for commands or @ to mention goals/tasks"
                        className="w-full rounded-lg border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none transition-all duration-200 focus:border-landing-terracotta focus:ring-2 focus:ring-landing-terracotta/20"
                      />
                    </div>
                  ) : (
                    <textarea
                      value={block.content}
                      onChange={(e) => {
                        updateBlock(index, { content: e.target.value });
                        deriveSuggestion(index, e);
                      }}
                      onBlur={() =>
                        setTimeout(() => setSuggestion((current) => (current?.blockId === block.id ? null : current)), 120)
                      }
                      rows={block.type === "heading" ? 1 : 3}
                      placeholder={`${block.type} block... type / for commands or @ to mention goals/tasks`}
                      className="w-full rounded-lg border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none transition-all duration-200 focus:border-landing-terracotta focus:ring-2 focus:ring-landing-terracotta/20"
                    />
                  )}
                  <AnimatePresence>
                    {suggestion?.blockId === block.id && suggestion.kind === "command" && filteredCommands.length > 0 ? (
                      <motion.div
                        initial={reduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
                        animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: easing }}
                        className="mt-2 rounded-lg border border-landing-clay bg-white p-2"
                      >
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-landing-espresso-light">
                          Slash Commands
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {filteredCommands.map((command) => (
                            <motion.button
                              key={command}
                              type="button"
                              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applyCommand(command);
                              }}
                              className="rounded-md border border-landing-clay px-2 py-1 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                            >
                              /{command}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                    {suggestion?.blockId === block.id && suggestion.kind === "mention" && filteredMentions.length > 0 ? (
                      <motion.div
                        initial={reduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
                        animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: 4, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: easing }}
                        className="mt-2 rounded-lg border border-landing-clay bg-white p-2"
                      >
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-landing-espresso-light">
                          Mentions
                        </p>
                        <div className="space-y-1">
                          {filteredMentions.map((mention) => (
                            <motion.button
                              key={`${mention.value}-${mention.label}`}
                              type="button"
                              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                applyMention(mention.value);
                              }}
                              className="block w-full rounded-md border border-landing-clay px-2 py-1 text-left text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                            >
                              {mention.label}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            <motion.div layout className="flex flex-wrap gap-2">
              {BLOCK_TYPES.map((type) => (
                <motion.button
                  key={type}
                  type="button"
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  onClick={() => addBlock(type)}
                  className="inline-flex items-center gap-1 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {type}
                </motion.button>
              ))}
            </motion.div>
          </motion.section>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
