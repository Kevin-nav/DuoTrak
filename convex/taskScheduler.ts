import { internalMutation } from "./_generated/server";

/**
 * Generate daily task instances for all active goals.
 * Runs via cron at midnight UTC.
 */
export const generateDailyInstances = internalMutation({
    handler: async (ctx) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTs = today.getTime();
        const dow = today
            .toLocaleDateString("en-US", { weekday: "short" })
            .toLowerCase();

        // Get all non-archived goals
        const allGoals = await ctx.db.query("goals").collect();
        const activeGoals = allGoals.filter((g) => !g.is_archived);

        let totalCreated = 0;

        for (const goal of activeGoals) {
            const tasks = await ctx.db
                .query("tasks")
                .withIndex("by_goal", (q) => q.eq("goal_id", goal._id))
                .collect();

            // Prefer template tasks; fall back to all tasks for backward compat
            const templateTasks = tasks.filter((t) => t.is_template_task === true);
            const tasksToSchedule = templateTasks.length > 0 ? templateTasks : tasks;

            for (const task of tasksToSchedule) {
                // Skip if instance already exists
                const existing = await ctx.db
                    .query("task_instances")
                    .withIndex("by_task_date", (q) =>
                        q.eq("task_id", task._id).eq("instance_date", todayTs)
                    )
                    .first();

                if (existing) continue;

                // Check cadence
                const cadenceType = task.cadence_type || "daily";
                const cadenceDays = task.cadence_days || [];

                let shouldRun = false;
                if (cadenceType === "daily") {
                    shouldRun = true;
                } else if (
                    (cadenceType === "weekly" || cadenceType === "custom") &&
                    cadenceDays.length > 0
                ) {
                    shouldRun = cadenceDays.includes(dow);
                } else {
                    // Fallback to repeat_frequency string
                    const freq = (task.repeat_frequency || "daily").toLowerCase();
                    shouldRun = freq === "daily" || freq.includes("weekday")
                        ? !["sat", "sun"].includes(dow)
                        : true;
                }

                // Check duration limit
                if (shouldRun && task.cadence_duration_weeks) {
                    const weeksSinceCreation = Math.floor(
                        (todayTs - goal.updated_at) / (7 * 24 * 60 * 60 * 1000)
                    );
                    if (weeksSinceCreation >= task.cadence_duration_weeks) {
                        shouldRun = false;
                    }
                }

                if (shouldRun) {
                    await ctx.db.insert("task_instances", {
                        task_id: task._id,
                        goal_id: goal._id,
                        user_id: goal.user_id,
                        instance_date: todayTs,
                        status: "pending",
                        created_at: Date.now(),
                        updated_at: Date.now(),
                    });
                    totalCreated++;
                }
            }
        }

        console.log(
            `[TaskScheduler] Generated ${totalCreated} task instances for ${activeGoals.length} active goals`
        );
    },
});
