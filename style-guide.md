### The DuoTrak Application Style Guide

**Design Philosophy:** The DuoTrak interface is designed to be clean, encouraging, and highly interactive. It uses a modern, friendly aesthetic with a foundation of soft neutrals and a vibrant, motivating primary blue. The goal is to make the process of building habits feel intuitive, responsive, and rewarding, with Duolingo-style animations that provide delightful feedback to the user.

---

#### 1. Color Palette

This palette is designed for a clean and accessible light theme.

| Role                  | Color Name          | Hex Code    | Tailwind Utility                  | Usage                                                               |
| --------------------- | ------------------- | ----------- | --------------------------------- | ------------------------------------------------------------------- |
| **Primary Action**    | Primary Blue        | `#19A1E5`   | `bg-blue-500`, `text-blue-500`    | Primary buttons, active links, progress bars, key icons.            |
| **Primary Hover**     | Primary Blue (Hover) | `#1590D3`   | `hover:bg-blue-600`               | Hover state for primary buttons.                                    |
| **Accent Background** | Accent Light Blue   | `#E6F4FD`   | `bg-blue-50`                      | Subtle backgrounds for icons or highlighted sections.               |
| **Primary Text**      | Charcoal            | `#111518`   | `text-gray-900`                   | All primary text, headings, and bold labels.                        |
| **Secondary Text**    | Stone Gray          | `#637C88`   | `text-gray-500`                   | Sub-headings, placeholder text, inactive navigation links.          |
| **Subtle Surface**    | Pearl Gray          | `#F0F3F4`   | `bg-gray-100`                     | Input fields, secondary buttons, icon backgrounds.                  |
| **Border / Divider**  | Cool Gray           | `#DCE2E5`   | `border-gray-200`                 | Borders on cards, dividers, input field borders.                    |
| **Main Background**   | Off-White           | `#FAFBFB`   | `bg-gray-50`                      | The main background color for the dashboard and other app pages.    |
| **Pure White**        | White               | `#FFFFFF`   | `bg-white`                        | Card backgrounds, modal backgrounds, headers.                       |
| **Error State**       | Error Red           | `#EF4444`   | `bg-red-500`, `text-red-500`      | Error messages and borders on invalid form fields.                  |

---

#### 2. Typography

*   **Primary Font:** `Plus Jakarta Sans` (used for all UI text).
*   **Fallback Font:** `Noto Sans`.

| Element                | Font Size   | Font Weight | Color          | Example Tailwind Classes                       |
| ---------------------- | ----------- | ----------- | -------------- | ---------------------------------------------- |
| **Page Headers (H1/H2)** | `text-2xl`  | **Bold**    | Charcoal       | `text-2xl font-bold text-gray-900`             |
| **Sub-Headings (H3)**  | `text-lg`   | **Bold**    | Charcoal       | `text-lg font-bold text-gray-900`              |
| **Body Paragraphs**    | `text-base` | Normal      | Stone Gray     | `text-base font-normal text-gray-500`          |
| **Card Titles**        | `text-base` | **Semibold**  | Charcoal       | `text-base font-semibold text-gray-900`        |
| **Button Text**        | `text-sm`   | **Bold**    | White/Charcoal | `text-sm font-bold`                            |
| **Navigation Text**    | `text-xs`   | **Bold**    | Charcoal       | `text-xs font-bold` (for active bottom nav)    |
| **Input Text**         | `text-base` | Normal      | Charcoal       | `text-base font-normal text-gray-900`          |

---

#### 3. Component Styling

**Buttons:**
*   **Primary Button:**
    *   **Style:** `rounded-full`, `h-12`, `px-6`, `bg-blue-500`, `text-white`, `text-base`, `font-bold`.
    *   **Interaction:** `hover:bg-blue-600`, `active:scale-95`, `transition-all`, `duration-200`.
*   **Secondary/Subtle Button:**
    *   **Style:** `rounded-full`, `h-12`, `px-6`, `bg-gray-100`, `text-gray-900`, `text-base`, `font-bold`.
    *   **Interaction:** `hover:bg-gray-200`, `active:scale-95`, `transition-colors`.

**Form Inputs:**
*   **Style:** `rounded-xl`, `h-14`, `bg-gray-100`, `border-transparent`.
*   **Interaction:** On focus, a blue ring appears: `focus:ring-2`, `focus:ring-blue-500/50`.
*   **Error State:** A red border is applied: `border-red-500`.

**Cards:**
*   **Style:** `rounded-xl`, `bg-white`, `p-4`, `shadow-sm`.
*   **Interaction:** Can have a subtle hover effect like `hover:shadow-md`.

**Navigation Bars (Top & Bottom):**
*   **Style:** `sticky`, `bg-white/80`, `backdrop-blur-sm`, `border-gray-200`.
*   **Active Link (Bottom Nav):** `border-t-2 border-gray-900`, `text-gray-900`.
*   **Inactive Link (Bottom Nav):** `border-t-2 border-transparent`, `text-gray-500`, `hover:text-gray-900`.

---

#### 4. Layout & Spacing

*   **Grid System:** The layout is built on a standard `4px` grid system, where Tailwind's spacing utilities (`p-4`, `gap-3`, etc.) are used consistently.
*   **Sticky Navigation:** The top and bottom navigation bars are fixed to the viewport, while the main content area scrolls independently. Padding is added to the bottom of the main content (`pb-24`) to prevent the bottom bar from obscuring content.
*   **Responsive Design:** Layouts use a mobile-first approach. Two-column layouts on desktop (`md:grid-cols-2`) stack into a single column on smaller screens.

---

#### 5. Animation & Motion (The "Duolingo Style")

This is the core of the app's engaging feel. All animations should be subtle and purposeful.

*   **`fadeInUp`:** The primary entrance animation for most elements.
    *   **Use Case:** Page titles, text content, task cards.
    *   **CSS:** `@keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }`
*   **`scaleIn`:** A gentle scaling animation for larger cards or containers.
    *   **Use Case:** The Streak Card, Verification Queue Card.
    *   **CSS:** `@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`
*   **`shake`:** An error feedback animation.
    *   **Use Case:** Applied to form inputs upon validation failure.
    *   **CSS:** `@keyframes shake { 10%, 90% { transform: translateX(-1px); } ... }`
*   **Staggered Animations:** When multiple items appear (like the task list), they should not animate in all at once. Apply increasing `animation-delay` utilities (`delay-100`, `delay-200`, etc.) to each item to create a beautiful, cascading effect.
*   **Microinteractions:**
    *   **Button Press:** Buttons should visually react to being pressed using `active:scale-95`.
    *   **Hover States:** All interactive elements must have a clear hover state (e.g., color change, shadow increase) with a smooth `transition-colors` or `transition-all`.