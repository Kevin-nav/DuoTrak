// src/lib/api/goals.ts
import { apiClient } from "./client";
import { 
  GoalRead, 
  GoalCreate, 
  GoalUpdate, 
  GoalSuggestionRequest, 
  GoalSuggestionResponse,
  GoalWizardRequest,
  QuestionsResponse,
  AnswersSubmissionRequest,
  GoalPlanResponse
} from "@/schemas/goal";
import { toCamelCase, toSnakeCase } from '@/lib/utils';

export const getGoals = async (): Promise<GoalRead[]> => {
  try {
    const response = await apiClient.get<GoalRead[]>("/api/v1/goals/");
    return toCamelCase(response);
  } catch (error) {
    console.error("Error fetching goals:", error);
    throw error;
  }
};

export const getGoalById = async (goalId: string): Promise<GoalRead> => {
  try {
    const response = await apiClient.get<GoalRead>(`/api/v1/goals/${goalId}`);
    return toCamelCase(response);
  } catch (error) {
    console.error(`Error fetching goal ${goalId}:`, error);
    throw error;
  }
};

export const createGoal = async (goalData: GoalCreate): Promise<GoalRead> => {
  try {
    const response = await apiClient.post<GoalRead>("/api/v1/goals/", toSnakeCase(goalData));
    return toCamelCase(response);
  } catch (error) {
    console.error("Error creating goal:", error);
    throw error;
  }
};

export const updateGoal = async (goalId: string, goalData: GoalUpdate): Promise<GoalRead> => {
  try {
    const response = await apiClient.put<GoalRead>(`/api/v1/goals/${goalId}`, toSnakeCase(goalData));
    return toCamelCase(response);
  } catch (error) {
    console.error(`Error updating goal ${goalId}:`, error);
    throw error;
  }
};

export const archiveGoal = async (goalId: string): Promise<void> => {
  try {
    await apiClient.post<void>(`/api/v1/goals/${goalId}/archive`, {});
  } catch (error) {
    console.error(`Error archiving goal ${goalId}:`, error);
    throw error;
  }
};

export const suggestTasks = async (data: GoalSuggestionRequest): Promise<GoalSuggestionResponse> => {
  try {
    const response = await apiClient.post<GoalSuggestionResponse>('/api/v1/goals/suggest-tasks', toSnakeCase(data));
    return toCamelCase(response);
  } catch (error) {
    console.error("Error suggesting tasks:", error);
    throw error;
  }
};

export const duplicateGoal = async (goalId: string): Promise<GoalRead> => {
  try {
    const response = await apiClient.post<GoalRead>(`/api/v1/goals/${goalId}/duplicate`, {});
    return toCamelCase(response);
  } catch (error) {
    console.error(`Error duplicating goal ${goalId}:`, error);
    throw error;
  }
};

export const getOnboardingPlan = async (data: any): Promise<GoalSuggestionResponse> => {
  try {
    const response = await apiClient.post<GoalSuggestionResponse>('/api/v1/goals/onboarding-plan', toSnakeCase(data));
    return toCamelCase(response);
  } catch (error) {
    console.error("Error getting onboarding plan:", error);
    throw error;
  }
};

// V3 Agentic Workflow Functions
export const getStrategicQuestions = async (requestData: GoalWizardRequest): Promise<QuestionsResponse> => {
  try {
    const response = await apiClient.post<QuestionsResponse>('/api/v1/goal-creation/questions', toSnakeCase(requestData));
    return toCamelCase(response);
  } catch (error) {
    console.error("Error getting strategic questions:", error);
    throw error;
  }
};

export const createGoalPlan = async (sessionId: string, requestData: AnswersSubmissionRequest): Promise<GoalPlanResponse> => {
  try {
    const response = await apiClient.post<GoalPlanResponse>(`/api/v1/goal-creation/${sessionId}/plan`, toSnakeCase(requestData));
    return toCamelCase(response);
  } catch (error) {
    console.error("Error creating goal plan:", error);
    throw error;
  }
};

// Dev-only: Fire-and-forget evaluation
export const evaluateGoalPlan = async (plan: DuotrakGoalPlan): Promise<void> => {
  try {
    await apiClient.post('/api/v1/goal-creation/evaluate-plan', toSnakeCase(plan));
    console.log("Evaluation request sent for plan:", plan.title);
  } catch (error) {
    console.error("Error sending evaluation request:", error);
    // We don't rethrow here, as this is a non-critical, dev-only feature
  }
};