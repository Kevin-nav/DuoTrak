# Partner Invitation TypeScript Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move partner invitation flow from Python endpoints to TypeScript/Convex and align sent email template with the in-app preview while keeping invite links domain-configurable.

**Architecture:** Convex remains source of truth for invitation lifecycle. A new Convex internal action sends transactional invitation/nudge emails via Resend using a TypeScript HTML renderer that mirrors the invite preview. A shared invite URL builder is used across email links, QR codes, and UI share flows to avoid localhost leakage in production.

**Tech Stack:** Next.js 15, TypeScript, Convex mutations/actions, Resend HTTP API, React components, qrcode.react

---

### Task 1: Canonical invite URL builder

**Files:**
- Create: `src/lib/invites/url.ts`
- Modify: `src/components/onboarding/InteractiveWaitingRoom.tsx`

**Step 1: Write failing expectations mentally (no existing unit harness for this util)**
- Ensure URL builder picks env domain first and falls back to localhost in dev.

**Step 2: Implement minimal utility**
- Add `buildInviteUrl(token)` and `getPublicAppBaseUrl()` with `NEXT_PUBLIC_APP_URL` and server fallbacks.

**Step 3: Integrate in waiting room**
- Replace hardcoded `https://duotrak.org/invite/...` with utility.

**Step 4: Verify usage compiles**
- Run targeted typecheck.

### Task 2: Email HTML renderer in TypeScript

**Files:**
- Create: `convex/lib/invitationEmail.ts`

**Step 1: Write renderer API**
- `renderPartnerInvitationEmail({ senderName, receiverName, customMessage, acceptUrl, expiresInDays })`.

**Step 2: Implement preview-matching HTML/CSS**
- Include branded header, optional custom message blockquote, default body, CTA text `Accept Invitation & Join DuoTrak`.

**Step 3: Return subject + html**
- Match current subject intent.

### Task 3: Convex Resend action

**Files:**
- Create: `convex/invitationsEmail.ts`

**Step 1: Add internal action to call Resend API**
- Read `RESEND_API_KEY` and sender domain from env.

**Step 2: Add robust error handling**
- Return structured `{ ok, error }`.

**Step 3: Keep function reusable for invitation and nudge emails**
- Accept parameters with email type discriminant.

### Task 4: Wire invitation mutation + status fields

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/invitations.ts`

**Step 1: Extend schema**
- Add optional `email_sent_at`, `email_send_status`, `email_last_error` and nudge equivalents.

**Step 2: Update create mutation**
- After insert, invoke internal action and patch status fields.

**Step 3: Update nudge mutation**
- Send nudge email from TypeScript action and patch nudge email status fields.

### Task 5: Remove remaining Python-backed acceptance page dependency

**Files:**
- Modify: `src/app/invite/[token]/page.tsx`

**Step 1: Replace with redirect to Convex-backed acceptance route**
- Keep old links working by redirecting to `/invite-acceptance?token=...`.

### Task 6: Keep share/QR card links consistent

**Files:**
- Modify: `src/components/invitation/ShareableInviteCard.tsx` (if branding/domain text needs dynamic)
- Modify: `src/components/invitation/SocialShareDrawer.tsx` (ensure it receives canonical URL)

**Step 1: Ensure canonical URL passed through current props**
- No local URL hardcoding.

**Step 2: Optional footer text alignment**
- Use configurable domain label instead of fixed `duotrak.app`.

### Task 7: Validation

**Files:**
- N/A

**Step 1: Run targeted checks**
- `npx tsc --noEmit`

**Step 2: Summarize behavior changes and env vars**
- Document `NEXT_PUBLIC_APP_URL` and `RESEND_API_KEY` expectations.
