"use client";

import Link from "next/link";
import GoalChatComposer from "@/components/goals/chat/GoalChatComposer";
import GoalChatThread from "@/components/goals/chat/GoalChatThread";
import GoalSummaryCard from "@/components/goals/chat/GoalSummaryCard";
import { useGoalChatFlow } from "@/components/goals/chat/useGoalChatFlow";

export default function GoalChatPage() {
  const flow = useGoalChatFlow();

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-5 rounded-2xl border border-cool-gray bg-gradient-to-r from-sky-50 via-white to-teal-50 p-5 dark:border-gray-700 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Goal Creation v2</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-charcoal dark:text-gray-100">Conversational Goal Builder</h1>
        <p className="mt-2 text-sm text-stone-gray dark:text-gray-300">Chat naturally. I’ll ask one focused question at a time, then summarize everything for approval.</p>
        <p className="mt-2 text-xs text-stone-gray dark:text-gray-400">
          Need fallback?{" "}
          <Link href="/goals/new" className="font-semibold text-primary-blue hover:underline">
            Open classic wizard
          </Link>
        </p>
      </header>

      {flow.screen === "chat" ? (
        <div className="space-y-4">
          <GoalChatThread messages={flow.messages} />
          <GoalChatComposer
            input={flow.input}
            setInput={flow.setInput}
            chips={flow.chips}
            isStreaming={flow.isStreaming}
            onSend={() => flow.sendMessage(flow.input)}
            onSendChip={(chip) => flow.sendMessage(chip, chip)}
            readyForSummary={flow.readyForSummary}
            onOpenSummary={flow.openSummary}
          />
          <div className="rounded-xl border border-cool-gray bg-white px-3 py-2 text-xs text-stone-gray dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            Missing fields tracked silently: {flow.missingText}
          </div>
        </div>
      ) : flow.summary ? (
        <GoalSummaryCard
          summary={flow.summary}
          onChangeField={flow.updateSummaryField}
          onChangeTask={flow.updateSummaryTask}
          onBack={() => flow.setScreen("chat")}
          onApprove={flow.approveAndCreate}
          isCreating={flow.isCreating}
        />
      ) : null}
    </div>
  );
}
