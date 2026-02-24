export type GoalArchetype = "savings" | "marathon" | "daily_habit" | "general";

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

export function validateArchetypeProfile(archetype: GoalArchetype, profile: Record<string, unknown> | null | undefined) {
  const data = profile || {};

  if (archetype === "savings") {
    const targetAmount = toNumber(data.targetAmount);
    const currentAmount = toNumber(data.currentAmount);
    if (!(targetAmount > 0)) return { ok: false, message: "Savings goals need a target amount greater than 0." };
    if (!(currentAmount >= 0)) return { ok: false, message: "Savings goals need a valid current amount." };
    if (currentAmount > targetAmount) return { ok: false, message: "Current amount cannot exceed target amount." };
    return { ok: true };
  }

  if (archetype === "marathon") {
    const targetLongRunKm = toNumber(data.targetLongRunKm);
    const totalWeeks = toNumber(data.totalWeeks);
    if (!(targetLongRunKm > 0)) return { ok: false, message: "Marathon goals need a target long run distance." };
    if (!(totalWeeks > 0)) return { ok: false, message: "Marathon goals need total training weeks greater than 0." };
    return { ok: true };
  }

  if (archetype === "daily_habit") {
    const dailyTarget = toNumber(data.dailyTarget);
    if (!(dailyTarget > 0)) return { ok: false, message: "Daily habit goals need a daily target greater than 0." };
    return { ok: true };
  }

  return { ok: true };
}
