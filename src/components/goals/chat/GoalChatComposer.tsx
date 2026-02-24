"use client";

import { Button } from "@/components/ui/button";

export default function GoalChatComposer({
  input,
  setInput,
  chips,
  onSend,
  onSendChip,
  isStreaming,
  readyForSummary,
  onOpenSummary,
}: {
  input: string;
  setInput: (value: string) => void;
  chips: string[];
  onSend: () => void;
  onSendChip: (chip: string) => void;
  isStreaming: boolean;
  readyForSummary: boolean;
  onOpenSummary: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-cool-gray bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Button key={chip} type="button" variant="outline" size="sm" disabled={isStreaming} onClick={() => onSendChip(chip)}>
              {chip}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Reply naturally..."
          className="w-full rounded-xl border border-cool-gray bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />
        <Button type="button" disabled={isStreaming} onClick={onSend}>
          {isStreaming ? "..." : "Send"}
        </Button>
      </div>

      {readyForSummary ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/40">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">I have enough details. Ready to review your summary?</p>
          <Button type="button" size="sm" onClick={onOpenSummary}>
            Review Summary
          </Button>
        </div>
      ) : null}
    </div>
  );
}
