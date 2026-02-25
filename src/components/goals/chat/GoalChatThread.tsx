"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import MarkdownMessage from "@/components/goals/chat/MarkdownMessage";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const bubbleInitial = { opacity: 0, y: 12, scale: 0.96 };
const bubbleAnimate = {
  opacity: 1,
  y: 0,
  scale: 1,
  transition: { type: "spring" as const, damping: 22, stiffness: 280 },
};

function AiTypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-2"
    >
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5 shadow-sm">
        <Sparkles className="h-3.5 w-3.5 text-taupe" />
        <div className="flex items-center gap-[3px]">
          {[0, 0.15, 0.3].map((delay) => (
            <motion.span
              key={delay}
              className="block h-[6px] w-[6px] rounded-full bg-taupe"
              animate={{ scale: [1, 1.35, 1], opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut", delay }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function GoalChatThread({
  messages,
  isStreaming = false,
}: {
  messages: Message[];
  isStreaming?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const showTyping = isStreaming && messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.text === "";

  return (
    <div className="h-[48vh] overflow-y-auto rounded-2xl border border-border bg-card p-3 max-[380px]:h-[42vh] sm:h-[56vh] sm:p-4">
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((message) => {
            // Skip the empty placeholder message while typing indicator handles it
            if (message.role === "assistant" && message.text === "" && isStreaming) return null;

            return (
              <motion.div
                key={message.id}
                initial={bubbleInitial}
                animate={bubbleAnimate}
                layout
                className={`max-w-[92%] sm:max-w-[85%] ${message.role === "user" ? "ml-auto" : ""}`}
              >
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:px-4 ${message.role === "assistant"
                    ? "rounded-bl-sm border border-border bg-card text-foreground shadow-sm"
                    : "rounded-br-sm bg-gradient-to-br from-landing-terracotta to-[#D7A88B] text-white shadow-sm"
                    }`}
                >
                  {message.role === "assistant" && (
                    <span className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-taupe sm:text-[10px]">
                      <Sparkles className="h-3 w-3" />
                      DuoTrak AI
                    </span>
                  )}
                  {message.role === "assistant" ? (
                    <MarkdownMessage content={message.text || "..."} />
                  ) : (
                    <span className="whitespace-pre-wrap">{message.text}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* AI Typing Indicator */}
        <AnimatePresence>{showTyping && <AiTypingIndicator />}</AnimatePresence>
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
