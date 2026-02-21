import { mapGoalFromConvex } from "../goals";

const sampleGoal = {
  _id: "goal_1",
  user_id: "user_1",
  is_habit: true,
  _creationTime: 1700000000000,
  updated_at: 1700000100000,
  tasks: [
    {
      _id: "task_1",
      goal_id: "goal_1",
      _creationTime: 1700000005000,
      updated_at: 1700000105000,
      due_date: 1700000200000,
    },
  ],
};

test("maps convex goal shape to domain goal", () => {
  const result = mapGoalFromConvex(sampleGoal);
  expect(result.id).toBeDefined();
});
