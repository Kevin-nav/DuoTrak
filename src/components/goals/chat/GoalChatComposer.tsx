"use client";

import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="space-y-2.5 rounded-2xl border border-border bg-card p-3">
      {/* ── Chip Suggestions ── */}
      <AnimatePresence>
        {chips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 pb-1">
              {chips.map((chip, i) => (
                <motion.button
                  key={chip}
                  type="button"
                  disabled={isStreaming}
                  onClick={() => onSendChip(chip)}
                  initial={{ opacity: 0, scale: 0.9, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="rounded-full border border-border bg-sand px-3 py-1.5 text-xs font-medium text-espresso transition-colors hover:bg-stone disabled:opacity-50"
                >
                  {chip}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Row ── */}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            handleResize();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type your reply..."
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-taupe/40 transition-shadow"
          style={{ maxHeight: 120 }}
        />
        <motion.button
          type="button"
          disabled={isStreaming || !input.trim()}
          onClick={onSend}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-landing-terracotta text-white shadow-sm transition-colors hover:bg-landing-terracotta/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </motion.button>
      </div>

      {/* ── Ready for Summary Banner ── */}
      <AnimatePresence>
        {readyForSummary && (
          <motion.div
            initial={{ opacity: 0, y: 6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 6, height: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between rounded-xl border border-landing-sage/30 bg-landing-sage/10 px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-landing-sage" />
                <p className="text-xs font-medium text-landing-sage">
                  I have everything I need. Ready to review?
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={onOpenSummary}
                className="bg-landing-sage text-white hover:bg-landing-sage/90"
              >
                Review Summary
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
