// src/lib/api/goals.ts
import { apiClient } from "./client";
import { 
  GoalSuggestionRequest, 
  GoalSuggestionResponse,
  GoalWizardRequest,
  QuestionsResponse,
  AnswersSubmissionRequest,
  GoalPlanResponse,
  DuotrakGoalPlan
} from "@/schemas/goal";
import { toCamelCase, toSnakeCase } from '@/lib/utils';

// Legacy functions for AI endpoints (Hybrid Architecture)
// These still point to the Python FastAPI backend

export const suggestTasks = async (data: GoalSuggestionRequest): Promise<GoalSuggestionResponse> => {
  try {
    const response = await apiClient.post<GoalSuggestionResponse>('/api/v1/goals/suggest-tasks', toSnakeCase(data));
    return toCamelCase(response);
  } catch (error) {
    console.error("Error suggesting tasks:", error);
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

const isDirectPythonFallbackEnabled = () => process.env.NEXT_PUBLIC_AI_DIRECT_PYTHON_FALLBACK === "true";

type GoalCreationActionBoundary = {
  getStrategicQuestionsAction?: (requestData: GoalWizardRequest) => Promise<QuestionsResponse>;
  createGoalPlanAction?: (payload: { sessionId: string; userId: string; answers: Record<string, string> }) => Promise<GoalPlanResponse>;
  evaluateGoalPlanAction?: (payload: { plan: DuotrakGoalPlan }) => Promise<void>;
};

export const getStrategicQuestionsViaBoundary = async (
  requestData: GoalWizardRequest,
  actionBoundary: GoalCreationActionBoundary = {}
): Promise<QuestionsResponse> => {
  if (isDirectPythonFallbackEnabled() || !actionBoundary.getStrategicQuestionsAction) {
    return getStrategicQuestions(requestData);
  }

  return actionBoundary.getStrategicQuestionsAction(requestData);
};

export const createGoalPlanViaBoundary = async (
  sessionId: string,
  requestData: AnswersSubmissionRequest,
  actionBoundary: GoalCreationActionBoundary = {}
): Promise<GoalPlanResponse> => {
  if (isDirectPythonFallbackEnabled() || !actionBoundary.createGoalPlanAction) {
    return createGoalPlan(sessionId, requestData);
  }

  return actionBoundary.createGoalPlanAction({
    sessionId,
    userId: requestData.userId,
    answers: requestData.answers,
  });
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

export const evaluateGoalPlanViaBoundary = async (
  plan: DuotrakGoalPlan,
  actionBoundary: GoalCreationActionBoundary = {}
): Promise<void> => {
  if (isDirectPythonFallbackEnabled() || !actionBoundary.evaluateGoalPlanAction) {
    await evaluateGoalPlan(plan);
    return;
  }

  await actionBoundary.evaluateGoalPlanAction({ plan });
};
