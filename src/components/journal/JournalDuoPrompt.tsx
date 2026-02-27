"use client";

import { useActiveDuoPrompt, useRevealDuoPrompt } from "@/hooks/useJournal";
import { Button } from "@/components/ui/button";
import { Sparkles, Eye, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function JournalDuoPrompt() {
  const { prompt, isLoading } = useActiveDuoPrompt();
  const reveal = useRevealDuoPrompt();

  if (isLoading) return null;
  if (!prompt) return null;

  const isRevealed = prompt.is_user1 ? prompt.revealed_for_user1 : prompt.revealed_for_user2;
  const partnerRevealed = prompt.is_user1 ? prompt.revealed_for_user2 : prompt.revealed_for_user1;
  const bothRevealed = prompt.revealed_for_user1 && prompt.revealed_for_user2;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-landing-terracotta/20 bg-gradient-to-br from-landing-cream to-white p-4 shadow-sm sm:p-5"
    >
      <div className="absolute -right-4 -top-4 opacity-10">
        <Sparkles className="h-24 w-24 text-landing-terracotta" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-landing-terracotta/10 text-landing-terracotta">
          <Sparkles className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest text-landing-espresso">
          Duo Prompt of the Day
        </h3>
      </div>

      <AnimatePresence mode="wait">
        {!isRevealed ? (
          <motion.div
            key="hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-4 text-center"
          >
            <p className="mb-4 text-xs font-medium text-landing-espresso-light">
              Your daily reflection is waiting. Reveal it to start collaborating.
            </p>
            <Button
              onClick={() => reveal(prompt._id)}
              className="bg-landing-terracotta hover:bg-landing-terracotta-dark text-white rounded-xl gap-2 shadow-md shadow-landing-terracotta/20"
            >
              <Eye className="h-4 w-4" />
              Reveal Daily Prompt
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="revealed"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <p className="text-base font-bold italic leading-relaxed text-landing-espresso sm:text-lg">
              "{prompt.prompt_text}"
            </p>

            <div className="flex flex-wrap items-center gap-3 border-t border-landing-clay/30 pt-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-landing-espresso-light uppercase tracking-tighter">
                <div className={`h-2 w-2 rounded-full ${isRevealed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                You've seen it
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-landing-espresso-light uppercase tracking-tighter">
                <div className={`h-2 w-2 rounded-full ${partnerRevealed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                Partner {partnerRevealed ? 'has seen it' : "hasn't seen it yet"}
              </div>
              
              {bothRevealed && (
                <div className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                  <CheckCircle2 className="h-3 w-3" />
                  Connection Made
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
