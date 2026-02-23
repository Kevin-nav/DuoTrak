"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { ArrowLeft, GripVertical, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { useJournalPage, useReplaceJournalPageBlocks } from "@/hooks/useJournal";
import { useGoals } from "@/hooks/useGoals";

type BlockInput = {
  type: "paragraph" | "heading" | "todo" | "quote" | "callout";
  content: string;
  checked?: boolean;
};

type CommandType = BlockInput["type"];

type SuggestionState = {
  kind: "command" | "mention";
  blockIndex: number;
  query: string;
  start: number;
  end: number;
} | null;

type MentionOption = {
  label: string;
  value: string;
};

const BLOCK_TYPES: CommandType[] = ["paragraph", "heading", "todo", "quote", "callout"];

export default function JournalPageEditor() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;
  const { page, blocks, isLoading } = useJournalPage(pageId);
  const replaceBlocks = useReplaceJournalPageBlocks();
  const { data: goals = [] } = useGoals();

  const [draftBlocks, setDraftBlocks] = useState<BlockInput[] | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionState>(null);

  const effectiveBlocks = useMemo<BlockInput[]>(
    () =>
      draftBlocks ??
      (blocks.length > 0
        ? blocks.map((block: any) => ({
            type: block.type,
            content: block.content || "",
            checked: block.checked || false,
          }))
        : [{ type: "paragraph", content: "" }]),
    [blocks, draftBlocks]
  );

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
    const next = [...effectiveBlocks];
    next[index] = { ...next[index], ...patch };
    setDraftBlocks(next);
  };

  const addBlock = (type: BlockInput["type"]) => {
    setDraftBlocks([...effectiveBlocks, { type, content: "", checked: false }]);
  };

  const removeBlock = (index: number) => {
    const next = effectiveBlocks.filter((_, idx) => idx !== index);
    setDraftBlocks(next.length > 0 ? next : [{ type: "paragraph", content: "" }]);
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || toIndex >= effectiveBlocks.length) return;
    const next = [...effectiveBlocks];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    setDraftBlocks(next);
  };

  const handleBlockDrop = (targetIndex: number) => {
    if (draggingIndex === null) return;
    moveBlock(draggingIndex, targetIndex);
    setDraggingIndex(null);
  };

  const deriveSuggestion = (index: number, event: ChangeEvent<HTMLTextAreaElement>) => {
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
        blockIndex: index,
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
        blockIndex: index,
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
    const block = effectiveBlocks[suggestion.blockIndex];
    const nextContent = `${block.content.slice(0, suggestion.start)}${block.content.slice(suggestion.end)}`.trimStart();
    updateBlock(suggestion.blockIndex, { type: command, content: nextContent });
    setSuggestion(null);
  };

  const applyMention = (mentionValue: string) => {
    if (!suggestion || suggestion.kind !== "mention") return;
    const block = effectiveBlocks[suggestion.blockIndex];
    const prefix = block.content.slice(0, suggestion.start);
    const suffix = block.content.slice(suggestion.end);
    const withSpacing = `${prefix}${mentionValue} ${suffix}`.replace(/\s{2,}/g, " ");
    updateBlock(suggestion.blockIndex, { content: withSpacing });
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
        blocks: effectiveBlocks.map((block) => ({
          type: block.type,
          content: block.content,
          checked: block.checked,
        })),
      });
      toast.success("Page saved.");
      setDraftBlocks(null);
    } catch (error: any) {
      toast.error(error?.message || "Could not save page.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <section className="rounded-2xl border border-landing-clay bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => router.push("/journal")}
              className="inline-flex items-center gap-1 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <h1 className="truncate text-lg font-bold text-landing-espresso">{page?.title || "Journal Page"}</h1>
            <button
              onClick={save}
              className="inline-flex items-center gap-1 rounded-lg bg-landing-espresso px-3 py-1.5 text-xs font-semibold text-landing-cream"
            >
              <Save className="h-3.5 w-3.5" />
              Save
            </button>
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-2xl border border-landing-clay bg-white p-6 text-sm text-landing-espresso-light">
            Loading page...
          </div>
        ) : (
          <section className="space-y-3 rounded-2xl border border-landing-clay bg-white p-4 shadow-sm">
            {effectiveBlocks.map((block, index) => (
              <div
                key={`block-${index}`}
                draggable
                onDragStart={() => setDraggingIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleBlockDrop(index)}
                className="rounded-xl border border-landing-clay bg-landing-cream p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-landing-clay px-1.5 py-1 text-xs text-landing-espresso-light hover:bg-white"
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
                      disabled={index === effectiveBlocks.length - 1}
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
                </div>
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
                      onBlur={() => setTimeout(() => setSuggestion((current) => (current?.blockIndex === index ? null : current)), 120)}
                      rows={2}
                      placeholder="Todo block... type / for commands or @ to mention goals/tasks"
                      className="w-full rounded-lg border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none"
                    />
                  </div>
                ) : (
                  <textarea
                    value={block.content}
                    onChange={(e) => {
                      updateBlock(index, { content: e.target.value });
                      deriveSuggestion(index, e);
                    }}
                    onBlur={() => setTimeout(() => setSuggestion((current) => (current?.blockIndex === index ? null : current)), 120)}
                    rows={block.type === "heading" ? 1 : 3}
                    placeholder={`${block.type} block... type / for commands or @ to mention goals/tasks`}
                    className="w-full rounded-lg border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none"
                  />
                )}
                {suggestion?.blockIndex === index && suggestion.kind === "command" && filteredCommands.length > 0 ? (
                  <div className="mt-2 rounded-lg border border-landing-clay bg-white p-2">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-landing-espresso-light">
                      Slash Commands
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {filteredCommands.map((command) => (
                        <button
                          key={command}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyCommand(command);
                          }}
                          className="rounded-md border border-landing-clay px-2 py-1 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                        >
                          /{command}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {suggestion?.blockIndex === index && suggestion.kind === "mention" && filteredMentions.length > 0 ? (
                  <div className="mt-2 rounded-lg border border-landing-clay bg-white p-2">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-landing-espresso-light">
                      Mentions
                    </p>
                    <div className="space-y-1">
                      {filteredMentions.map((mention) => (
                        <button
                          key={`${mention.value}-${mention.label}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyMention(mention.value);
                          }}
                          className="block w-full rounded-md border border-landing-clay px-2 py-1 text-left text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                        >
                          {mention.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              {BLOCK_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  className="inline-flex items-center gap-1 rounded-lg border border-landing-clay px-2.5 py-1.5 text-xs font-semibold text-landing-espresso-light hover:bg-landing-cream"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {type}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
