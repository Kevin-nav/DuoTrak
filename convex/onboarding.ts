import { action } from "./_generated/server";
import { v } from "convex/values";
import { postGoalCreationRaw } from "./goalCreation";

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
