# Phase 0: Research & Discovery

## 1. Feature Analysis

The core requirement is to build an enhanced user onboarding flow for DuoTrak. This flow will be a multi-step process to guide new users through profile setup, partner invitation, and a brief introduction to the application's main features. The primary goal is to improve user engagement and ensure a smooth initial experience.

- **User Stories:**
  - New users need a quick and clear setup process.
  - Users want to personalize their profiles (name, avatar).
  - Users should be prompted to invite their partner early.
  - Users need a basic tour of core features (creating goals/tasks).

- **Functional Requirements:**
  - A multi-step form including: Welcome/Profile, Partner Invitation, Feature Intro, and Completion.
  - Optional profile picture upload with a default avatar fallback.
  - Secure partner invitation via email with a unique link.
  - A dismissible, visual guide to core functionalities.

- **Non-Functional Requirements:**
  - The flow must be performant, secure, and accessible (WCAG 2.1 AA).
  - The implementation should be extensible for future additions.

## 2. Constitutional Alignment

The project constitution at `.specify/memory/constitution.md` is currently a template with placeholder values. It does not contain concrete principles or constraints to align with at this time. The implementation should proceed following standard best practices for web development until the constitution is ratified.

## 3. Technical Investigation & Proposed Solutions

This investigation is based on the existing tech stack: Next.js, TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod, and a FastAPI backend.

### 3.1. Theming Strategy

Per the user's request, a new theme based on the project mascots needs to be implemented, including a better dark mode.

- **Action:** Define a new color palette in `tailwind.config.ts` using CSS variables, as is standard with shadcn/ui.
- **Implementation:**
  - Create separate color definitions for `light` and `dark` modes.
  - The colors will be derived from the mascot's design document (`@mascot.md`). This file needs to be located to extract the color hex codes.
  - The theme will be applied globally in the main layout file. We will replace the existing theme with this new, more vibrant one.

### 3.2. UI Component Strategy

The onboarding flow will be a series of views managed by a parent component.

- **Structure:** A stateful parent component will manage the current step (`'profile'`, `'invitation'`, `'tour'`, `'completion'`).
- **Components (from shadcn/ui):**
  - `Card`: To frame the content of each step.
  - `Input`: For text fields like name and email.
  - `Button`: For navigation (Next, Skip, Finish).
  - `Avatar`: To display the user's profile picture or a default.
  - `Dialog` or a third-party library for the feature tour.
- **Stepper:** A simple stepper component can be built using basic `div`s and `span`s to indicate progress through the flow.

### 3.3. Form & Validation Strategy

React Hook Form and Zod are already in use and are well-suited for this feature.

- **Action:** Create a Zod schema for each step of the form that requires validation.
  - **Profile Step:** `z.object({ firstName: z.string().min(1), lastName: z.string().min(1), avatar: z.any().optional() })`
  - **Invitation Step:** `z.object({ email: z.string().email() })`
- **Implementation:** Use the `useForm` hook with the corresponding Zod resolver to manage form state and validation.

### 3.4. API & Backend Strategy

The backend needs to support the partner invitation and update the user's status upon onboarding completion.

- **New Endpoint:** A new API endpoint, `POST /api/v1/invitations`, will be required.
  - **Request:** `{ "email": "partner@example.com" }`
  - **Response:** `{ "status": "success" }`
- **User Status:** The `users` table in the database likely has a status field (e.g., `AWAITING_ONBOARDING`, `ACTIVE`). The backend will need a new endpoint, `PUT /api/v1/users/me/complete-onboarding`, that the frontend calls upon completion. This will update the user's status to `ACTIVE`.

### 3.5. Feature Tour Implementation

- **Option 1 (Recommended):** Use a library like `react-joyride` or `shepherd.js`. These are powerful tools for creating guided tours and are relatively easy to integrate.
- **Option 2:** Build a custom solution using `shadcn/ui`'s `Dialog` or `Carousel` components. This offers more design control but requires more implementation effort.

## 4. Open Questions & Risks

- **Mascot Colors:** The exact color palette from the mascot guide (`@mascot.md`) needs to be located and extracted.
- **Feature Tour Content:** The specific text, images, and flow for the feature tour need to be defined.
- **Constitution:** The lack of a defined constitution means development will rely on convention rather than explicit project principles.
