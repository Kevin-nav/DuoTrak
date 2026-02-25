import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

type CostEvent = {
  goalId: string;
  costUsd: number;
};

export function aggregateGoalCost(events: CostEvent[]) {
  return events.reduce<Record<string, number>>((acc, event) => {
    acc[event.goalId] = (acc[event.goalId] ?? 0) + event.costUsd;
    return acc;
  }, {});
}

export const recordLlmCall = internalMutation({
  args: {
    goal_id: v.optional(v.string()),
    user_id: v.optional(v.id("users")),
    provider: v.string(),
    model: v.string(),
    workflow_stage: v.optional(v.string()),
    request_id: v.optional(v.string()),
    input_tokens: v.number(),
    output_tokens: v.number(),
    latency_ms: v.number(),
    cost_usd: v.number(),
    success: v.boolean(),
    error_type: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("llm_cost_events", {
      goal_id: args.goal_id,
      user_id: args.user_id,
      provider: args.provider,
      model: args.model,
      workflow_stage: args.workflow_stage,
      request_id: args.request_id,
      input_tokens: args.input_tokens,
      output_tokens: args.output_tokens,
      latency_ms: args.latency_ms,
      cost_usd: args.cost_usd,
      success: args.success,
      error_type: args.error_type,
      source: args.source ?? "backend",
      created_at: now,
      updated_at: now,
    });
  },
});

export const recordGoalPlanSummary = internalMutation({
  args: {
    goal_id: v.string(),
    user_id: v.optional(v.id("users")),
    provider: v.string(),
    model: v.string(),
    total_input_tokens: v.number(),
    total_output_tokens: v.number(),
    total_latency_ms: v.number(),
    total_cost_usd: v.number(),
    request_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return ctx.db.insert("llm_cost_events", {
      goal_id: args.goal_id,
      user_id: args.user_id,
      provider: args.provider,
      model: args.model,
      workflow_stage: "goal_plan_summary",
      request_id: args.request_id,
      input_tokens: args.total_input_tokens,
      output_tokens: args.total_output_tokens,
      latency_ms: args.total_latency_ms,
      cost_usd: args.total_cost_usd,
      success: true,
      source: "backend",
      created_at: now,
      updated_at: now,
    });
  },
});

export const getGoalCostSummary = query({
  args: { goal_id: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("llm_cost_events")
      .withIndex("by_goal_created", (q) => q.eq("goal_id", args.goal_id))
      .collect();

    return rows.reduce(
      (acc, row) => {
        acc.total_cost_usd += row.cost_usd;
        acc.total_input_tokens += row.input_tokens;
        acc.total_output_tokens += row.output_tokens;
        acc.call_count += 1;
        return acc;
      },
      {
        goal_id: args.goal_id,
        total_cost_usd: 0,
        total_input_tokens: 0,
        total_output_tokens: 0,
        call_count: 0,
      },
    );
  },
});

