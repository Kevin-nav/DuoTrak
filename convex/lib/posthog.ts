type ConvexEventPayload<T extends Record<string, unknown>> = {
  event: string;
  distinct_id: string;
  properties: { source: string } & T;
  timestamp: string;
};

export function buildConvexEvent<T extends Record<string, unknown> = Record<string, never>>(
  event: string,
  distinctId: string,
  properties: T = {} as T,
): ConvexEventPayload<T> {
  return {
    event,
    distinct_id: distinctId,
    properties: {
      source: "convex",
      ...properties,
    } as { source: string } & T,
    timestamp: new Date().toISOString(),
  };
}
