// src/lib/api/goals.ts
import { apiClient } from "./client";
import { GoalRead } from "@/schemas/goal";

export const getGoals = async (): Promise<GoalRead[]> => {
  try {
    // Replace the direct fetch call with our robust apiClient
    const goals = await apiClient.get<GoalRead[]>("/api/v1/goals/");
    return goals;
  } catch (error) {
    console.error("Error fetching goals:", error);
    // Re-throw the error to be handled by React Query
    throw error;
  }
};
