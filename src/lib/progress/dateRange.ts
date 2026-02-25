import type { DatePreset } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function getRangeFromPreset(preset: DatePreset, now = Date.now()): { startDate: number; endDate: number } {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  const start = new Date(end.getTime() - (days - 1) * DAY_MS);
  start.setHours(0, 0, 0, 0);

  return {
    startDate: start.getTime(),
    endDate: end.getTime(),
  };
}

export function normalizeDateRange(input: { startDate: number; endDate: number }): {
  startDate: number;
  endDate: number;
} {
  if (input.endDate < input.startDate) {
    throw new Error("Invalid date range");
  }

  const start = new Date(input.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(input.endDate);
  end.setHours(23, 59, 59, 999);

  const startDate = start.getTime();
  const endDate = end.getTime();

  return { startDate, endDate };
}
