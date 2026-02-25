"use client";

import { FormEvent, useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import {
  useAddJournalComment,
  useAddJournalReaction,
  useJournalEntryInteractions,
  useRemoveJournalReaction,
} from "@/hooks/useJournal";

const REACTIONS = [
  { key: "support", label: "Support" },
  { key: "proud", label: "Proud" },
  { key: "inspired", label: "Inspired" },
  { key: "lets-go", label: "Lets go" },
];

interface JournalEntryInteractionsProps {
  entryId: string;
}

export default function JournalEntryInteractions({ entryId }: JournalEntryInteractionsProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { interactions, isLoading } = useJournalEntryInteractions(entryId);
  const addReaction = useAddJournalReaction();
  const removeReaction = useRemoveJournalReaction();
  const addComment = useAddJournalComment();

  const reactionSummary = useMemo(() => {
    const map = new Map<string, { count: number; mine: boolean }>();
    for (const interaction of interactions) {
      if (interaction.type !== "reaction" || !interaction.reaction_key) continue;
      const current = map.get(interaction.reaction_key) ?? { count: 0, mine: false };
      current.count += 1;
      if (interaction.is_mine) current.mine = true;
      map.set(interaction.reaction_key, current);
    }
    return map;
  }, [interactions]);

  const recentComments = useMemo(
    () => interactions.filter((item: any) => item.type === "comment").slice(0, 3),
    [interactions]
  );

  const onSubmitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setIsSubmitting(true);
    try {
      await addComment(entryId, comment.trim());
      setComment("");
      toast.success("Comment added.");
    } catch (error: any) {
      toast.error(error?.message || "Could not add comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-landing-clay bg-landing-cream/70 p-2.5">
      <div className="flex flex-wrap gap-1.5">
        {REACTIONS.map((reaction) => {
          const stats = reactionSummary.get(reaction.key);
          const isActive = !!stats?.mine;
          return (
            <button
              key={reaction.key}
              type="button"
              onClick={async () => {
                try {
                  if (isActive) {
                    await removeReaction(entryId, reaction.key);
                  } else {
                    await addReaction(entryId, reaction.key);
                  }
                } catch (error: any) {
                  toast.error(error?.message || "Could not update reaction.");
                }
              }}
              className={`rounded-full border px-2 py-1 text-[11px] font-semibold transition ${
                isActive
                  ? "border-landing-espresso bg-landing-espresso text-landing-cream"
                  : "border-landing-clay bg-white text-landing-espresso-light hover:bg-landing-sand"
              }`}
            >
              {reaction.label}
              {stats?.count ? ` (${stats.count})` : ""}
            </button>
          );
        })}
      </div>

      <form onSubmit={onSubmitComment} className="flex gap-1.5">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a quick comment"
          maxLength={280}
          className="w-full rounded-lg border border-landing-clay bg-white px-2.5 py-1.5 text-xs text-landing-espresso outline-none focus:border-landing-terracotta"
        />
        <button
          type="submit"
          disabled={isSubmitting || !comment.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-landing-espresso px-2.5 py-1.5 text-xs font-semibold text-landing-cream disabled:opacity-60"
        >
          <Send className="h-3 w-3" />
          Send
        </button>
      </form>

      <div className="space-y-1">
        {isLoading ? (
          <p className="text-[11px] text-landing-espresso-light">Loading interactions...</p>
        ) : null}
        {!isLoading && recentComments.length === 0 ? (
          <p className="inline-flex items-center gap-1 text-[11px] text-landing-espresso-light">
            <MessageCircle className="h-3 w-3" />
            No comments yet.
          </p>
        ) : null}
        {recentComments.map((item: any) => (
          <div key={item._id} className="rounded-lg border border-landing-clay bg-white px-2 py-1.5">
            <p className="text-[11px] font-semibold text-landing-espresso">{item.author_name}</p>
            <p className="text-xs text-landing-espresso-light">{item.comment_text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
