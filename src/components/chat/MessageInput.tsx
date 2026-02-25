"use client";

import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, File as FileIcon, Hand, Image as ImageIcon, Loader2, Mic, Pause, Play, Plus, Send, Smile, Trash2, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Message } from "@/hooks/useChat";

interface MessageInputProps {
    replyingTo: Message | null;
    onCancelReply: () => void;
    onSend: (content: string, attachments?: Message["attachments"]) => Promise<void>;
    onSendNudge: (message: string) => Promise<void>;
    onTyping: () => void;
    partnerName: string;
    currentUserId?: Id<"users">;
    disabled?: boolean;
}

type PendingAttachment = {
    type: "image" | "video" | "document" | "voice";
    file: File;
    previewUrl: string;
    name: string;
    size: number;
    mime_type: string;
    duration?: number;
};

type RecorderPhase = "idle" | "holding" | "locked" | "preview";
type StopIntent = "send" | "preview" | "cancel";

const IMAGE_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;
const VIDEO_UPLOAD_LIMIT_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_DURATION_SECONDS = 180;
const IMAGE_MAX_DIMENSION = 1600;
const IMAGE_WEBP_QUALITY = 0.82;
const VIDEO_TARGET_BITRATE = 1_500_000;
const VIDEO_TARGET_AUDIO_BITRATE = 128_000;
const RECORD_LOCK_THRESHOLD_PX = 72;
const RECORD_CANCEL_THRESHOLD_PX = 110;

const QUICK_NUDGES = [
    "Checking in! \u{1F44B}",
    "You got this! \u{1F4AA}",
    "Thinking of you! \u{1F4AD}",
    "How's that goal going? \u{1F3AF}",
];

const QUICK_EMOJIS = ["\u{1F60A}", "\u{1F602}", "\u2764\uFE0F", "\u{1F44D}", "\u{1F525}", "\u{1F389}", "\u2B50", "\u2728"];

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function withReplacedExtension(name: string, ext: string): string {
    const dot = name.lastIndexOf(".");
    const stem = dot > 0 ? name.slice(0, dot) : name;
    return `${stem}${ext}`;
}

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Image load failed"));
        };
        img.src = url;
    });
}

async function compressImageForChat(file: File): Promise<File> {
    const img = await loadImage(file);
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;
    if (width > height && width > IMAGE_MAX_DIMENSION) {
        height = Math.round((height * IMAGE_MAX_DIMENSION) / width);
        width = IMAGE_MAX_DIMENSION;
    } else if (height > IMAGE_MAX_DIMENSION) {
        width = Math.round((width * IMAGE_MAX_DIMENSION) / height);
        height = IMAGE_MAX_DIMENSION;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing failed");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
            (result) => (result ? resolve(result) : reject(new Error("Image compression failed"))),
            "image/webp",
            IMAGE_WEBP_QUALITY
        );
    });
    return new File([blob], withReplacedExtension(file.name, ".webp"), { type: "image/webp" });
}

function readVideoMetadata(file: File): Promise<{ duration: number; width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
            resolve({
                duration: Number.isFinite(video.duration) ? video.duration : 0,
                width: video.videoWidth,
                height: video.videoHeight,
            });
            URL.revokeObjectURL(url);
        };
        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Video metadata failed"));
        };
        video.src = url;
    });
}

async function compressVideoForChat(file: File): Promise<File> {
    if (typeof MediaRecorder === "undefined") return file;
    const source = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.src = source;

    await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("Video load failed"));
    });

    const captureStream =
        (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream ||
        (video as HTMLVideoElement & { mozCaptureStream?: () => MediaStream }).mozCaptureStream;
    if (!captureStream) {
        URL.revokeObjectURL(source);
        return file;
    }

    const mimeType =
        (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") && "video/webm;codecs=vp9,opus") ||
        (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus") && "video/webm;codecs=vp8,opus") ||
        (MediaRecorder.isTypeSupported("video/webm") && "video/webm") ||
        "";
    if (!mimeType) {
        URL.revokeObjectURL(source);
        return file;
    }

    const stream = captureStream.call(video);
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: VIDEO_TARGET_BITRATE,
        audioBitsPerSecond: VIDEO_TARGET_AUDIO_BITRATE,
    });
    const done = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (e) => {
            if (e.data.size) chunks.push(e.data);
        };
        recorder.onerror = () => reject(new Error("Video compression failed"));
        recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    });
    try {
        recorder.start(1000);
        await video.play();
        await new Promise<void>((resolve, reject) => {
            video.onended = () => resolve();
            video.onerror = () => reject(new Error("Video playback failed"));
        });
        recorder.stop();
        const output = await done;
        if (!output.size || output.size >= file.size) return file;
        return new File([output], withReplacedExtension(file.name, ".webm"), { type: "video/webm" });
    } finally {
        stream.getTracks().forEach((t) => t.stop());
        URL.revokeObjectURL(source);
    }
}

function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== "string") {
                reject(new Error("Read failed"));
                return;
            }
            const [, base64] = reader.result.split(",");
            if (!base64) {
                reject(new Error("Base64 conversion failed"));
                return;
            }
            resolve(base64);
        };
        reader.onerror = () => reject(new Error("Read failed"));
        reader.readAsDataURL(file);
    });
}

const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(
    ({ replyingTo, onCancelReply, onSend, onSendNudge, onTyping, partnerName, currentUserId, disabled = false }, ref) => {
        const uploadAttachment = useAction((api as any).chat.uploadAttachment);
        const [message, setMessage] = useState("");
        const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
        const [isSending, setIsSending] = useState(false);
        const [isPreparingAttachments, setIsPreparingAttachments] = useState(false);
        const [recorderPhase, setRecorderPhase] = useState<RecorderPhase>("idle");
        const [recordingDuration, setRecordingDuration] = useState(0);
        const [recordingLevel, setRecordingLevel] = useState(0.08);
        const [isRecorderPaused, setIsRecorderPaused] = useState(false);
        const [recordingNotice, setRecordingNotice] = useState<string | null>(null);
        const [voicePreview, setVoicePreview] = useState<PendingAttachment | null>(null);
        const [gestureHint, setGestureHint] = useState<"none" | "lock" | "cancel">("none");
        const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
        const [showEmojiPicker, setShowEmojiPicker] = useState(false);
        const [showNudgeMenu, setShowNudgeMenu] = useState(false);
        const [attachmentError, setAttachmentError] = useState<string | null>(null);

        const internalRef = useRef<HTMLTextAreaElement>(null);
        const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;
        const fileInputRef = useRef<HTMLInputElement>(null);
        const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
        const recorderRef = useRef<MediaRecorder | null>(null);
        const streamRef = useRef<MediaStream | null>(null);
        const recorderChunksRef = useRef<Blob[]>([]);
        const recorderStartAtRef = useRef<number>(0);
        const analyserRef = useRef<AnalyserNode | null>(null);
        const audioCtxRef = useRef<AudioContext | null>(null);
        const levelRafRef = useRef<number | null>(null);
        const stopIntentRef = useRef<StopIntent | null>(null);
        const pointerSessionRef = useRef<{ pointerId: number; startX: number; startY: number; pointerType: string } | null>(null);
        const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);
        const voicePreviewRef = useRef<PendingAttachment | null>(null);

        const adjustTextareaHeight = useCallback(() => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }, [textareaRef]);

        useEffect(() => {
            adjustTextareaHeight();
        }, [message, adjustTextareaHeight]);

        useEffect(() => {
            pendingAttachmentsRef.current = pendingAttachments;
        }, [pendingAttachments]);

        useEffect(() => {
            voicePreviewRef.current = voicePreview;
        }, [voicePreview]);

        useEffect(() => {
            if (recordingDuration === 120) setRecordingNotice("Still recording. Slide up to lock.");
            if (recordingDuration === 300) setRecordingNotice("Long recording in progress. Keep app in foreground.");
            if (recordingDuration === 600) setRecordingNotice("Very long recording. Upload may take longer.");
        }, [recordingDuration]);

        useEffect(
            () => () => {
                pendingAttachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.previewUrl));
                if (voicePreviewRef.current) {
                    URL.revokeObjectURL(voicePreviewRef.current.previewUrl);
                }
                streamRef.current?.getTracks().forEach((t) => t.stop());
                if (timerRef.current) clearInterval(timerRef.current);
                if (levelRafRef.current != null) window.cancelAnimationFrame(levelRafRef.current);
            },
            []
        );

        const sendPayload = useCallback(async (rawText: string, attachmentsInput: PendingAttachment[]) => {
            const trimmed = rawText.trim();
            if (!trimmed && attachmentsInput.length === 0) return;
            if (isSending || isPreparingAttachments) return;
            setIsSending(true);
            try {
                const attachments =
                    attachmentsInput.length > 0
                        ? await Promise.all(
                            attachmentsInput.map(async (a) => {
                                const uploaded = await uploadAttachment({
                                    file_name: a.name,
                                    content_type: a.mime_type,
                                    base64_data: await fileToBase64(a.file),
                                });
                                return a.type === "voice" ? { ...uploaded, type: "voice", duration: a.duration } : uploaded;
                            })
                        )
                        : undefined;
                await onSend(trimmed, attachments);
                setMessage("");
                setAttachmentError(null);
                if (textareaRef.current) textareaRef.current.style.height = "auto";
            } finally {
                setIsSending(false);
            }
        }, [isPreparingAttachments, isSending, onSend, uploadAttachment, textareaRef]);

        const handleSend = async () => {
            await sendPayload(message, pendingAttachments);
            pendingAttachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
            setPendingAttachments([]);
        };

        const cleanupRecording = useCallback(() => {
            recorderRef.current = null;
            recorderChunksRef.current = [];
            stopIntentRef.current = null;
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            analyserRef.current?.disconnect();
            analyserRef.current = null;
            audioCtxRef.current?.close().catch(() => null);
            audioCtxRef.current = null;
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (levelRafRef.current != null) {
                window.cancelAnimationFrame(levelRafRef.current);
                levelRafRef.current = null;
            }
            pointerSessionRef.current = null;
            setGestureHint("none");
            setIsRecorderPaused(false);
            setRecordingLevel(0.08);
        }, []);

        const createVoiceAttachment = useCallback((blob: Blob, duration: number): PendingAttachment => {
            const mimeType = blob.type || "audio/webm";
            const ext = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "m4a" : "webm";
            const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: mimeType });
            return {
                type: "voice",
                file,
                previewUrl: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
                mime_type: file.type,
                duration,
            };
        }, []);

        const stopRecording = useCallback(async (intent: StopIntent) => {
            const recorder = recorderRef.current;
            if (!recorder) {
                setRecorderPhase("idle");
                return;
            }
            stopIntentRef.current = intent;

            const finalize = async () => {
                const resolvedIntent = stopIntentRef.current || intent;
                const duration = Math.max(1, Math.round((Date.now() - recorderStartAtRef.current) / 1000));
                const blob = new Blob(recorderChunksRef.current, { type: recorder.mimeType || "audio/webm" });
                cleanupRecording();
                setRecordingDuration(0);
                setRecordingNotice(null);

                if (resolvedIntent === "cancel" || !blob.size) {
                    setRecorderPhase("idle");
                    return;
                }

                const voiceAttachment = createVoiceAttachment(blob, duration);
                if (resolvedIntent === "preview") {
                    setVoicePreview((prev) => {
                        if (prev) URL.revokeObjectURL(prev.previewUrl);
                        return voiceAttachment;
                    });
                    setRecorderPhase("preview");
                    return;
                }

                setRecorderPhase("idle");
                try {
                    await sendPayload("", [voiceAttachment]);
                    URL.revokeObjectURL(voiceAttachment.previewUrl);
                } catch {
                    setVoicePreview(voiceAttachment);
                    setRecorderPhase("preview");
                }
            };

            recorder.onstop = () => void finalize();
            if (recorder.state !== "inactive") {
                recorder.stop();
            } else {
                void finalize();
            }
        }, [cleanupRecording, createVoiceAttachment, sendPayload]);

        const startRecording = useCallback(async (initialPhase: RecorderPhase = "holding") => {
            if (disabled || isSending || isPreparingAttachments || recorderPhase !== "idle") return;
            if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
                setAttachmentError("Voice recording is not supported on this device.");
                return;
            }

            const preferredTypes = [
                "audio/webm;codecs=opus",
                "audio/webm",
                "audio/ogg;codecs=opus",
                "audio/mp4",
            ];

            try {
                setAttachmentError(null);
                setRecordingNotice(null);
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                });
                streamRef.current = stream;

                const mimeType = preferredTypes.find((t) => MediaRecorder.isTypeSupported(t));
                const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
                recorderRef.current = recorder;
                recorderChunksRef.current = [];
                recorderStartAtRef.current = Date.now();
                setRecordingDuration(0);
                setRecorderPhase(initialPhase);
                recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) recorderChunksRef.current.push(event.data);
                };
                recorder.onerror = () => {
                    cleanupRecording();
                    setRecorderPhase("idle");
                    setAttachmentError("Recording failed. Please try again.");
                };
                recorder.start(250);

                const ctx = new AudioContext();
                const source = ctx.createMediaStreamSource(stream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);
                analyserRef.current = analyser;
                audioCtxRef.current = ctx;
                const data = new Uint8Array(analyser.frequencyBinCount);
                const loop = () => {
                    if (!analyserRef.current) return;
                    analyser.getByteFrequencyData(data);
                    const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
                    setRecordingLevel(Math.max(0.08, Math.min(1, avg / 180)));
                    levelRafRef.current = window.requestAnimationFrame(loop);
                };
                levelRafRef.current = window.requestAnimationFrame(loop);

                timerRef.current = setInterval(() => {
                    setRecordingDuration(Math.floor((Date.now() - recorderStartAtRef.current) / 1000));
                }, 300);
            } catch (error) {
                console.error("Failed to start recording:", error);
                setAttachmentError("Microphone access is blocked. Enable it in browser settings.");
            }
        }, [cleanupRecording, disabled, isPreparingAttachments, isSending, recorderPhase]);

        const togglePauseRecording = () => {
            const recorder = recorderRef.current;
            if (!recorder) return;
            if (recorder.state === "recording") {
                recorder.pause();
                setIsRecorderPaused(true);
            } else if (recorder.state === "paused") {
                recorder.resume();
                setIsRecorderPaused(false);
            }
        };

        const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files) return;
            setIsPreparingAttachments(true);
            setAttachmentError(null);
            const next: PendingAttachment[] = [];
            const rejected: string[] = [];

            for (const file of Array.from(files)) {
                const isImage = file.type.startsWith("image/");
                const isVideo = file.type.startsWith("video/");
                let candidate = file;
                try {
                    if (isImage) {
                        candidate = await compressImageForChat(file);
                        if (candidate.size > IMAGE_UPLOAD_LIMIT_BYTES) {
                            rejected.push(`${file.name}: > ${formatBytes(IMAGE_UPLOAD_LIMIT_BYTES)} after compression`);
                            continue;
                        }
                    } else if (isVideo) {
                        if (file.size > VIDEO_UPLOAD_LIMIT_BYTES) {
                            rejected.push(`${file.name}: > ${formatBytes(VIDEO_UPLOAD_LIMIT_BYTES)}`);
                            continue;
                        }
                        const meta = await readVideoMetadata(file);
                        if (meta.duration > MAX_VIDEO_DURATION_SECONDS) {
                            rejected.push(`${file.name}: longer than 3 minutes`);
                            continue;
                        }
                        if (file.size > 12 * 1024 * 1024 || meta.width > 1280 || meta.height > 720) {
                            candidate = await compressVideoForChat(file);
                        }
                        if (candidate.size > VIDEO_UPLOAD_LIMIT_BYTES) {
                            rejected.push(`${file.name}: > ${formatBytes(VIDEO_UPLOAD_LIMIT_BYTES)} after optimization`);
                            continue;
                        }
                    }
                    next.push({
                        type: isImage ? "image" : isVideo ? "video" : "document",
                        file: candidate,
                        previewUrl: URL.createObjectURL(candidate),
                        name: candidate.name,
                        size: candidate.size,
                        mime_type: candidate.type || file.type,
                    });
                } catch {
                    rejected.push(`${file.name}: processing failed`);
                }
            }

            setPendingAttachments((prev) => [...prev, ...next]);
            setIsPreparingAttachments(false);
            setShowAttachmentMenu(false);
            if (rejected.length) {
                setAttachmentError(rejected.slice(0, 2).join(" | "));
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
        };

        const removeAttachment = (index: number) => {
            setPendingAttachments((prev) => {
                const item = prev[index];
                if (item) URL.revokeObjectURL(item.previewUrl);
                return prev.filter((_, i) => i !== index);
            });
        };

        const handleVoicePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
            if (disabled || isPreparingAttachments || isSending || recorderPhase !== "idle") return;
            if (event.pointerType === "mouse") {
                pointerSessionRef.current = null;
                void startRecording("locked");
                return;
            }
            pointerSessionRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                pointerType: event.pointerType,
            };
            void startRecording("holding");
        };

        useEffect(() => {
            const handlePointerMove = (event: PointerEvent) => {
                const pointer = pointerSessionRef.current;
                if (!pointer || pointer.pointerId !== event.pointerId || recorderPhase !== "holding") return;
                const dx = event.clientX - pointer.startX;
                const dy = event.clientY - pointer.startY;
                if (dy <= -RECORD_LOCK_THRESHOLD_PX) {
                    setRecorderPhase("locked");
                    setGestureHint("lock");
                    return;
                }
                if (dx <= -RECORD_CANCEL_THRESHOLD_PX) {
                    setGestureHint("cancel");
                    pointerSessionRef.current = null;
                    void stopRecording("cancel");
                    return;
                }
                if (dy <= -32) setGestureHint("lock");
                else if (dx <= -40) setGestureHint("cancel");
                else setGestureHint("none");
            };

            const handlePointerUp = (event: PointerEvent) => {
                const pointer = pointerSessionRef.current;
                if (!pointer || pointer.pointerId !== event.pointerId) return;
                pointerSessionRef.current = null;
                setGestureHint("none");
                if (recorderPhase === "holding") {
                    void stopRecording("send");
                }
            };

            window.addEventListener("pointermove", handlePointerMove);
            window.addEventListener("pointerup", handlePointerUp);
            window.addEventListener("pointercancel", handlePointerUp);
            return () => {
                window.removeEventListener("pointermove", handlePointerMove);
                window.removeEventListener("pointerup", handlePointerUp);
                window.removeEventListener("pointercancel", handlePointerUp);
            };
        }, [recorderPhase, stopRecording]);

        const handleSendVoicePreview = async () => {
            if (!voicePreview) return;
            const pending = voicePreview;
            try {
                await sendPayload("", [pending]);
                setVoicePreview(null);
                setRecorderPhase("idle");
                URL.revokeObjectURL(pending.previewUrl);
            } catch {
                setAttachmentError("Failed to send voice note. Retry or discard.");
            }
        };

        const discardVoicePreview = () => {
            if (!voicePreview) return;
            URL.revokeObjectURL(voicePreview.previewUrl);
            setVoicePreview(null);
            setRecorderPhase("idle");
        };

        const hasContent = !!message.trim() || pendingAttachments.length > 0;
        const isVoiceActive = recorderPhase === "holding" || recorderPhase === "locked";
        const waveformBars = [0.45, 0.7, 1, 0.62, 0.84].map((m) =>
            Math.min(1, Math.max(0.08, recordingLevel) * (0.6 + m))
        );

        return (
            <div className="border-t border-landing-clay bg-landing-cream">
                {(attachmentError || recordingNotice) && (
                    <div className="px-4 pt-3">
                        {attachmentError && <p className="text-xs text-red-500">{attachmentError}</p>}
                        {!attachmentError && recordingNotice && <p className="text-xs text-landing-espresso-light">{recordingNotice}</p>}
                    </div>
                )}

                <AnimatePresence>
                    {replyingTo && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-landing-clay/60">
                            <div className="flex items-center gap-3 px-4 py-2 bg-landing-sand/55">
                                <div className="w-1 h-10 bg-landing-terracotta rounded-full" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-landing-terracotta">
                                        Replying to {replyingTo.sender_id === currentUserId ? "You" : replyingTo.sender?.name || "message"}
                                    </p>
                                    <p className="text-sm text-landing-espresso-light truncate">{replyingTo.content}</p>
                                </div>
                                <button onClick={onCancelReply} className="p-1.5 text-landing-espresso-light hover:text-landing-espresso hover:bg-white rounded-full transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {(pendingAttachments.length > 0 || isPreparingAttachments) && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-landing-clay/60">
                            <div className="flex gap-2 p-3 overflow-x-auto">
                                {isPreparingAttachments && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-landing-sand text-xs text-landing-espresso-light">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Optimizing media...
                                    </div>
                                )}
                                {pendingAttachments.map((a, index) => (
                                    <div key={index} className="relative flex-shrink-0">
                                        {a.type === "image" ? <img src={a.previewUrl} alt={a.name} className="w-16 h-16 object-cover rounded-lg" /> : a.type === "video" ? <video src={a.previewUrl} className="w-16 h-16 object-cover rounded-lg bg-black" muted playsInline preload="metadata" /> : <div className="w-16 h-16 bg-landing-sand rounded-lg flex items-center justify-center"><FileIcon className="h-6 w-6 text-landing-espresso-light" /></div>}
                                        <button onClick={() => removeAttachment(index)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {isVoiceActive && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="mx-3 mt-3 rounded-2xl border border-red-200 bg-red-50/70 px-3 py-3"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-sm font-medium text-red-600">
                                        {isRecorderPaused ? "Paused" : "Recording"} {formatDuration(recordingDuration)}
                                    </span>
                                </div>
                                {recorderPhase === "locked" && (
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={togglePauseRecording} className="h-8 w-8 rounded-full bg-white/85 text-landing-espresso flex items-center justify-center hover:bg-white transition-colors">
                                            {isRecorderPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                        </button>
                                        <button type="button" onClick={() => void stopRecording("send")} className="h-8 w-8 rounded-full bg-landing-espresso text-white flex items-center justify-center hover:bg-landing-terracotta transition-colors">
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button type="button" onClick={() => void stopRecording("cancel")} className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 flex items-end gap-1">
                                {waveformBars.map((level, index) => (
                                    <motion.div
                                        key={index}
                                        animate={{ height: `${Math.round(8 + level * 18)}px` }}
                                        transition={{ duration: 0.18 }}
                                        className="w-1.5 rounded-full bg-red-300"
                                    />
                                ))}
                            </div>
                            {recorderPhase === "holding" && (
                                <p className="mt-2 text-xs text-red-500">
                                    {gestureHint === "lock" ? "Release now to lock" : gestureHint === "cancel" ? "Release now to cancel" : "Slide up to lock, slide left to cancel"}
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {recorderPhase === "preview" && voicePreview && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="mx-3 mt-3 rounded-2xl border border-landing-clay/70 bg-white px-3 py-3"
                        >
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <p className="text-sm font-medium text-landing-espresso">Voice note preview</p>
                                <span className="text-xs text-landing-espresso-light">{formatDuration(voicePreview.duration || 0)}</span>
                            </div>
                            <audio controls src={voicePreview.previewUrl} className="w-full h-10" preload="metadata" />
                            <div className="mt-2 flex justify-end gap-2">
                                <button onClick={discardVoicePreview} className="h-9 px-3 rounded-full bg-landing-sand text-landing-espresso text-sm hover:bg-landing-clay/45 transition-colors">Discard</button>
                                <button onClick={() => void handleSendVoicePreview()} className="h-9 px-3 rounded-full bg-landing-espresso text-white text-sm hover:bg-landing-terracotta transition-colors">Send voice note</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-end gap-2 p-3">
                    <div className="relative">
                        <button onClick={() => { setShowAttachmentMenu(!showAttachmentMenu); setShowEmojiPicker(false); setShowNudgeMenu(false); }} disabled={disabled || isVoiceActive || recorderPhase === "preview" || isPreparingAttachments} className="p-2.5 text-landing-espresso-light hover:text-landing-terracotta hover:bg-white rounded-full transition-colors disabled:opacity-50">
                            <Plus className="h-5 w-5" />
                        </button>

                        <AnimatePresence>
                            {showAttachmentMenu && (
                                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-landing-clay py-2 min-w-[180px] z-50">
                                    <button onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = "image/*,video/*"; fileInputRef.current.click(); } }} className="w-full px-4 py-2.5 text-left text-sm text-landing-espresso hover:bg-landing-cream flex items-center gap-3 transition-colors">
                                        <div className="w-8 h-8 bg-landing-sand rounded-full flex items-center justify-center"><ImageIcon className="h-4 w-4 text-landing-terracotta" /></div>
                                        Photo or Video
                                    </button>
                                    <button onClick={() => { if (fileInputRef.current) { fileInputRef.current.accept = ".pdf,.doc,.docx,.txt,.xls,.xlsx"; fileInputRef.current.click(); } }} className="w-full px-4 py-2.5 text-left text-sm text-landing-espresso hover:bg-landing-cream flex items-center gap-3 transition-colors">
                                        <div className="w-8 h-8 bg-landing-sand rounded-full flex items-center justify-center"><FileIcon className="h-4 w-4 text-landing-espresso-light" /></div>
                                        Document
                                    </button>
                                    <button onClick={() => { setShowAttachmentMenu(false); setShowNudgeMenu(true); }} className="w-full px-4 py-2.5 text-left text-sm text-landing-espresso hover:bg-landing-cream flex items-center gap-3 transition-colors">
                                        <div className="w-8 h-8 bg-landing-sand rounded-full flex items-center justify-center"><Hand className="h-4 w-4 text-landing-gold" /></div>
                                        Send Nudge
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {showNudgeMenu && (
                                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-landing-clay py-2 min-w-[220px] z-50">
                                    {QUICK_NUDGES.map((nudge) => (
                                        <button key={nudge} onClick={() => onSendNudge(nudge)} className="w-full px-4 py-2.5 text-left text-sm text-landing-espresso hover:bg-landing-cream transition-colors">{nudge}</button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
                    </div>

                    {isVoiceActive ? (
                        <div className="flex-1 min-h-[48px] rounded-2xl border border-red-200 bg-red-50/55 px-4 py-3 flex items-center">
                            <p className="text-sm text-red-600">
                                {recorderPhase === "locked" ? "Voice note locked. Use controls above." : "Keep holding to record"}
                            </p>
                        </div>
                    ) : recorderPhase === "preview" ? (
                        <div className="flex-1 min-h-[48px] rounded-2xl border border-landing-clay/70 bg-white px-4 py-3 flex items-center">
                            <p className="text-sm text-landing-espresso-light">Ready to send your voice note preview.</p>
                        </div>
                    ) : (
                        <div className="flex-1 relative">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    onTyping();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        void handleSend();
                                    }
                                }}
                                onFocus={() => {
                                    setShowAttachmentMenu(false);
                                    setShowNudgeMenu(false);
                                }}
                                placeholder={`Message ${partnerName}...`}
                                disabled={disabled}
                                rows={1}
                                enterKeyHint="send"
                                className="w-full overflow-hidden px-4 py-3 bg-white border border-landing-clay rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-landing-terracotta/40 text-sm text-landing-espresso placeholder-landing-espresso-light disabled:opacity-50"
                            />
                        </div>
                    )}

                    <div className="relative">
                        <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachmentMenu(false); setShowNudgeMenu(false); }} disabled={disabled || isVoiceActive || recorderPhase === "preview" || isPreparingAttachments} className="p-2.5 text-landing-espresso-light hover:text-landing-terracotta hover:bg-white rounded-full transition-colors disabled:opacity-50">
                            <Smile className="h-5 w-5" />
                        </button>
                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute bottom-full right-0 mb-2 w-[16rem] bg-white rounded-xl shadow-lg border border-landing-clay p-3 z-50">
                                    <div className="grid grid-cols-4 gap-1">
                                        {QUICK_EMOJIS.map((emoji) => (
                                            <button key={emoji} onClick={() => { setMessage((prev) => prev + emoji); textareaRef.current?.focus(); setShowEmojiPicker(false); }} className="w-10 h-10 flex items-center justify-center text-xl hover:bg-landing-cream rounded-lg transition-colors">{emoji}</button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {hasContent ? (
                        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => void handleSend()} disabled={disabled || isSending || isPreparingAttachments} className="p-2.5 bg-landing-espresso text-white rounded-full hover:bg-landing-terracotta disabled:opacity-50 transition-colors">
                            {isSending || isPreparingAttachments ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </motion.button>
                    ) : (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            onPointerDown={handleVoicePointerDown}
                            disabled={disabled || isPreparingAttachments || isSending || recorderPhase !== "idle"}
                            className="p-2.5 text-landing-espresso-light hover:text-landing-terracotta hover:bg-white rounded-full transition-colors disabled:opacity-50 touch-none"
                            aria-label="Hold to record voice note"
                        >
                            <Mic className="h-5 w-5" />
                        </motion.button>
                    )}
                </div>
            </div>
        );
    }
);

MessageInput.displayName = "MessageInput";

export default MessageInput;
