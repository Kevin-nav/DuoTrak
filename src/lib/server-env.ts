// src/lib/server-env.ts

/**
 * ==============================================================================
 * Typesafe Server-Side Environment Variables
 * ==============================================================================
 * This file provides a typesafe object that reads server-side environment
 * variables directly from `process.env`.
 *
 * VALIDATION:
 * The validation for these variables is now handled centrally in `next.config.mjs`.
 * By the time any application code runs, we can safely assume that these
 * variables are present and correctly formatted. This file's purpose is to
 * provide TypeScript intellisense and type safety.
 *
 * We cast to `string` because the validation in `next.config.mjs` guarantees
 * that these will be defined strings at runtime.
 * ==============================================================================
 */

console.log('--- [server-env.ts] Creating typesafe serverEnv object ---');

export const serverEnv = {
  FIREBASE_SERVICE_ACCOUNT_JSON_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH as string,
  INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET as string,
  FASTAPI_URL: process.env.FASTAPI_URL as string,
};

console.log('[server-env.ts] serverEnv object created. FIREBASE_SERVICE_ACCOUNT_JSON_PATH =', serverEnv.FIREBASE_SERVICE_ACCOUNT_JSON_PATH);
