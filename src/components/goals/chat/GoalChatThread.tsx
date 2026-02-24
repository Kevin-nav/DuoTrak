"use client";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

export default function GoalChatThread({ messages }: { messages: Message[] }) {
  return (
    <div className="h-[56vh] overflow-y-auto rounded-xl border border-cool-gray bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
              message.role === "assistant"
                ? "bg-cool-gray text-charcoal dark:bg-gray-800 dark:text-gray-100"
                : "ml-auto bg-primary-blue text-white"
            }`}
          >
            {message.text || "..."}
          </div>
        ))}
      </div>
    </div>
  );
}
