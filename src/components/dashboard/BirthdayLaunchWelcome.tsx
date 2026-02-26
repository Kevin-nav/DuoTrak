"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Gift, Sparkles } from "lucide-react";

interface BirthdayLaunchWelcomeProps {
  open: boolean;
  onClose: () => void;
}

const DOCUMENT_LINK =
  "https://docs.google.com/document/d/1u4jZJ7Zt_wrUo_2d9IKHtgtp99tDByVu8W51QrqTmHc/edit?usp=sharing";

export default function BirthdayLaunchWelcome({ open, onClose }: BirthdayLaunchWelcomeProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2d2117]/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Birthday launch message"
        >
          <motion.section
            initial={{ opacity: 0, y: 26, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#efd7bf] bg-[#fff8ee] shadow-[0_30px_90px_rgba(60,35,17,0.25)]"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-24 top-[-20%] h-64 w-64 rounded-full bg-[#f3c8a0]/60 blur-3xl" />
              <div className="absolute -right-20 bottom-[-15%] h-72 w-72 rounded-full bg-[#f0ddad]/70 blur-3xl" />
              <div className="absolute left-[38%] top-[6%] h-24 w-24 rounded-full bg-[#f7e8cb]/70 blur-2xl" />
            </div>

            <div className="relative p-6 sm:p-10">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e8ceb1] bg-white/75 px-4 py-1.5 text-xs font-semibold tracking-wide text-[#7a4c2c]">
                  <Gift className="h-4 w-4 text-[#cc7045]" />
                  VIP Accountability Partner
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -8, 0], y: [0, -1, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="h-5 w-5 text-[#ca8f3f]" />
                </motion.div>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-[#4a2f1d] sm:text-4xl">Happy Birthday!</h1>

              <div className="mt-5 space-y-3 text-sm leading-relaxed text-[#5c3a24] sm:text-base">
                <p>
                  Today, I&apos;m finally launching DuoTrak, but let&apos;s be honest: you were the original prototype.
                  Thank you for believing in this crazy idea since way back in June, and for putting up with me
                  through all the chaos between then and now.
                </p>
                <p>
                  Your trust and friendship mean the world to me. I was going to get you a very expensive birthday
                  gift, but I figured giving you the VIP accountability partner title was much more prestigious. (And
                  cheaper.)
                </p>
                <p className="font-semibold text-[#6a3f22]">Have the best birthday ever!</p>
                <p>Also, here is the link to the document you wanted to view.</p>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href={DOCUMENT_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#cd7c51] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#bb6c43]"
                >
                  Open Your Document
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl border border-[#ddbe9f] bg-white px-5 py-3 text-sm font-semibold text-[#6a3f22] transition hover:bg-[#fff5e7]"
                >
                  Enter Dashboard
                </button>
              </div>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
