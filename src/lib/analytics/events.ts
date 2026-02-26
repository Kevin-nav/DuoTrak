"use client";

import { capturePosthogEvent, identifyPosthogUser } from "@/lib/analytics/posthog-client";

export type AnalyticsProps = Record<string, unknown>;

type EventPayload<T extends AnalyticsProps> = {
  event: string;
  properties: { platform: string } & T;
};

export function buildEventPayload<T extends AnalyticsProps = Record<string, never>>(
  event: string,
  properties: T = {} as T,
): EventPayload<T> {
  return {
    event,
    properties: {
      platform: "web",
      ...properties,
    } as { platform: string } & T,
  };
}

export function trackEvent(event: string, properties: AnalyticsProps = {}) {
  const payload = buildEventPayload(event, properties);
  return capturePosthogEvent(payload.event, payload.properties);
}

export function identifyUser(userId: string) {
  return identifyPosthogUser(userId);
}
