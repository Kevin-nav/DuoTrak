"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

export function UserSync() {
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.store);
  const heartbeat = useMutation((api as any).chat.heartbeat);
  const [isUserSynced, setIsUserSynced] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      if (!isAuthenticated) {
        setIsUserSynced(false);
        return;
      }

      const { getAuth } = await import("firebase/auth");
      const { app } = await import("@/lib/firebase");
      const auth = getAuth(app);

      for (let attempt = 0; attempt < 6 && !cancelled; attempt += 1) {
        const user = auth.currentUser;
        if (user?.email) {
          await storeUser({ email: user.email });
          if (!cancelled) {
            setIsUserSynced(true);
          }
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!cancelled) {
        console.error("UserSync: authenticated but Firebase user/email not ready.");
        setIsUserSynced(false);
      }
    }

    sync().catch((error) => {
      if (!cancelled) {
        console.error("UserSync failed:", error);
        setIsUserSynced(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, storeUser]);

  useEffect(() => {
    if (!isAuthenticated || !isUserSynced) {
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
  }, [isAuthenticated, isUserSynced, heartbeat]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsUserSynced(false);
    }
  }, [isAuthenticated]);

  return null;
}
