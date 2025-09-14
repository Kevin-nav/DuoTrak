'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './theme/theme-provider';

// Define a type for the error object to satisfy TypeScript
interface ApiError extends Error {
  status?: number;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes, reducing unnecessary refetches.
      staleTime: 1000 * 60 * 5,
      // Data is kept in the cache for 10 minutes after it becomes inactive.
      cacheTime: 1000 * 60 * 10,
      // Disable refetching when the window regains focus, which is often not needed for auth state.
      refetchOnWindowFocus: false,
      // Retry failed queries up to 2 times, but not for authentication errors.
      retry: (failureCount, error) => {
        const apiError = error as ApiError;
        // Do not retry if the error is a 401 (Unauthorized) or 404 (Not Found).
        if (apiError.status === 401 || apiError.status === 404) {
          return false;
        }
        // Otherwise, retry up to 2 times.
        return failureCount < 2;
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}
