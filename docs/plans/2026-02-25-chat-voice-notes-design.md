# Chat Voice Notes Design

**Date:** 2026-02-25  
**Status:** Approved

## Scope
Add end-to-end voice notes to DuoTrak chat with production-grade UI/UX, mobile + desktop parity, and polished animation/transitions.

## Product Decisions
- Record interaction: hold-to-record, release-to-send.
- Include lock mode: slide up to lock and continue hands-free.
- Include cancel gesture: slide left to cancel.
- Audio-only in v1 (no transcription).
- No hard duration cap; use soft duration warnings and upload safety bounds.

## UX Behavior

### Composer
- Idle state shows mic affordance.
- Press-and-hold enters recording state with live timer + level indicator.
- Drag up locks recording and reveals expanded locked controls.
- Drag left cancels and discards current recording.
- Releasing finger in hold mode sends immediately.
- Locked mode supports pause/resume, send, discard, and preview-before-send.

### Voice Message Bubble
- Voice attachments render with dedicated player controls.
- Playback controls: play/pause, progress, elapsed/total time.
- Speed toggle available: 1x, 1.5x, 2x.
- Loading and error states are explicit and recoverable.

### Motion + Transitions
- Mic morph animation into recording state.
- Pulsing live indicator while recording.
- Spring transitions for hold/lock/preview transitions.
- Progress and waveform feedback animated, with reduced-motion-safe fallbacks.

## Technical Architecture

### Frontend
- Implement a client-side recorder state machine in chat input:
  - idle -> holding -> locked -> preview -> sending/error -> idle
- Use `MediaRecorder` + `getUserMedia({ audio: true })`.
- Use Web Audio `AnalyserNode` for lightweight real-time level meter.
- Preserve one shared implementation for mobile + desktop with pointer-based interactions.

### Upload + Message Send
- Reuse existing Convex action `chat.uploadAttachment` for binary upload.
- Extend attachment MIME classification to map `audio/*` to `voice`.
- Send message via existing `chat.sendMessage` mutation using:
  - `message_type: "voice"` when voice attachment is present and text is empty.
  - attachment payload includes `duration`, `mime_type`, `size`, `name`, `url`.

### Playback
- Replace placeholder voice block in message bubble with real `<audio>` control logic.
- Manage progress/time/events in component state.
- Keep bubble-level controls touch-friendly and keyboard accessible.

## Reliability + Safety
- Permission errors handled with explicit user guidance.
- Upload failures preserve local draft for retry/discard.
- Explicit cleanup for streams, intervals, animation frames, and object URLs.
- Server + client file-size bounds for safety with no hard time cap.

## Testing Strategy
- Unit test recorder state transitions.
- Component test voice bubble playback controls.
- Integration test record -> upload -> send -> render -> playback path.
- Manual matrix: iOS Safari, Android Chrome, desktop Chrome/Edge/Safari.
- Regression checks for text/image/video/document messaging.
