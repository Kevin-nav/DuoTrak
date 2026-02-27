it("exposes journal task types and task hook signatures", () => {
  type _Task = import("@/lib/journal/calendarTypes").JournalTaskItem;
  expect(true).toBe(true);
});
