"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";

export function UserSync() {
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.store);
  const heartbeat = useMutation((api as any).chat.heartbeat);

  useEffect(() => {
    async function sync() {
      if (isAuthenticated) {
        // We need the email to store it. 
        // In a real app, we might get this from the ID token claims or a separate Firebase call.
        // For now, let's assume the mutation handles extraction from the identity, 
        // BUT my mutation args require `email`.
        // The `useAuth` hook from Convex doesn't give me the user object directly.
        // I need to get the user from Firebase Auth to get the email.
        
        // Let's use the firebase auth directly here or pass it down.
        // Importing `getAuth` here is fine.
        const { getAuth } = await import("firebase/auth");
        const { app } = await import("@/lib/firebase");
        const auth = getAuth(app);
        const user = auth.currentUser;
        
        if (user && user.email) {
          await storeUser({ email: user.email });
        }
      }
    }

    sync();
  }, [isAuthenticated, storeUser]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const sendHeartbeat = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      heartbeat({}).catch((error: unknown) => {
        console.error("Failed to send app heartbeat:", error);
      });
    };

    sendHeartbeat();
    const intervalId = window.setInterval(sendHeartbeat, 30_000);
    window.addEventListener("focus", sendHeartbeat);
    window.addEventListener("online", sendHeartbeat);
    document.addEventListener("visibilitychange", sendHeartbeat);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", sendHeartbeat);
      window.removeEventListener("online", sendHeartbeat);
      document.removeEventListener("visibilitychange", sendHeartbeat);
    };
  }, [isAuthenticated, heartbeat]);

  return null;
}
