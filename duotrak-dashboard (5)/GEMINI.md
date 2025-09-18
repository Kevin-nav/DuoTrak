# Project: DuoTrak Dashboard

## Project Overview

This is a Next.js web application that serves as a personal and social goal-tracking dashboard. The application is designed to help users build habits and achieve their goals with an accountability partner. It features a dashboard to track progress, streaks, and shared goals. A "mascot" provides motivational messages and feedback to the user.

**Key Technologies:**

*   **Framework:** Next.js
*   **Language:** TypeScript
*   **UI:** React, Tailwind CSS, Radix UI, Lucide React, shadcn/ui
*   **Animation:** Framer Motion

## Building and Running

To get the application running locally, follow these steps:

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    This will start the application on `http://localhost:3000`.

3.  **Build for Production:**
    ```bash
    npm run build
    ```

4.  **Start the Production Server:**
    ```bash
    npm run start
    ```

5.  **Lint the Code:**
    ```bash
    npm run lint
    ```

## Development Conventions

*   **Component-Based Architecture:** The application is built with React components, which are located in the `components` directory.
*   **Styling:** The application uses Tailwind CSS for styling, with custom themes and UI components from Radix UI and shadcn/ui. The `lib/utils.ts` file contains a utility function, `cn`, which is used to merge Tailwind CSS classes. The `components.json` file contains the configuration for the `shadcn/ui` components. The `tailwind.config.ts` file contains the configuration for Tailwind CSS, including the theme, colors, and plugins. The `postcss.config.mjs` file contains the configuration for PostCSS, which is used to transform CSS with JavaScript. The `app/globals.css` and `styles/globals.css` files contain the global styles for the application, including the color palette, themes, and utility classes.
*   **State Management:** The application uses a combination of React hooks and context for state management (e.g., `MascotProvider`, `InvitationProvider`).
*   **Hooks:** The application uses custom hooks to provide reusable functionality. The `hooks/use-toast.ts` file contains a custom hook that provides a simple way to display toast notifications. The `hooks/use-mobile.tsx` file contains a custom hook that checks if the user is on a mobile device. The `hooks/use-real-time-partner.ts` file contains a custom hook that simulates a real-time connection with a partner, providing updates on their presence, activity, and progress.
*   **File Structure:** The application follows the standard Next.js `app` directory structure.
*   **TypeScript Configuration:** The `tsconfig.json` file contains the configuration for the TypeScript compiler, including the libraries, paths, and other options. The `next-env.d.ts` file includes TypeScript type definitions for Next.js.
*   **Git Ignore:** The `.gitignore` file is used to ignore files and directories that should not be committed to the repository, such as dependencies, build output, and environment variables.
*   **Dashboard Layout:** The application uses a consistent dashboard layout, which is defined in the `components/dashboard-layout.tsx` file. The layout includes a sidebar for navigation and a top bar with a theme switcher and notification system.
*   **Mascot Interactions:** The application includes a "mascot" feature that provides interactive feedback to the user. The logic for these interactions can be found in the `hooks/use-mascot-interactions.ts` file. The `contexts/mascot-context.tsx` file manages the mascot's state, and the `types/mascot.ts` file defines the data structures for the mascot's appearance, behavior, and interactions. The `components/mascots/mascot-assets.tsx` file contains the React component that renders the mascot as an SVG, with different expressions and poses. The `components/mascots/contextual-mascot-renderer.tsx` file renders the mascot with different appearances and animations based on the interaction's context.
    *   **Mascot Types:** The mascot can be one of three types: "poko", "lumo", or "both".
    *   **Mascot Expressions and Poses:** The mascot has a variety of expressions (e.g., "happy", "celebratory") and poses (e.g., "standing", "high-five").
    *   **Interaction Display Logic:** When and how interactions are displayed.
    *   **Session Limits:** A maximum number of interactions per session.
    *   **Frequency Rules:** Rules for how often an interaction can be shown (e.g., once, daily, weekly).
    *   **User Preferences:** Users can disable the mascot, reduce motion, and set quiet hours.
    *   **Mascot's Role:** The mascot is used to:
        *   Welcome users to the app.
        *   Celebrate goal creation and completion.
        *   Encourage users to keep up their streaks.
        *   Provide motivational reminders.
        *   Remind users to rest.
        *   Invite users to take on new challenges.
*   **Goals Page:** The goals page is rendered using the `GoalsHome` component, which displays a list of personal and shared goals, with options to filter and search. It also includes functionality for creating, editing, and deleting goals.
*   **Landing Page:** The landing page is rendered using the `LandingPage` component, which displays a marketing page for the DuoTrak application, with sections for benefits, how it works, success stories, and a call to action to sign up.
*   **Onboarding Page:** The onboarding page is rendered using the `OnboardingFlow` component, which guides new users through the process of setting up their account, creating their first goal, and inviting a partner. The onboarding flow consists of the following steps:
    1.  **Welcome:** A welcome message to the user.
    2.  **Partner Invitation:** A form to invite a partner to the app.
    3.  **Goal Discovery:** A step to help the user discover goals.
    4.  **Goal Creation:** A form to create a new goal.
    5.  **Preferences:** A step to set user preferences.
    6.  **First Success:** A celebration of the user's first success.
*   **Progress Page:** The progress page is rendered using the `ProgressPage` and `XPSystem` components. It displays a variety of progress metrics, including an overall summary, activity heatmap, consistency chart, task breakdown chart, goal progress overview, and achievements. It also includes a date range filter and a toggle to compare progress with a partner.
*   **XP System:** The application includes an XP system to gamify the user experience. The `components/xp/xp-system.tsx` file contains the React component that displays the user's and their partner's XP, level, and progress. It also includes a leaderboard to compare their weekly and all-time XP.
*   **Profile Page:** The profile page is rendered using the `ProfileContent` component, which displays the user's profile information, including their username, email, bio, and stats. It also includes sections for theme settings, preferences, partner information, and a sign-out button.
*   **Partner Page:** The partner page is rendered using the `PartnerView` component, which displays a detailed view of the user's partner, including their tasks, activity feed, and a chat interface. It also includes features for sending nudges, quick replies, and reactions.
*   **Mascot Settings Page:** The mascot settings page is rendered using the `MascotSettingsPanel` component, which allows users to customize the mascot's behavior, including its frequency, personality, and the types of interactions it has.
*   **Waiting Room Page:** The waiting room page is rendered using the `InteractiveWaitingRoom` component, which displays a waiting screen for users who have invited a partner to the app. It also includes success tips, a goal draft feature, and a way to share the invitation link.
*   **Notifications Page:** The notifications page is rendered using the `NotificationCenter` component, which displays a list of notifications, with options to filter, search, and perform bulk actions.
*   **Middleware:** The application uses a Next.js middleware to handle authentication and authorization. It checks for a session cookie and redirects users to the appropriate page based on their authentication status and account status.
*   **Invitation Context:** The application uses a React context to manage the state of the invitation flow, including partner information, goal drafts, and the invitation token.
*   **Signup Page:** The signup page is rendered using the `SignupPage` component, which displays a signup form, with options for signing up with Google or with an email and password. It also handles invitation-based signups.
*   **Partnership Confirmation Page:** The partnership confirmation page is rendered using the `PartnershipConfirmationPage` component, which displays a confirmation message to users who have successfully partnered with someone on the app. It also includes a button to continue to the next step in the onboarding process.
*   **Invite Page:** The invite page is rendered using the `InvitationLanding` component, which displays an invitation to join a partnership on the app. It includes information about the inviter and the goal, and buttons to accept or decline the invitation.
*   **Goal Creation Page:** The goal creation page is rendered using the `EnhancedGoalCreationWizard` component, which guides users through the process of creating a new goal, with options to choose from templates or create a custom goal.
*   **Smart Notifications Page:** The smart notifications page is rendered using the `SmartNotificationsPage` component, which displays a tabbed interface for managing the smart notification system, including the notification engine, message templates, timing optimizer, and user pattern learning. The `components/notifications/smart-notification-engine.tsx` file contains the core logic for the smart notification engine, which simulates an AI-powered notification system, with features for smart timing, personalized messaging, and behavioral learning. The `components/notifications/message-template-system.tsx` file contains a React component that allows users to create, edit, and manage personalized notification templates.
