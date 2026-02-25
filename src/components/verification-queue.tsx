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
  imageUrl: string;
  submittedAt: string;
  goalName: string;
  goalType: "personal" | "shared";
}

interface VerificationQueueProps {
  items?: VerificationItem[];
  onVerify: (itemId: string) => void;
  onReject: (itemId: string, reason: string) => void;
}

export default function VerificationQueue({
  items = [
    {
      id: "1",
      taskName: "Morning Workout",
      partnerName: "John",
      partnerInitials: "JD",
      imageUrl: "/placeholder.svg?height=200&width=300",
      submittedAt: "2 hours ago",
      goalName: "Fitness Journey",
      goalType: "shared",
    },
    {
      id: "2",
      taskName: "Healthy Breakfast",
      partnerName: "John",
      partnerInitials: "JD",
      imageUrl: "/placeholder.svg?height=200&width=300",
      submittedAt: "5 minutes ago",
      goalName: "Nutrition Goals",
      goalType: "shared",
    },
  ],
  onVerify,
  onReject,
}: VerificationQueueProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const rejectReasons = [
    "Image is unclear or blurry",
    "Doesn't show task completion",
    "Wrong task or activity",
    "Photo seems old or not recent",
  ];

  const handleVerify = (itemId: string) => {
    onVerify(itemId);
  };

  const handleRejectClick = (itemId: string) => {
    setSelectedItem(itemId);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = () => {
    if (selectedItem && rejectReason) {
      onReject(selectedItem, rejectReason);
      setShowRejectModal(false);
      setSelectedItem(null);
      setRejectReason("");
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
                      <span className="text-stone-gray dark:text-gray-400">Photo</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <motion.img
                      whileHover={{ scale: 1.01 }}
                      src={item.imageUrl}
                      alt={`${item.taskName} verification`}
                      className="h-28 w-full cursor-pointer rounded-lg border border-cool-gray object-cover dark:border-gray-600 sm:h-32"
                      onClick={() => setExpandedImage(item.imageUrl)}
                    />
                  </div>

                  <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                    <MouseGlowEffect glowColor="#10B981" intensity="medium">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleVerify(item.id)}
                        className="flex w-full items-center justify-center space-x-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 sm:flex-1"
                      >
                        <Check className="h-4 w-4" />
                        <span>Verify</span>
                      </motion.button>
                    </MouseGlowEffect>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleRejectClick(item.id)}
                      className="flex w-full items-center justify-center space-x-2 rounded-lg border border-error-red px-4 py-2 text-sm font-medium text-error-red transition-colors hover:bg-error-red hover:text-white sm:flex-1"
                    >
                      <X className="h-4 w-4" />
                      <span>Reject</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4"
            onClick={() => setExpandedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={expandedImage}
              alt="Expanded verification"
              className="max-h-full max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-xl bg-white p-4 dark:bg-gray-800 sm:p-6"
            >
              <div className="mb-4 flex items-center space-x-3">
                <X className="h-6 w-6 text-error-red" />
                <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100">Reject Task</h3>
              </div>

              <p className="mb-4 text-stone-gray dark:text-gray-300">
                Let your partner know why this task needs to be resubmitted:
              </p>

              <div className="mb-4 space-y-2">
                {rejectReasons.map((reason) => (
                  <motion.label
                    key={reason}
                    whileHover={{ scale: 1.01 }}
                    className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                      rejectReason === reason
                        ? "border-error-red bg-error-red/10"
                        : "border-cool-gray hover:border-error-red dark:border-gray-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejectReason"
                      checked={rejectReason === reason}
                      onChange={() => setRejectReason(reason)}
                      className="sr-only"
                    />
                    <div
                      className={`mr-3 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                        rejectReason === reason ? "border-error-red" : "border-cool-gray dark:border-gray-600"
                      }`}
                    >
                      {rejectReason === reason ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-2 w-2 rounded-full bg-error-red" />
                      ) : null}
                    </div>
                    <span className="text-sm text-charcoal dark:text-gray-100">{reason}</span>
                  </motion.label>
                ))}
              </div>

              <textarea
                placeholder="Other reason (optional)"
                value={rejectReason.startsWith("Other: ") ? rejectReason.replace("Other: ", "") : ""}
                onChange={(e) => setRejectReason(`Other: ${e.target.value}`)}
                className="w-full resize-none rounded-lg border border-cool-gray bg-white p-3 text-sm text-charcoal focus:border-error-red focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                rows={3}
              />

              <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason("");
                  }}
                  className="w-full rounded-lg border border-cool-gray px-4 py-2 text-charcoal transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700 sm:flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={!rejectReason}
                  className="w-full rounded-lg bg-error-red px-4 py-2 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
                >
                  Send Feedback
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
