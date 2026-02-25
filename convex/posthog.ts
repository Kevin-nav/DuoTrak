import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { buildConvexEvent } from "./lib/posthog";

export const capture = internalAction({
  args: {
    event: v.string(),
    distinctId: v.string(),
    properties: v.optional(v.any()),
  },
  handler: async (_ctx, args) => {
    const posthogApiKey = process.env.POSTHOG_API_KEY;
    const posthogHost = process.env.POSTHOG_HOST || "https://us.i.posthog.com";
    if (!posthogApiKey) return { ok: false, skipped: true };

    const payload = {
      api_key: posthogApiKey,
      ...buildConvexEvent(args.event, args.distinctId, args.properties ?? {}),
    };

    try {
      const response = await fetch(`${posthogHost}/capture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const message = await response.text();
        return { ok: false, error: message };
      }
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

