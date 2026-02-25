"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trophy } from "lucide-react";

export default function CelebrationOverlay({
  show,
}: {
  show: boolean;
}) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-md">
              <Trophy className="h-7 w-7 text-amber-500" />
            </div>
            <p className="mt-2 font-semibold text-white">Great job!</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
