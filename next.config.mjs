import { z } from "zod";
import dotenv from "dotenv";

/**
 * Load local env values when present.
 * In CI/prod, env vars may be injected by the runtime, so missing .env.local
 * should not fail startup.
 */
const dotenvResult = dotenv.config({ path: "./.env.local" });
if (dotenvResult.error && dotenvResult.error.code !== "ENOENT") {
  console.warn("[next.config.mjs] dotenv load warning:", dotenvResult.error.message);
}

const envSchema = z.object({
  FIREBASE_SERVICE_ACCOUNT_JSON_PATH: z.string().min(1),
  SECRET_KEY: z.string().min(32),
  FASTAPI_URL: z.string().url(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
});

try {
  const envToValidate = { ...dotenvResult.parsed, ...process.env };
  envSchema.parse(envToValidate);
} catch (error) {
  console.error("[next.config.mjs] Invalid environment variables:", error.errors);
  process.exit(1);
}

/** @type {import("next").NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        "**/duotrak-dashboard*/**",
        "**/duotrak-ui/**",
        "**/duotrak_improved_ui/**",
        "**/node_modules/**",
      ],
    };
    return config;
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  pageExtensions: ["tsx", "ts", "jsx", "js"],
  eslint: {
    dirs: ["src"],
  },
  output: "standalone",
};

export default nextConfig;
