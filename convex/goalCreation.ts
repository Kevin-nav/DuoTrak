import { action } from "./_generated/server";
import { v } from "convex/values";

type JsonRecord = Record<string, unknown>;
type RequestHeaders = Record<string, string>;

const DEFAULT_BACKEND_URL = "http://localhost:8000";

const toSnakeCase = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(toSnakeCase);
  }
  if (value !== null && typeof value === "object" && value.constructor === Object) {
    return Object.entries(value as JsonRecord).reduce<JsonRecord>((acc, [key, nestedValue]) => {
      const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      acc[snakeKey] = toSnakeCase(nestedValue);
      return acc;
    }, {});
  }
  return value;
};

const toCamelCase = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(toCamelCase);
  }
  if (value !== null && typeof value === "object" && value.constructor === Object) {
    return Object.entries(value as JsonRecord).reduce<JsonRecord>((acc, [key, nestedValue]) => {
      const camelKey = key.replace(/(_\w)/g, (match) => match[1].toUpperCase());
      acc[camelKey] = toCamelCase(nestedValue);
      return acc;
    }, {});
  }
  return value;
};

const getBackendUrl = () => process.env.FASTAPI_URL || DEFAULT_BACKEND_URL;

export const postGoalCreation = async <TResponse>(
  endpoint: string,
  payload: JsonRecord,
  options?: { headers?: RequestHeaders },
): Promise<TResponse> => {
  const response = await fetch(`${getBackendUrl()}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    body: JSON.stringify(toSnakeCase(payload)),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend returned ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as unknown;
  return toCamelCase(data) as TResponse;
};

export const postGoalCreationRaw = async <TResponse>(
  endpoint: string,
  payload: JsonRecord,
  options?: { headers?: RequestHeaders },
): Promise<TResponse> => {
  const response = await fetch(`${getBackendUrl()}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend returned ${response.status}: ${errorText}`);
  }

  return (await response.json()) as TResponse;
};

export const getInternalApiHeaders = (): RequestHeaders => {
  const internalApiSecret = process.env.INTERNAL_API_SECRET;
  if (!internalApiSecret) {
    throw new Error("INTERNAL_API_SECRET is required for Convex -> backend calls.");
  }
  return { "X-Internal-API-Key": internalApiSecret };
};

/**
 * V3 goal creation - Phase 1
 */
export const getStrategicQuestions = action({
  args: {
    userId: v.string(),
    wizardData: v.object({
      goalDescription: v.string(),
      motivation: v.string(),
      availability: v.array(v.string()),
      timeCommitment: v.string(),
      accountabilityType: v.string(),
      partnerName: v.optional(v.union(v.string(), v.null())),
      targetDeadline: v.optional(v.union(v.string(), v.null())),
      preferredCheckInStyle: v.optional(
        v.union(v.literal("quick_text"), v.literal("photo_recap"), v.literal("voice_note"))
      ),
    }),
  },
  handler: async (_ctx, args) => {
    try {
      return await postGoalCreation<any>(
        "/api/v1/goal-creation/questions",
        args as unknown as Record<string, unknown>,
        { headers: getInternalApiHeaders() }
      );
    } catch (error: any) {
      console.error("[Convex Action] Failed to fetch strategic questions:", error.message);
      throw new Error(`Failed to fetch strategic questions: ${error.message}`);
    }
  },
});

/**
 * V3 goal creation - Phase 2
 */
export const createGoalPlan = action({
  args: {
    sessionId: v.string(),
    userId: v.string(),
    answers: v.record(v.string(), v.string()),
  },
  handler: async (_ctx, args) => {
    try {
      return await postGoalCreation<any>(
        `/api/v1/goal-creation/${args.sessionId}/plan`,
        {
          userId: args.userId,
          answers: args.answers,
        },
        { headers: getInternalApiHeaders() }
      );
    } catch (error: any) {
      console.error("[Convex Action] Failed to create goal plan:", error.message);
      throw new Error(`Failed to create goal plan: ${error.message}`);
    }
  },
});

/**
 * Dev-only plan evaluation hook
 */
export const evaluateGoalPlan = action({
  args: {
    plan: v.any(),
  },
  handler: async (_ctx, args) => {
    try {
      await postGoalCreation<void>("/api/v1/goal-creation/evaluate-plan", {
        ...args.plan,
      });
    } catch (error: any) {
      console.error("[Convex Action] Failed to evaluate goal plan:", error.message);
      throw new Error(`Failed to evaluate goal plan: ${error.message}`);
    }
  },
});
