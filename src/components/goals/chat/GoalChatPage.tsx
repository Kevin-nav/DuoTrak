"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, CircleDot } from "lucide-react";
import { useState } from "react";
import GoalChatComposer from "@/components/goals/chat/GoalChatComposer";
import GoalChatThread from "@/components/goals/chat/GoalChatThread";
import GoalSummaryCard from "@/components/goals/chat/GoalSummaryCard";
import PlanReviewCard from "@/components/goals/chat/PlanReviewCard";
import { useGoalChatFlow } from "@/components/goals/chat/useGoalChatFlow";

const pageInitial = { opacity: 0, y: 18 };
const pageAnimate = {
  opacity: 1,
  y: 0,
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

export default function GoalChatPage() {
  const flow = useGoalChatFlow();
  const [slotsOpen, setSlotsOpen] = useState(false);

  const missingArr = flow.missingText === "none" ? [] : flow.missingText.split(", ");

  return (
    <motion.div
      className="mx-auto max-w-3xl px-4 py-6"
      initial={pageInitial}
      animate={pageAnimate}
    >
      {/* ── Header ── */}
      <header className="mb-5 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sand">
            <Sparkles className="h-4 w-4 text-espresso" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-taupe">
            AI Goal Builder
          </p>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Let&apos;s build your next goal
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Chat naturally — I&apos;ll ask one focused question at a time, then generate a full plan for your approval.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Prefer a form?{" "}
          <Link href="/goals/new" className="font-semibold text-taupe hover:underline">
            Open classic wizard
          </Link>
        </p>
      </header>

      {/* ── Screen Toggle ── */}
      <AnimatePresence mode="wait">
        {flow.screen === "chat" ? (
          <motion.div
            key="chat-screen"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-3"
          >
            <GoalChatThread messages={flow.messages} isStreaming={flow.isStreaming} />

            <GoalChatComposer
              input={flow.input}
              setInput={flow.setInput}
              chips={flow.chips}
              isStreaming={flow.isStreaming}
              onSend={() => flow.sendMessage(flow.input)}
              onSendChip={(chip) => flow.sendMessage(chip, chip)}
              onStop={flow.stopGeneration}
              readyForSummary={flow.readyForSummary}
              onOpenSummary={flow.openSummary}
            />

            {/* ── Slot Tracker ── */}
            <div className="rounded-xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setSlotsOpen(!slotsOpen)}
                className="flex w-full items-center justify-between px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="font-medium">
                  {missingArr.length === 0
                    ? "All fields gathered ✓"
                    : `${missingArr.length} field${missingArr.length > 1 ? "s" : ""} remaining`}
                </span>
                {slotsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              <AnimatePresence>
                {slotsOpen && missingArr.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-1.5 px-3 pb-2.5">
                      {missingArr.map((slot) => (
                        <span
                          key={slot}
                          className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-xs text-espresso"
                        >
                          <CircleDot className="h-3 w-3 text-taupe" />
                          {slot}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : flow.screen === "plan" ? (
          <motion.div
            key="plan-screen"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <PlanReviewCard
              plan={flow.generatedPlan}
              isLoading={flow.isGeneratingPlan}
              onBack={() => flow.setScreen("chat")}
              onApprove={flow.approveAndCreate}
              isCreating={flow.isCreating}
            />
          </motion.div>
        ) : flow.summary ? (
          <motion.div
            key="summary-screen"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <GoalSummaryCard
              summary={flow.summary}
              onChangeField={flow.updateSummaryField}
              onChangeTask={flow.updateSummaryTask}
              onBack={() => flow.setScreen("chat")}
              onApprove={flow.approveAndCreate}
              isCreating={flow.isCreating}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
