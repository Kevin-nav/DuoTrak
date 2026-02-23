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

const shouldFallbackToDirectApi = (error: unknown): boolean => {
  const message = (error instanceof Error ? error.message : String(error || "")).toLowerCase();
  return (
    message.includes("internal_api_secret is required for convex -> backend calls") ||
    message.includes("failed to fetch strategic questions: internal_api_secret is required") ||
    message.includes("failed to create goal plan: internal_api_secret is required") ||
    message.includes("request to http://localhost:8000") && message.includes("forbidden") ||
    message.includes("request to https://") && message.includes("forbidden") ||
    message.includes("network error") ||
    message.includes("fetch failed") ||
    message.includes("econnrefused")
  );
};

type GoalCreationActionBoundary = {
  getStrategicQuestionsAction?: (requestData: {
    userId: string;
    wizardData: {
      goalDescription: string;
      motivation: string;
      availability: string[];
      timeCommitment: string;
      accountabilityType: string;
      partnerName?: string | null;
      targetDeadline?: string | null;
      preferredCheckInStyle?: "quick_text" | "photo_recap" | "voice_note";
    };
  }) => Promise<QuestionsResponse>;
  createGoalPlanAction?: (payload: { sessionId: string; userId: string; answers: Record<string, string> }) => Promise<GoalPlanResponse>;
  evaluateGoalPlanAction?: (payload: { plan: DuotrakGoalPlan }) => Promise<void | null>;
};

export const getStrategicQuestionsViaBoundary = async (
  requestData: GoalWizardRequest,
  actionBoundary: GoalCreationActionBoundary = {}
): Promise<QuestionsResponse> => {
  if (isDirectPythonFallbackEnabled() || !actionBoundary.getStrategicQuestionsAction) {
    return getStrategicQuestions(requestData);
  }

  try {
    return await actionBoundary.getStrategicQuestionsAction({
      userId: requestData.user_id,
      wizardData: {
        goalDescription: requestData.wizard_data.goal_description,
        motivation: requestData.wizard_data.motivation,
        availability: requestData.wizard_data.availability,
        timeCommitment: requestData.wizard_data.time_commitment,
        accountabilityType: requestData.wizard_data.accountability_type,
        partnerName: requestData.wizard_data.partner_name ?? null,
        targetDeadline: requestData.wizard_data.target_deadline ?? null,
        preferredCheckInStyle: requestData.wizard_data.preferred_check_in_style,
      },
    });
  } catch (error) {
    if (!shouldFallbackToDirectApi(error)) {
      throw error;
    }
    console.warn("[Goal API] Convex boundary unavailable due missing INTERNAL_API_SECRET, falling back to direct backend call.");
    return getStrategicQuestions(requestData);
  }
};

export const createGoalPlanViaBoundary = async (
  sessionId: string,
  requestData: AnswersSubmissionRequest,
  actionBoundary: GoalCreationActionBoundary = {}
): Promise<GoalPlanResponse> => {
  if (isDirectPythonFallbackEnabled() || !actionBoundary.createGoalPlanAction) {
    return createGoalPlan(sessionId, requestData);
  }

  try {
    return await actionBoundary.createGoalPlanAction({
      sessionId,
      userId: requestData.user_id,
      answers: requestData.answers,
    });
  } catch (error) {
    if (!shouldFallbackToDirectApi(error)) {
      throw error;
    }
    console.warn("[Goal API] Convex boundary unavailable due missing INTERNAL_API_SECRET, falling back to direct backend call.");
    return createGoalPlan(sessionId, requestData);
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
