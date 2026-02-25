# Chat Voice Notes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship end-to-end chat voice notes with hold-to-record, lock/cancel gestures, upload/send integration, and polished playback UI on mobile and desktop.

**Architecture:** Extend existing chat composer and message bubble flows rather than adding a parallel subsystem. Record audio client-side with `MediaRecorder`, upload through existing Convex attachment action, send as `voice` attachments, and render a dedicated audio player in bubbles. Keep behavior additive and backward-compatible.

**Tech Stack:** Next.js/React, TypeScript, Framer Motion, Convex mutations/actions, Cloudflare R2.

---

### Task 1: Backend Attachment Typing + Safety

**Files:**
- Modify: `convex/chat.ts`

**Step 1: Write failing verification**

Run: `rg "getAttachmentTypeFromMime|VOICE_UPLOAD_LIMIT_BYTES|audio/" convex/chat.ts`  
Expected: no voice MIME branch and no voice size limit.

**Step 2: Implement minimal backend updates**

- Add `audio/* -> "voice"` MIME classification.
- Add voice upload size safety bound.
- Keep existing image/video limits unchanged.

**Step 3: Verify code compiles logically**

Run: `rg "voice|VOICE_UPLOAD_LIMIT_BYTES|getAttachmentTypeFromMime" convex/chat.ts`  
Expected: updated mapping and size check present.

**Step 4: Commit**

```bash
git add convex/chat.ts
git commit -m "feat(chat): support voice attachment upload classification"
```

### Task 2: Composer Recorder State Machine + Gestures

**Files:**
- Modify: `src/components/chat/MessageInput.tsx`

**Step 1: Write failing verification**

Run: `rg "isRecording|recordingDuration|Mic|StopCircle" src/components/chat/MessageInput.tsx`  
Expected: placeholder recording logic without real audio capture.

**Step 2: Implement recorder + UI states**

- Add real `MediaRecorder` flow and stream cleanup.
- Add hold-to-record, slide-up lock, slide-left cancel.
- Add locked controls (pause/resume/send/discard) and preview.
- Add level visualization animation and timer.
- Attach uploaded voice note metadata (`duration`, `mime_type`, `size`, `name`).

**Step 3: Verify behavior hooks exist**

Run: `rg "MediaRecorder|getUserMedia|analyser|lock|cancel|voice" src/components/chat/MessageInput.tsx`  
Expected: recorder and gesture paths present.

**Step 4: Commit**

```bash
git add src/components/chat/MessageInput.tsx
git commit -m "feat(chat): implement shippable voice recording composer UX"
```

### Task 3: Message Type Inference + Chat Send Path

**Files:**
- Modify: `src/components/chat/ChatInterface.tsx`
- Modify: `convex/chat.ts`

**Step 1: Write failing verification**

Run: `rg "message_type|last_message_text|preview" src/components/chat/ChatInterface.tsx convex/chat.ts`  
Expected: no explicit voice inference for send path.

**Step 2: Implement minimal updates**

- Infer `message_type: "voice"` when sending voice attachment without text.
- Add robust last-message/notification preview fallback for non-text payloads.

**Step 3: Verify**

Run: `rg "message_type: \"voice\"|Voice note|previewText" src/components/chat/ChatInterface.tsx convex/chat.ts`  
Expected: voice send and preview fallback logic present.

**Step 4: Commit**

```bash
git add src/components/chat/ChatInterface.tsx convex/chat.ts
git commit -m "feat(chat): classify voice note messages for send + previews"
```

### Task 4: Voice Bubble Playback UI

**Files:**
- Modify: `src/components/chat/MessageBubble.tsx`

**Step 1: Write failing verification**

Run: `rg "attachment.type === \"voice\"|isPlaying|w-1/3" src/components/chat/MessageBubble.tsx`  
Expected: static/non-functional placeholder voice UI.

**Step 2: Implement player component**

- Add real `<audio>` driven play/pause/progress.
- Add elapsed/total time and speed toggle.
- Add loading/error handling and animated playback indicator.

**Step 3: Verify**

Run: `rg "<audio|playbackRate|timeupdate|loadedmetadata|voice" src/components/chat/MessageBubble.tsx`  
Expected: functional playback implementation.

**Step 4: Commit**

```bash
git add src/components/chat/MessageBubble.tsx
git commit -m "feat(chat): ship voice note playback controls in bubbles"
```

### Task 5: Validation + Regression

**Files:**
- Modify as needed for type fixes from build/test feedback.

**Step 1: Run targeted checks**

Run: `npm run lint -- src/components/chat/MessageInput.tsx src/components/chat/MessageBubble.tsx src/components/chat/ChatInterface.tsx convex/chat.ts`  
Expected: no lint errors in touched files.

**Step 2: Run project type check (or closest available)**

Run: `npm run typecheck`  
Expected: passes or only unrelated pre-existing errors.

**Step 3: Smoke verify workflow**

- Record short voice note.
- Release to send (hold mode).
- Lock -> pause/resume -> send.
- Cancel gesture path.
- Playback received/sent voice note.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(chat): end-to-end voice notes with production recorder UX"
```
