"use client";

import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  Circle,
  Mic,
  PlayCircle,
  Square,
  Upload,
  Video,
  X,
} from "lucide-react";

export type VerificationMode =
  | "photo"
  | "video"
  | "voice"
  | "time-window"
  | "task_completion"
  | "check_in";

export type TaskVerificationSubmission = {
  mode: VerificationMode;
  file?: File;
  completedAt?: number;
};

interface TaskVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskName: string;
  mode: VerificationMode;
  onSubmit: (submission: TaskVerificationSubmission) => Promise<void> | void;
}

function formatDuration(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function isMediaMode(mode: VerificationMode): mode is "photo" | "video" | "voice" {
  return mode === "photo" || mode === "video" || mode === "voice";
}

export default function TaskVerificationModal({
  isOpen,
  onClose,
  taskName,
  mode,
  onSubmit,
}: TaskVerificationModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [sliderX, setSliderX] = useState(0);
  const [sliderMaxX, setSliderMaxX] = useState(0);
  const [isSliding, setIsSliding] = useState(false);

  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const photoCaptureInputRef = useRef<HTMLInputElement | null>(null);
  const photoUploadInputRef = useRef<HTMLInputElement | null>(null);
  const videoCaptureInputRef = useRef<HTMLInputElement | null>(null);
  const videoUploadInputRef = useRef<HTMLInputElement | null>(null);
  const audioUploadInputRef = useRef<HTMLInputElement | null>(null);

  const sliderProgress = sliderMaxX > 0 ? sliderX / sliderMaxX : 0;
  const canSubmitMedia = isMediaMode(mode) ? !!selectedFile && !isSubmitting : false;

  const title = useMemo(() => {
    if (mode === "photo") return "Upload Photo Proof";
    if (mode === "video") return "Upload Video Proof";
    if (mode === "voice") return "Record Voice Proof";
    if (mode === "time-window") return "Time-Window Check-In";
    return "Complete Task";
  }, [mode]);

  const subtitle = useMemo(() => {
    if (mode === "photo") return "Share a clear photo of completion.";
    if (mode === "video") return "Share a short video showing completion.";
    if (mode === "voice") return "Record or upload a quick audio reflection.";
    if (mode === "time-window") return "Slide to confirm this was completed now.";
    if (mode === "check_in") return "Confirm this check-in.";
    return "Mark this task complete.";
  }, [mode]);

  useEffect(() => {
    if (!isOpen) return;
    const media = window.matchMedia("(pointer: coarse)");
    setIsCoarsePointer(media.matches);
    const onChange = (event: MediaQueryListEvent) => setIsCoarsePointer(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || mode !== "time-window") return;
    const recalc = () => {
      const width = sliderTrackRef.current?.offsetWidth || 0;
      setSliderMaxX(Math.max(0, width - 40));
      setSliderX(0);
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;
    setErrorText(null);
    setIsSubmitting(false);
    setSliderX(0);
  }, [isOpen, mode]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      stopAudioRecording(true);
    };
  }, [previewUrl]);

  const resetSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleClose = (force = false) => {
    if (isSubmitting && !force) return;
    stopAudioRecording(true);
    resetSelectedFile();
    setErrorText(null);
    setRecordingSeconds(0);
    setSliderX(0);
    onClose();
  };

  const setFileSelection = (file: File) => {
    resetSelectedFile();
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorText(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileSelection(file);
    event.target.value = "";
  };

  const stopAudioRecording = (discard: boolean) => {
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
      audioIntervalRef.current = null;
    }

    const recorder = audioRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    audioRecorderRef.current = null;

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (discard) {
      audioChunksRef.current = [];
    }

    setIsRecordingAudio(false);
  };

  const startAudioRecording = async () => {
    setErrorText(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("Audio recording is not supported on this device.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      const mimeType = preferredTypes.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        if (audioChunksRef.current.length === 0) return;
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `voice-proof-${Date.now()}.${extension}`, { type: blob.type });
        setFileSelection(file);
        audioChunksRef.current = [];
      };

      audioStreamRef.current = stream;
      audioRecorderRef.current = recorder;
      setRecordingSeconds(0);
      setIsRecordingAudio(true);
      recorder.start(250);

      audioIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error: any) {
      setErrorText(error?.message || "Could not start audio recording.");
      stopAudioRecording(true);
    }
  };

  const finishAudioRecording = () => {
    stopAudioRecording(false);
  };

  const submitWithPayload = async (payload: TaskVerificationSubmission) => {
    setIsSubmitting(true);
    setErrorText(null);
    try {
      await onSubmit(payload);
      setIsSubmitting(false);
      handleClose(true);
    } catch (error: any) {
      setErrorText(error?.message || "Could not submit verification. Please try again.");
      setIsSubmitting(false);
    }
  };

  const submitMedia = async () => {
    if (!selectedFile || !isMediaMode(mode)) return;
    await submitWithPayload({ mode, file: selectedFile });
  };

  const submitCompletion = async () => {
    await submitWithPayload({ mode, completedAt: Date.now() });
  };

  const startSlide = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isSubmitting || mode !== "time-window") return;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    setIsSliding(true);
  };

  const moveSlide = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isSliding || mode !== "time-window") return;
    const rect = sliderTrackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const knobHalf = 20;
    const proposed = event.clientX - rect.left - knobHalf;
    const clamped = Math.max(0, Math.min(sliderMaxX, proposed));
    setSliderX(clamped);
  };

  const endSlide = async () => {
    if (!isSliding || mode !== "time-window") return;
    setIsSliding(false);
    if (sliderProgress >= 0.92) {
      await submitCompletion();
      return;
    }
    setSliderX(0);
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-cool-gray bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-charcoal dark:text-gray-100">{title}</h3>
                <p className="text-sm text-stone-gray dark:text-gray-300">{taskName}</p>
                <p className="mt-1 text-xs text-stone-gray dark:text-gray-400">{subtitle}</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded p-1 text-stone-gray transition-colors hover:bg-gray-100 hover:text-charcoal dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label="Close verification modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isMediaMode(mode) ? (
              <div className="space-y-4">
                {previewUrl ? (
                  <div className="space-y-3">
                    {mode === "photo" ? (
                      <img
                        src={previewUrl}
                        alt="Selected proof"
                        className="h-52 w-full rounded-lg border border-cool-gray object-cover dark:border-gray-600"
                      />
                    ) : null}
                    {mode === "video" ? (
                      <video
                        src={previewUrl}
                        controls
                        playsInline
                        className="h-52 w-full rounded-lg border border-cool-gray object-cover dark:border-gray-600"
                      />
                    ) : null}
                    {mode === "voice" ? (
                      <div className="rounded-lg border border-cool-gray p-3 dark:border-gray-600">
                        <div className="mb-2 flex items-center gap-2 text-sm text-charcoal dark:text-gray-100">
                          <PlayCircle className="h-4 w-4 text-primary-blue" />
                          Voice proof ready
                        </div>
                        <audio controls src={previewUrl} className="w-full" preload="metadata" />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={resetSelectedFile}
                      className="text-sm font-medium text-primary-blue hover:text-primary-blue-hover"
                    >
                      Choose different file
                    </button>
                  </div>
                ) : null}

                {mode === "photo" ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      ref={photoCaptureInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <input
                      ref={photoUploadInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => photoCaptureInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-blue-hover"
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => photoUploadInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-cool-gray px-4 py-2.5 text-sm font-semibold text-charcoal hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      <Upload className="h-4 w-4" />
                      Choose Photo
                    </button>
                  </div>
                ) : null}

                {mode === "video" ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      ref={videoCaptureInputRef}
                      type="file"
                      accept="video/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <input
                      ref={videoUploadInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => videoCaptureInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-blue-hover"
                    >
                      <Video className="h-4 w-4" />
                      Record Video
                    </button>
                    <button
                      type="button"
                      onClick={() => videoUploadInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-cool-gray px-4 py-2.5 text-sm font-semibold text-charcoal hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      <Upload className="h-4 w-4" />
                      Choose Video
                    </button>
                  </div>
                ) : null}

                {mode === "voice" ? (
                  <div className="space-y-2.5">
                    <input
                      ref={audioUploadInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {isRecordingAudio ? (
                        <button
                          type="button"
                          onClick={finishAudioRecording}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                        >
                          <Square className="h-4 w-4" />
                          Stop ({formatDuration(recordingSeconds)})
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startAudioRecording}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-blue-hover"
                        >
                          <Mic className="h-4 w-4" />
                          Record Audio
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => audioUploadInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-cool-gray px-4 py-2.5 text-sm font-semibold text-charcoal hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                      >
                        <Upload className="h-4 w-4" />
                        Choose Audio
                      </button>
                    </div>
                    {isRecordingAudio ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-300">
                        <Circle className="h-2.5 w-2.5 fill-current" />
                        Recording now
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {mode === "time-window" ? (
              <div className="space-y-3">
                <div
                  ref={sliderTrackRef}
                  className="relative h-12 rounded-full border border-cool-gray bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
                >
                  <div className="absolute inset-y-0 left-0 flex items-center px-4 text-xs font-semibold text-stone-gray dark:text-gray-300">
                    Slide to complete
                  </div>
                  <motion.div
                    role="button"
                    tabIndex={0}
                    aria-label="Slide to complete task"
                    className="absolute top-1 flex h-10 w-10 cursor-grab items-center justify-center rounded-full bg-primary-blue text-white shadow-md active:cursor-grabbing"
                    style={{ transform: `translateX(${sliderX}px)` }}
                    onPointerDown={startSlide}
                    onPointerMove={moveSlide}
                    onPointerUp={endSlide}
                    onPointerCancel={endSlide}
                    onKeyDown={async (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        await submitCompletion();
                      }
                    }}
                  >
                    <Check className="h-5 w-5" />
                  </motion.div>
                </div>

                {!isCoarsePointer ? (
                  <button
                    type="button"
                    onClick={submitCompletion}
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-primary-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? "Completing..." : "Mark Complete"}
                  </button>
                ) : null}
              </div>
            ) : null}

            {mode === "task_completion" || mode === "check_in" ? (
              <button
                type="button"
                onClick={submitCompletion}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-primary-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-blue-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Submitting..." : "Complete Task"}
              </button>
            ) : null}

            {errorText ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300">
                {errorText}
              </p>
            ) : null}

            {isMediaMode(mode) ? (
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-cool-gray px-4 py-2.5 text-sm font-semibold text-charcoal hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitMedia}
                  disabled={!canSubmitMedia}
                  className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting..." : "Submit Proof"}
                </button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
