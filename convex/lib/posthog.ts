export function buildConvexEvent(
  event: string,
  distinctId: string,
  properties: Record<string, unknown> = {},
) {
  return {
    event,
    distinct_id: distinctId,
    properties: {
      source: "convex",
      ...properties,
    },
    timestamp: new Date().toISOString(),
  };
}

