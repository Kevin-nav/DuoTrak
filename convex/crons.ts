import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.cron(
  "daily-notification-sweep",
  "0 13 * * *",
  (internal as any).notifications.runDailyReminderSweep,
  {}
);

crons.cron(
  "weekly-summary-sweep",
  "0 14 * * 1",
  (internal as any).notifications.runWeeklySummarySweep,
  {}
);

crons.cron(
  "chat-notification-cleanup",
  "0 * * * *",
  (internal as any).notifications.runChatNotificationCleanup,
  {}
);

crons.cron(
  "hourly-task-maintenance",
  "5 * * * *",
  internal.taskInstances.runHourlyMaintenance,
  {}
);

crons.cron(
  "hourly-shared-streak-nudges",
  "20 * * * *",
  (internal as any).notifications.runSharedStreakNudgeSweep,
  {}
);

export default crons;
