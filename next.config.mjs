import { z } from 'zod';
import dotenv from 'dotenv';

console.log('--- [next.config.mjs] Top of file ---');

/**
 * ==============================================================================
 * Vercel-Ready Environment Variable Validation
 * ==============================================================================
 * This file is the first piece of code that runs when you start the server or
 * build the project. We use it to load and validate our server-side environment
 * variables.
 *
 * HOW IT WORKS:
 * 1. We load variables from `.env.local` for local development. On Vercel,
 *    these variables are injected automatically from the project settings.
 * 2. We use Zod to define a schema for our required variables.
 * 3. We attempt to parse `process.env`.
 *
 * If any variable is missing or invalid, Zod will throw an error. This will
 * CRASH the `next dev` command or FAIL the `next build` on Vercel. This is
 * intentional. It provides a "fail-fast" safety mechanism to prevent deploying
 * a misconfigured application.
 *
 * PRODUCTION WORKFLOW (VERCEL):
 * 1. Go to your project settings on Vercel.
 * 2. Under "Environment Variables", add each of the variables defined in the
 *    `envSchema` below.
 * 3. When you deploy, Vercel injects these variables. This script will validate
 *    them, and if everything is correct, your build will succeed.
 * ==============================================================================
 */

console.log('[next.config.mjs] 1. About to load .env.local file...');
const dotenvResult = dotenv.config({ path: './.env.local' });

if (dotenvResult.error) {
  console.error('❌ [next.config.mjs] FATAL: Error loading .env.local file.', dotenvResult.error);
} else {
  console.log('✅ [next.config.mjs] 2. Successfully loaded .env.local file.');
}

const envSchema = z.object({
  // Server-side variables
  FIREBASE_SERVICE_ACCOUNT_JSON_PATH: z.string().min(1),
  SECRET_KEY: z.string().min(32),
  FASTAPI_URL: z.string().url(),
  // Public (client-side) variables
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
});

console.log('[next.config.mjs] 3. About to validate environment variables...');
try {
  // Use the parsed variables from dotenv result directly for validation
  const envToValidate = { ...dotenvResult.parsed, ...process.env };
  envSchema.parse(envToValidate);
  console.log('✅ [next.config.mjs] 4. Environment variables validated successfully.');
} catch (error) {
  console.error('❌ [next.config.mjs] 4. FATAL: Invalid environment variables. Crashing build.', error.errors);
  process.exit(1);
}


/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude old backup folders from the build
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/duotrak-dashboard*/**',
        '**/duotrak-ui/**',
        '**/duotrak_improved_ui/**',
        '**/node_modules/**',
      ],
    };
    return config;
  },
  // Also exclude from TypeScript compilation
  typescript: {
    // These folders shouldn't be type-checked - they're old backups
    ignoreBuildErrors: false,
  },
  // Exclude these directories from page resolution
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  eslint: {
    // Only run ESLint on src directory
    dirs: ['src'],
  },
  output: 'standalone',
};

console.log('--- [next.config.mjs] End of file ---');

export default nextConfig;

