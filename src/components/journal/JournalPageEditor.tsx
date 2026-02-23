"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { useJournalPage, useReplaceJournalPageBlocks } from "@/hooks/useJournal";

type BlockInput = {
  type: "paragraph" | "heading" | "todo" | "quote" | "callout";
  content: string;
  checked?: boolean;
};

export default function JournalPageEditor() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;
  const { page, blocks, isLoading } = useJournalPage(pageId);
  const replaceBlocks = useReplaceJournalPageBlocks();

  const [draftBlocks, setDraftBlocks] = useState<BlockInput[] | null>(null);

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
              <div key={`block-${index}`} className="rounded-xl border border-landing-clay bg-landing-cream p-3">
                <div className="mb-2 flex items-center justify-between">
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
                  <button
                    onClick={() => removeBlock(index)}
                    className="rounded-md border border-landing-clay px-2 py-1 text-xs text-landing-espresso-light hover:bg-white"
                  >
                    Remove
                  </button>
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
                      onChange={(e) => updateBlock(index, { content: e.target.value })}
                      rows={2}
                      placeholder="Todo block..."
                      className="w-full rounded-lg border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none"
                    />
                  </div>
                ) : (
                  <textarea
                    value={block.content}
                    onChange={(e) => updateBlock(index, { content: e.target.value })}
                    rows={block.type === "heading" ? 1 : 3}
                    placeholder={`${block.type} block...`}
                    className="w-full rounded-lg border border-landing-clay px-3 py-2 text-sm text-landing-espresso outline-none"
                  />
                )}
              </div>
            ))}

            <div className="flex flex-wrap gap-2">
              {(["paragraph", "heading", "todo", "quote", "callout"] as const).map((type) => (
                <button
                  key={type}
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
