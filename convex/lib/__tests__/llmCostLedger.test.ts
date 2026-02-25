import { aggregateGoalCost } from "../../llmCostLedger";

describe("aggregateGoalCost", () => {
  it("aggregates total cost per goal", () => {
    const total = aggregateGoalCost([
      { goalId: "g1", costUsd: 0.02 },
      { goalId: "g1", costUsd: 0.03 },
      { goalId: "g2", costUsd: 0.1 },
    ]);
    expect(total.g1).toBeCloseTo(0.05, 5);
    expect(total.g2).toBeCloseTo(0.1, 5);
  });
});

