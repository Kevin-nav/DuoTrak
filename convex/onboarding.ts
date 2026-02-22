import { action } from "./_generated/server";
import { v } from "convex/values";
import { getInternalApiHeaders, postGoalCreation, postGoalCreationRaw } from "./goalCreation";

/**
 * Convex action to generate an onboarding plan by calling the FastAPI backend.
 * Actions can make HTTP calls to external services.
 */
export const generatePlan = action({
    args: {
        goalTitle: v.string(),
        goalDescription: v.string(),
        contextualAnswers: v.optional(v.record(v.string(), v.string())),
    },
    handler: async (_ctx, args) => {
        try {
            const data = await postGoalCreationRaw<any>("/api/v1/goal-creation/onboarding/plan", {
                goalTitle: args.goalTitle,
                goalDescription: args.goalDescription,
                contextualAnswers: args.contextualAnswers || {},
            });
            console.log("[Convex Action] Successfully generated plan with", data.tasks?.length, "tasks");
            return data;
        } catch (error: any) {
            console.error("[Convex Action] Failed to generate onboarding plan:", error.message);
            throw new Error(`Failed to generate onboarding plan: ${error.message}`);
        }
    },
});

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
