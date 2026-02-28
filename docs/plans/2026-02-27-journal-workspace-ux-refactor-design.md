# Design Document - Journal Workspace UX Refactor

## 1. Problem Statement
The current Journal page is a long, vertical stack that creates information overload. Workspace pages, calendar, and entries compete for the same space, making the interface feel cluttered and less like a professional "workspace."

## 2. Goals
- **Desktop:** Transition to a 3-column "Workspace" layout (Sidebar, Feed, Activity/Calendar).
- **Mobile:** Simplify the view using drawers and a Floating Action Button (FAB).
- **Identity:** Use visual cues (colors/icons) to clearly distinguish between Private and Shared spaces.
- **Utility:** Lay the groundwork for a more expressive writing experience (Rich Text).

## 3. Proposed Layout Changes
### Desktop (3-Column)
1. **Left Sidebar (20-25%):**
   - Space Switcher (Shared vs. Private).
   - Workspace Pages list (collapsible).
   - Tag Explorer.
2. **Center Column (50-60%):**
   - The Journal Feed (Entries).
   - Composer at the top or in a modal.
3. **Right Sidebar (20-25%):**
   - Mini-Calendar (Monthly view).
   - Duo Pulse (Recent reactions/comments from partner).

### Mobile
- **Header:** Simple title + Space switcher.
- **Drawer (Bottom):** Calendar and Workspace Pages accessible via buttons in the header.
- **Feed:** Full-width entries.
- **FAB:** A prominent "+" button at the bottom-right for creating a new entry.

## 4. Visual Identity
- **Shared Space:** Uses `landing-terracotta` accents and "Users" icon.
- **Private Space:** Uses `landing-espresso` or a new "soft blue/teal" accent and "Lock" icon.
- **Typography:** Increase spacing and use a slightly more "editorial" feel for long-form entries.

## 5. Technical Stack
- **Layout:** `react-resizable-panels` for desktop sidebars.
- **Mobile Drawers:** `vaul`.
- **Animations:** `framer-motion` for smooth layout transitions.
- **State:** React local state for layout visibility; Convex for data.
