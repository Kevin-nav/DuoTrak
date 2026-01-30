"use client";

import { ReactNode, useEffect, useState, useMemo } from "react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { getAuth, onIdTokenChanged, User } from "firebase/auth";
import { app } from "@/lib/firebase";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAccessToken = useMemo(() => {
    return async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (!user) return null;
      return await user.getIdToken(forceRefreshToken);
    };
  }, [user]);

  return {
    isLoading,
    isAuthenticated: !!user,
    fetchAccessToken,
  };
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}
