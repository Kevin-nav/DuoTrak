// src/lib/api/goals.ts

import { apiFetch } from "./core";
import { GoalRead } from "@/schemas/goal"; // We will create this schema next

export const getGoals = async (): Promise<GoalRead[]> => {
  try {
    const response = await apiFetch("/api/v1/goals/");
    return response;
  } catch (error) {
    console.error("Error fetching goals:", error);
    throw error;
  }
};
