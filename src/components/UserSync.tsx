"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/app/ConvexClientProvider"; // Import the useAuth hook from the provider file or where it is defined

export function UserSync() {
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.store);
  const { fetchAccessToken } = useAuth();

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

  return null;
}
