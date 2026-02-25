import { getRangeFromPreset, normalizeDateRange } from "@/lib/progress/dateRange";

describe("progress date range utilities", () => {
  it("normalizes start/end to day boundaries", () => {
    const result = normalizeDateRange({
      startDate: new Date("2026-02-01T13:30:00Z").getTime(),
      endDate: new Date("2026-02-05T02:15:00Z").getTime(),
    });

    expect(new Date(result.startDate).getHours()).toBe(0);
    expect(new Date(result.endDate).getHours()).toBe(23);
  });

  it("rejects inverted ranges", () => {
    expect(() => normalizeDateRange({ startDate: 2000, endDate: 1000 })).toThrow("Invalid date range");
  });

  it("returns expected range widths for presets", () => {
    const now = new Date("2026-02-25T14:00:00Z").getTime();
    const sevenDays = getRangeFromPreset("7d", now);
    const thirtyDays = getRangeFromPreset("30d", now);
    const ninetyDays = getRangeFromPreset("90d", now);

    expect(sevenDays.endDate - sevenDays.startDate).toBeLessThan(thirtyDays.endDate - thirtyDays.startDate);
    expect(thirtyDays.endDate - thirtyDays.startDate).toBeLessThan(ninetyDays.endDate - ninetyDays.startDate);
  });
});

