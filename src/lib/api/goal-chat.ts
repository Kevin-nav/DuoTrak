import { apiClient } from "@/lib/api/client";

export type GoalIntent = "target-date" | "habit" | "milestone";

export type GoalChatTask = {
  name: string;
  description?: string;
  requires_partner_review?: boolean;
  review_sla?: string;
  escalation_policy?: string;
};

export type GoalChatSlotUpdates = {
  intent?: GoalIntent;
  success_definition?: string;
  availability?: string;
  time_budget?: string;
  accountability_mode?: string;
  deadline?: string;
  review_cycle?: string;
  tasks?: GoalChatTask[];
};

export type GoalChatProfilePrompt = {
  prompt_id: string;
  question: string;
};

export type GoalChatProfileState = {
  behavioral_summary: string;
  self_profile_prompts: GoalChatProfilePrompt[];
  answers: Record<string, string>;
  merged_summary: string;
};

export type GoalChatCreateSessionResponse = {
  session_id: string;
  missing_slots: string[];
  required_slots: string[];
  profile: GoalChatProfileState;
};

export type GoalChatTurnResponse = {
  session_id: string;
  missing_slots: string[];
  captured_slots: Record<string, any>;
  next_prompt: string;
  is_ready_to_finalize: boolean;
  profile: GoalChatProfileState;
};

export type GoalChatFinalizeResponse = {
  session_id: string;
  finalized: boolean;
  goal_plan?: Record<string, any>;
  validation_errors: string[];
};

export const createGoalChatSession = async (payload: {
  user_id?: string;
  behavioral_summary?: string;
}): Promise<GoalChatCreateSessionResponse> =>
  apiClient.post<GoalChatCreateSessionResponse>("/api/v1/goal-chat/sessions", payload);

export const sendGoalChatTurn = async (
  sessionId: string,
  payload: {
    message: string;
    slot_updates?: GoalChatSlotUpdates;
    profile_answers?: Record<string, string>;
  },
): Promise<GoalChatTurnResponse> =>
  apiClient.post<GoalChatTurnResponse>(`/api/v1/goal-chat/${sessionId}/turns`, payload);

export const finalizeGoalChat = async (
  sessionId: string,
  payload: { has_partner: boolean },
): Promise<GoalChatFinalizeResponse> =>
  apiClient.post<GoalChatFinalizeResponse>(`/api/v1/goal-chat/${sessionId}/finalize`, payload);
