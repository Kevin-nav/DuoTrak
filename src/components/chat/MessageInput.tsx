"use client";

import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { File as FileIcon, Hand, Image as ImageIcon, Loader2, Mic, Plus, Send, Smile, StopCircle, X } from "lucide-react";
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
    type: "image" | "video" | "document";
    file: File;
    previewUrl: string;
    name: string;
    size: number;
    mime_type: string;
};

const IMAGE_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;
const VIDEO_UPLOAD_LIMIT_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_DURATION_SECONDS = 180;
const IMAGE_MAX_DIMENSION = 1600;
const IMAGE_WEBP_QUALITY = 0.82;
const VIDEO_TARGET_BITRATE = 1_500_000;
const VIDEO_TARGET_AUDIO_BITRATE = 128_000;

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
        const [isRecording, setIsRecording] = useState(false);
        const [recordingDuration, setRecordingDuration] = useState(0);
        const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
        const [showEmojiPicker, setShowEmojiPicker] = useState(false);
        const [showNudgeMenu, setShowNudgeMenu] = useState(false);
        const [attachmentError, setAttachmentError] = useState<string | null>(null);

        const internalRef = useRef<HTMLTextAreaElement>(null);
        const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;
        const fileInputRef = useRef<HTMLInputElement>(null);
        const recordingInterval = useRef<NodeJS.Timeout | null>(null);
        const pendingAttachmentsRef = useRef<PendingAttachment[]>([]);

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

        useEffect(
            () => () => {
                pendingAttachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.previewUrl));
            },
            []
        );

        const handleSend = async () => {
            const trimmed = message.trim();
            if (!trimmed && pendingAttachments.length === 0) return;
            if (isSending || isPreparingAttachments) return;
            setIsSending(true);
            try {
                const attachments =
                    pendingAttachments.length > 0
                        ? await Promise.all(
                            pendingAttachments.map(async (a) =>
                                uploadAttachment({
                                    file_name: a.name,
                                    content_type: a.mime_type,
                                    base64_data: await fileToBase64(a.file),
                                })
                            )
                        )
                        : undefined;
                await onSend(trimmed, attachments);
                setMessage("");
                setAttachmentError(null);
                pendingAttachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
                setPendingAttachments([]);
                if (textareaRef.current) textareaRef.current.style.height = "auto";
            } finally {
                setIsSending(false);
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

        const hasContent = !!message.trim() || pendingAttachments.length > 0;

        return (
            <div className="border-t border-landing-clay bg-landing-cream">
                {attachmentError && (
                    <div className="px-4 pt-3">
                        <p className="text-xs text-red-500">{attachmentError}</p>
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

                <div className="flex items-end gap-2 p-3">
                    <div className="relative">
                        <button onClick={() => { setShowAttachmentMenu(!showAttachmentMenu); setShowEmojiPicker(false); setShowNudgeMenu(false); }} disabled={disabled || isRecording || isPreparingAttachments} className="p-2.5 text-landing-espresso-light hover:text-landing-terracotta hover:bg-white rounded-full transition-colors disabled:opacity-50">
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

                    {isRecording ? (
                        <div className="flex-1 flex items-center gap-3 bg-red-50 rounded-2xl px-4 py-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-red-600">
                                Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, "0")}
                            </span>
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
                                        handleSend();
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
                        <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachmentMenu(false); setShowNudgeMenu(false); }} disabled={disabled || isRecording || isPreparingAttachments} className="p-2.5 text-landing-espresso-light hover:text-landing-terracotta hover:bg-white rounded-full transition-colors disabled:opacity-50">
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
                        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={handleSend} disabled={disabled || isSending || isPreparingAttachments} className="p-2.5 bg-landing-espresso text-white rounded-full hover:bg-landing-terracotta disabled:opacity-50 transition-colors">
                            {isSending || isPreparingAttachments ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </motion.button>
                    ) : isRecording ? (
                        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => { setIsRecording(false); if (recordingInterval.current) clearInterval(recordingInterval.current); }} className="p-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                            <StopCircle className="h-5 w-5" />
                        </motion.button>
                    ) : (
                        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => { setIsRecording(true); setRecordingDuration(0); recordingInterval.current = setInterval(() => setRecordingDuration((p) => p + 1), 1000); }} disabled={disabled || isPreparingAttachments} className="p-2.5 text-landing-espresso-light hover:text-landing-terracotta hover:bg-white rounded-full transition-colors disabled:opacity-50">
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
