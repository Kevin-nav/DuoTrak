import { action } from "./_generated/server";
import { v } from "convex/values";

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
    handler: async (ctx, args) => {
        // Get the backend URL from environment variables
        const backendUrl = process.env.FASTAPI_URL || "https://localhost:8000";

        console.log("[Convex Action] Calling backend to generate onboarding plan:", args.goalTitle);

        try {
            const response = await fetch(`${backendUrl}/api/v1/goal-creation/onboarding/plan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    goalTitle: args.goalTitle,
                    goalDescription: args.goalDescription,
                    contextualAnswers: args.contextualAnswers || {},
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[Convex Action] Backend error:", response.status, errorText);
                throw new Error(`Backend returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log("[Convex Action] Successfully generated plan with", data.tasks?.length, "tasks");
            return data;
        } catch (error: any) {
            console.error("[Convex Action] Failed to generate onboarding plan:", error.message);
            throw new Error(`Failed to generate onboarding plan: ${error.message}`);
        }
    },
});
