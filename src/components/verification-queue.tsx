"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { Check, X, Eye, Camera, AlertTriangle } from "lucide-react";
import { useState } from "react";
import MouseGlowEffect from "./mouse-glow-effect";

interface VerificationItem {
  id: string;
  taskName: string;
  partnerName: string;
  partnerInitials: string;
  evidenceUrl?: string;
  verificationMode?: string;
  submittedAt: string;
  goalName: string;
  goalType: "personal" | "shared";
  proofType?: string;
}

interface VerificationQueueProps {
  items?: VerificationItem[];
  onVerify: (itemId: string) => void;
  onReject: (itemId: string, reason: string) => void;
}

export default function VerificationQueue({
  items = [],
  onVerify,
  onReject,
}: VerificationQueueProps) {
  const [selectedItem, setSelectedItem] = useState<VerificationItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeReviewModal = () => {
    setSelectedItem(null);
    setRejectReason("");
    setIsSubmitting(false);
  };

  const isImageProof = (item?: VerificationItem | null) => {
    const mode = String(item?.verificationMode || "").toLowerCase();
    if (mode === "photo") return true;
    const url = String(item?.evidenceUrl || "");
    return /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)(\?|$)/i.test(url);
  };

  const isVideoProof = (item?: VerificationItem | null) => {
    const mode = String(item?.verificationMode || "").toLowerCase();
    if (mode === "video") return true;
    const url = String(item?.evidenceUrl || "");
    return /\.(mp4|mov|webm|m4v|avi|mkv)(\?|$)/i.test(url);
  };

  const isAudioProof = (item?: VerificationItem | null) => {
    const mode = String(item?.verificationMode || "").toLowerCase();
    if (mode === "voice") return true;
    const url = String(item?.evidenceUrl || "");
    return /\.(mp3|wav|ogg|m4a|aac|flac|webm)(\?|$)/i.test(url);
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await Promise.resolve(onVerify(selectedItem.id));
      closeReviewModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedItem || !rejectReason.trim()) return;
    setIsSubmitting(true);
    try {
      await Promise.resolve(onReject(selectedItem.id, rejectReason.trim()));
      closeReviewModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-cool-gray bg-white p-4 text-center shadow-sm dark:bg-gray-800 dark:border-gray-700 sm:p-6"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className="mb-4"
        >
          <Eye className="mx-auto h-12 w-12 text-stone-gray dark:text-gray-400" />
        </motion.div>
        <h3 className="mb-2 text-lg font-semibold text-charcoal dark:text-gray-100">All caught up!</h3>
        <p className="text-stone-gray dark:text-gray-300">No tasks waiting for your verification</p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-cool-gray bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700 sm:p-6"
      >
        <motion.div variants={itemVariants} className="mb-4 flex items-start justify-between gap-2 sm:mb-6 sm:items-center">
          <div className="flex min-w-0 items-center space-x-2.5 sm:space-x-3">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}>
              <AlertTriangle className="h-5 w-5 text-primary-blue sm:h-6 sm:w-6" />
            </motion.div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-charcoal dark:text-gray-100 sm:text-xl">Verification Queue</h2>
              <p className="text-xs text-stone-gray dark:text-gray-300 sm:text-sm">
                {items.length} task{items.length !== 1 ? "s" : ""} waiting for your review
              </p>
            </div>
          </div>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary-blue text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm">
            {items.length}
          </div>
        </motion.div>

        <div className="space-y-3 sm:space-y-4">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
              className="rounded-lg border border-cool-gray p-3.5 transition-colors hover:border-primary-blue dark:border-gray-600 sm:p-4"
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-blue text-sm font-semibold text-white sm:h-10 sm:w-10">
                    {item.partnerInitials}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="truncate font-semibold text-charcoal dark:text-gray-100">{item.taskName}</h4>
                      <p className="text-xs text-stone-gray dark:text-gray-400 sm:text-sm">
                        {item.partnerName} - {item.goalName} - {item.submittedAt}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                      <Camera className="h-3 w-3 text-stone-gray dark:text-gray-400" />
                      <span className="text-stone-gray dark:text-gray-400">{item.proofType || "Proof"}</span>
                    </div>
                  </div>

                  <div className="flex">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedItem(item)}
                      className="inline-flex items-center gap-2 rounded-lg border border-primary-blue bg-primary-blue/10 px-4 py-2 text-sm font-medium text-primary-blue transition-colors hover:bg-primary-blue hover:text-white"
                    >
                      <Eye className="h-4 w-4" />
                      View proof
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
            onClick={closeReviewModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl rounded-xl bg-white p-4 dark:bg-gray-800 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100">Review proof</h3>
                  <p className="text-sm text-stone-gray dark:text-gray-300">
                    {selectedItem.taskName} • {selectedItem.partnerName} • {selectedItem.submittedAt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="rounded-md p-1 text-stone-gray hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Close review"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 rounded-lg border border-cool-gray bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-900/30">
                {selectedItem.evidenceUrl ? (
                  isImageProof(selectedItem) ? (
                    <img
                      src={selectedItem.evidenceUrl}
                      alt={`${selectedItem.taskName} proof`}
                      className="max-h-[50vh] w-full rounded-lg object-contain"
                    />
                  ) : isVideoProof(selectedItem) ? (
                    <video src={selectedItem.evidenceUrl} controls playsInline className="max-h-[50vh] w-full rounded-lg" />
                  ) : isAudioProof(selectedItem) ? (
                    <audio controls src={selectedItem.evidenceUrl} className="w-full" preload="metadata" />
                  ) : (
                    <a
                      href={selectedItem.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary-blue hover:underline"
                    >
                      Open submitted proof
                    </a>
                  )
                ) : (
                  <p className="text-sm text-stone-gray dark:text-gray-300">No proof URL attached to this submission.</p>
                )}
              </div>

              <p className="mb-2 text-sm font-medium text-charcoal dark:text-gray-100">Rejection feedback (required only if rejecting)</p>
              <textarea
                placeholder="Explain what needs to be fixed before re-upload (for example: unclear image, wrong task, or not enough evidence)."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full resize-none rounded-lg border border-cool-gray bg-white p-3 text-sm text-charcoal focus:border-error-red focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                rows={3}
              />

              <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:gap-3">
                <button
                  onClick={closeReviewModal}
                  className="w-full rounded-lg border border-cool-gray px-4 py-2 text-charcoal transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700 sm:flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <MouseGlowEffect glowColor="#10B981" intensity="medium">
                  <button
                    onClick={handleApprove}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 font-medium text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-1"
                    disabled={isSubmitting}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                </MouseGlowEffect>
                <button
                  onClick={handleRejectSubmit}
                  disabled={!rejectReason.trim() || isSubmitting}
                  className="w-full rounded-lg bg-error-red px-4 py-2 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
                >
                  Reject with feedback
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
