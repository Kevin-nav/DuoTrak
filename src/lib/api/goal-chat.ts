import { apiClient } from "@/lib/api/client";

export type GoalChatTask = {
  name: string;
  description?: string;
  requires_partner_review?: boolean;
  review_sla?: string;
  escalation_policy?: string;
};

export type GoalChatProfileState = {
  behavioral_summary: string;
  self_profile_prompts: Array<{ prompt_id: string; question: string }>;
  answers: Record<string, string>;
  merged_summary: string;
};

export type GoalChatSessionResponse = {
  session_id: string;
  missing_slots: string[];
  required_slots: string[];
  profile: GoalChatProfileState;
};

export type GoalChatQuestionState = {
  missing_slots: string[];
  captured_slots: Record<string, any>;
  is_ready_to_finalize: boolean;
  profile: GoalChatProfileState;
};

export type GoalChatSummaryResponse = {
  session_id: string;
  ready_for_summary: boolean;
  summary: Record<string, any>;
};

export const createGoalChatSession = async (payload: { user_id?: string; behavioral_summary?: string }) =>
  apiClient.post<GoalChatSessionResponse>("/api/v1/goal-chat/sessions", payload);

export const getGoalChatSummary = async (sessionId: string) =>
  apiClient.post<GoalChatSummaryResponse>(`/api/v1/goal-chat/${sessionId}/summary`);

export const patchGoalChatSummary = async (sessionId: string, summary: Record<string, any>) =>
  apiClient.patch<GoalChatSummaryResponse>(`/api/v1/goal-chat/${sessionId}/summary`, { summary });

export const finalizeGoalChat = async (sessionId: string, hasPartner: boolean) =>
  apiClient.post<{ session_id: string; finalized: boolean; goal_plan?: Record<string, any>; validation_errors: string[] }>(
    `/api/v1/goal-chat/${sessionId}/finalize`,
    { has_partner: hasPartner },
  );

// ── Plan Generation Types ──

export type PlanTask = {
  name: string;
  description: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
  days: string[];
  duration_minutes: number;
  accountability_type: string;
};

export type PlanMilestone = {
  name: string;
  description: string;
  target_week: number;
  progress_weight: number;
  tasks: PlanTask[];
};

export type GeneratedPlan = {
  title: string;
  description: string;
  intent: string;
  accountability_type: string;
  deadline: string | null;
  milestones: PlanMilestone[];
};

export type GeneratePlanResponse = {
  session_id: string;
  plan: GeneratedPlan;
};

export const generateGoalPlan = async (sessionId: string) =>
  apiClient.post<GeneratePlanResponse>(`/api/v1/goal-chat/${sessionId}/generate-plan`);

export async function streamGoalChatTurn(
  sessionId: string,
  payload: { message: string; selected_chip?: string; profile_answers?: Record<string, string> },
  handlers: {
    onToken: (token: string) => void;
    onChips: (chips: string[]) => void;
    onQuestionState: (state: GoalChatQuestionState) => void;
    onReadyForSummary: (ready: boolean) => void;
    onDone?: () => void;
  },
  signal?: AbortSignal,
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const csrf = localStorage.getItem("csrf_token");
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }

  const url = `${baseUrl}/api/v1/goal-chat/${sessionId}/turns/stream`;
  console.log("[GoalChat] streamGoalChatTurn: fetching", url);

  const response = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ message: payload.message, selected_chip: payload.selected_chip, profile_answers: payload.profile_answers || {} }),
    signal,
  });

  console.log("[GoalChat] streamGoalChatTurn: response status", response.status, "ok:", response.ok, "body:", !!response.body);

  if (!response.ok || !response.body) {
    throw new Error(`Streaming failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("[GoalChat] streamGoalChatTurn: stream done");
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      console.log("[GoalChat] streamGoalChatTurn: chunk received, length:", chunk.length);
      buffer += chunk;

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");

        const eventLine = rawEvent.split("\n").find((line) => line.startsWith("event:"));
        const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"));
        if (!eventLine || !dataLine) continue;

        const eventName = eventLine.replace("event:", "").trim();
        const data = JSON.parse(dataLine.replace("data:", "").trim());

        console.log("[GoalChat] SSE event:", eventName);

        if (eventName === "token") handlers.onToken(data.text || "");
        if (eventName === "chips") handlers.onChips(data.chips || []);
        if (eventName === "question_state") handlers.onQuestionState(data);
        if (eventName === "ready_for_summary") handlers.onReadyForSummary(Boolean(data.ready));
        if (eventName === "done") handlers.onDone?.();
      }
    }
  } catch (err) {
    console.error("[GoalChat] streamGoalChatTurn: error", err);
    if (signal?.aborted) return; // user cancelled — not an error
    throw err;
  }
}
