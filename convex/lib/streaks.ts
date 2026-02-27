const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeTimeZone(timeZone?: string): string {
  const candidate = (timeZone || "").trim();
  if (!candidate) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return "UTC";
  }
}

function getLocalDayKey(timestampMs: number, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date(timestampMs));
}

function toUtcDayIndex(dayKey: string): number {
  const [y, m, d] = dayKey.split("-").map(Number);
  if (!y || !m || !d) return 0;
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

function isConsecutiveDay(previousDayKey: string, currentDayKey: string): boolean {
  const prev = toUtcDayIndex(previousDayKey);
  const curr = toUtcDayIndex(currentDayKey);
  return prev > 0 && curr > 0 && curr - prev === 1;
}

function dayDiff(previousDayKey: string, currentDayKey: string): number {
  const prev = toUtcDayIndex(previousDayKey);
  const curr = toUtcDayIndex(currentDayKey);
  if (prev <= 0 || curr <= 0) return Number.POSITIVE_INFINITY;
  return curr - prev;
}

function isGraceAvailable(lastGraceUsedAt?: number): boolean {
  if (!lastGraceUsedAt) return true;
  return Date.now() - lastGraceUsedAt >= 7 * DAY_MS;
}

async function recordSharedPartnershipActivity(
  ctx: any,
  user: any,
  activityAt: number
): Promise<void> {
  if (!user.current_partner_id) return;

  const p1 = await ctx.db
    .query("partnerships")
    .withIndex("by_user1", (q: any) => q.eq("user1_id", user._id))
    .filter((q: any) => q.eq(q.field("status"), "active"))
    .first();
  const p2 = await ctx.db
    .query("partnerships")
    .withIndex("by_user2", (q: any) => q.eq("user2_id", user._id))
    .filter((q: any) => q.eq(q.field("status"), "active"))
    .first();
  const partnership = p1 || p2;
  if (!partnership) return;

  const user1 = await ctx.db.get(partnership.user1_id);
  const user2 = await ctx.db.get(partnership.user2_id);
  if (!user1 || !user2) return;

  const tz1 = normalizeTimeZone(user1.timezone);
  const tz2 = normalizeTimeZone(user2.timezone);
  const today1 = getLocalDayKey(activityAt, tz1);
  const today2 = getLocalDayKey(activityAt, tz2);

  const actorIsUser1 = String(user._id) === String(user1._id);
  const user1Day = actorIsUser1 ? today1 : partnership.user1_last_activity_day_local || user1.last_streak_activity_day;
  const user2Day = actorIsUser1 ? partnership.user2_last_activity_day_local || user2.last_streak_activity_day : today2;

  const patch: Record<string, any> = {
    updated_at: Date.now(),
    last_shared_activity_at: activityAt,
    user1_last_activity_day_local: user1Day,
    user2_last_activity_day_local: user2Day,
  };

  const bothActiveToday = user1Day === today1 && user2Day === today2;
  if (!bothActiveToday) {
    await ctx.db.patch(partnership._id, patch);
    return;
  }

  const cycleKey = `${today1}|${today2}`;
  if (partnership.last_shared_cycle_key === cycleKey) {
    await ctx.db.patch(partnership._id, patch);
    return;
  }

  const prevU1 = partnership.last_shared_user1_day as string | undefined;
  const prevU2 = partnership.last_shared_user2_day as string | undefined;
  const sharedCurrent = Number(partnership.shared_current_streak || 0);
  const sharedLongest = Number(partnership.shared_longest_streak || 0);

  let nextSharedStreak = 1;
  let user1GraceUsedAt = partnership.user1_grace_last_used_at as number | undefined;
  let user2GraceUsedAt = partnership.user2_grace_last_used_at as number | undefined;

  if (prevU1 && prevU2) {
    const gap1 = dayDiff(prevU1, today1);
    const gap2 = dayDiff(prevU2, today2);

    if (gap1 === 1 && gap2 === 1) {
      nextSharedStreak = sharedCurrent + 1;
    } else if (gap1 === 2 && gap2 === 1 && isGraceAvailable(user1GraceUsedAt)) {
      nextSharedStreak = sharedCurrent + 1;
      user1GraceUsedAt = activityAt;
    } else if (gap2 === 2 && gap1 === 1 && isGraceAvailable(user2GraceUsedAt)) {
      nextSharedStreak = sharedCurrent + 1;
      user2GraceUsedAt = activityAt;
    }
  } else if (sharedCurrent > 0) {
    nextSharedStreak = sharedCurrent;
  }

  await ctx.db.patch(partnership._id, {
    ...patch,
    last_shared_cycle_key: cycleKey,
    last_shared_user1_day: today1,
    last_shared_user2_day: today2,
    shared_current_streak: nextSharedStreak,
    shared_longest_streak: Math.max(sharedLongest, nextSharedStreak),
    user1_grace_last_used_at: user1GraceUsedAt,
    user2_grace_last_used_at: user2GraceUsedAt,
  });
}

export async function recordUserActivity(
  ctx: any,
  userId: any,
  activityAt: number = Date.now()
): Promise<void> {
  const user = await ctx.db.get(userId);
  if (!user) return;

  const timeZone = normalizeTimeZone(user.timezone);
  const todayKey = getLocalDayKey(activityAt, timeZone);
  const lastDayKey = user.last_streak_activity_day as string | undefined;
  const currentStreak = Number(user.current_streak || 0);
  const longestStreak = Number(user.longest_streak || 0);

  if (lastDayKey === todayKey) {
    await ctx.db.patch(user._id, {
      last_activity_at: activityAt,
      updated_at: Date.now(),
    });
    return;
  }

  const nextStreak = !lastDayKey
    ? Math.max(1, currentStreak)
    : isConsecutiveDay(lastDayKey, todayKey)
      ? currentStreak + 1
      : 1;

  await ctx.db.patch(user._id, {
    current_streak: nextStreak,
    longest_streak: Math.max(longestStreak, nextStreak),
    last_streak_activity_day: todayKey,
    last_activity_at: activityAt,
    updated_at: Date.now(),
  });

  await recordSharedPartnershipActivity(ctx, user, activityAt);
}

export { getLocalDayKey, normalizeTimeZone };
