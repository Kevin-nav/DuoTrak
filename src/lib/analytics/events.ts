"use client";

import { capturePosthogEvent, identifyPosthogUser } from "@/lib/analytics/posthog-client";

export type AnalyticsProps = Record<string, unknown>;

export function buildEventPayload(
  event: string,
  properties: AnalyticsProps = {},
) {
  return {
    event,
    properties: {
      platform: "web",
      ...properties,
    },
  };
}

export function trackEvent(event: string, properties: AnalyticsProps = {}) {
  const payload = buildEventPayload(event, properties);
  return capturePosthogEvent(payload.event, payload.properties);
}

export function identifyUser(userId: string) {
  return identifyPosthogUser(userId);
}

