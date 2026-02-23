import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GoalCreationWizard from "@/components/goal-creation-wizard";
import { apiClient } from "@/lib/api/client";

const pushMock = jest.fn();
const toastMock = jest.fn();
const useActionMock = jest.fn();
const createGoalMock = jest.fn().mockResolvedValue(undefined);
let actionHookCallIndex = 0;

const getQuestionsActionMock = jest.fn().mockResolvedValue({
  sessionId: "session-1",
  userProfileSummary: { archetype: "builder", risk_factors: ["none"] },
  strategicQuestions: [
    {
      question: "What gets in your way most often?",
      questionKey: "obstacle",
      context: "execution",
      suggestedAnswers: ["Time", "Focus"],
    },
  ],
  executionMetadata: { questionGenerationTimeMs: 1234 },
});

const createPlanActionMock = jest.fn().mockResolvedValue({
  sessionId: "session-1",
  goalPlan: {
    title: "Plan",
    description: "Plan desc",
    decisionTrace: [
      "Aligned with your preferred morning routine.",
      "Keeps weekly workload under your target capacity.",
      "Matches your strongest completion window from recent outcomes.",
      "This fourth reason should be hidden.",
    ],
    milestones: [
      {
        title: "Week 1",
        description: "Start",
        tasks: [
          {
            description: "Wake up at 7 AM",
            successMetric: "Checked in by 7:10 AM",
            recommendedCadence: "daily",
            recommendedTimeWindows: ["Mornings (6-9 AM)"],
            consistencyRationale: "Stable timing improves adherence.",
            verificationMode: "time-window",
            verificationModeReason: "Time-bound habit is best validated by check-in timing.",
            verificationConfidence: 0.91,
            timeWindowStart: "06:50",
            timeWindowEnd: "07:10",
            partnerInvolvement: {
              dailyCheckInSuggestion: "Quick ping after wake-up",
              weeklyAnchorReview: "Sunday review",
            },
            proofGuidance: {
              whatCounts: ["Check-in in time window"],
            },
          },
        ],
      },
    ],
    successMetrics: [],
    partnerAccountability: {
      role: "supporter",
      checkInSchedule: "weekly",
      sharedCelebrations: "milestones",
    },
  },
  partnerIntegration: "weekly check-ins",
  personalizationScore: 92,
  executionMetadata: { planGenerationTimeMs: 3456 },
});

const evaluateActionMock = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/api/client", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

jest.mock("@/contexts/UserContext", () => ({
  useUser: () => ({ userDetails: { id: "user-1" } }),
}));

jest.mock("convex/react", () => ({
  useMutation: () => createGoalMock,
  useAction: (...args: unknown[]) => useActionMock(...args),
}));

jest.mock("framer-motion", () => {
  const ReactLocal = require("react");
  const stripMotionProps = (props: Record<string, unknown>) => {
    const {
      whileHover,
      whileTap,
      animate,
      initial,
      exit,
      variants,
      transition,
      ...rest
    } = props;
    return rest;
  };
  const motion = new Proxy(
    {},
    {
      get: (_target, tag) => {
        return ({ children, ...props }: any) =>
          ReactLocal.createElement(tag as string, stripMotionProps(props), children);
      },
    }
  );

  return {
    motion,
    AnimatePresence: ({ children }: any) => ReactLocal.createElement(ReactLocal.Fragment, null, children),
  };
});

describe("GoalCreationWizard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.NEXT_PUBLIC_AI_DIRECT_PYTHON_FALLBACK;
    actionHookCallIndex = 0;

    useActionMock.mockImplementation(() => {
      const actions = [getQuestionsActionMock, createPlanActionMock, evaluateActionMock];
      const selected = actions[actionHookCallIndex % actions.length];
      actionHookCallIndex += 1;
      return selected;
    });
  });

  it("submits goal planning via convex action instead of direct api client", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GoalCreationWizard />
      </QueryClientProvider>
    );

    fireEvent.change(
      screen.getByPlaceholderText(/run a 5k/i),
      { target: { value: "Run a 5k" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByPlaceholderText(/improve my health/i);
    fireEvent.change(
      screen.getByPlaceholderText(/improve my health/i),
      { target: { value: "Get healthier" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText("Mornings (6-9 AM)");
    fireEvent.click(screen.getByText("Mornings (6-9 AM)"));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText("15-30 mins daily");
    fireEvent.click(screen.getByText("15-30 mins daily"));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText(/visual proof/i);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(getQuestionsActionMock).toHaveBeenCalledTimes(1);
    });

    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it("renders AI verification mode guidance in review step", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GoalCreationWizard />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/run a 5k/i), { target: { value: "Run a 5k" } });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByPlaceholderText(/improve my health/i);
    fireEvent.change(screen.getByPlaceholderText(/improve my health/i), { target: { value: "Get healthier" } });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText("Mornings (6-9 AM)");
    fireEvent.click(screen.getByText("Mornings (6-9 AM)"));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText("15-30 mins daily");
    fireEvent.click(screen.getByText("15-30 mins daily"));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText(/visual proof/i);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText(/what gets in your way most often/i);
    fireEvent.click(screen.getByLabelText("Time"));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText(/verification mode:/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/time-window rule:/i)).toBeInTheDocument();
  });

  it("shows concise why-this-recommendation reasons capped at three", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GoalCreationWizard />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/run a 5k/i), { target: { value: "Run a 5k" } });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByPlaceholderText(/improve my health/i);
    fireEvent.change(screen.getByPlaceholderText(/improve my health/i), { target: { value: "Get healthier" } });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText("Mornings (6-9 AM)");
    fireEvent.click(screen.getByText("Mornings (6-9 AM)"));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText("15-30 mins daily");
    fireEvent.click(screen.getByText("15-30 mins daily"));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText(/visual proof/i);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText(/what gets in your way most often/i);
    fireEvent.click(screen.getByLabelText("Time"));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    const toggle = await screen.findByRole("button", { name: /why this recommendation/i });
    fireEvent.click(toggle);

    expect(screen.getByText(/aligned with your preferred morning routine/i)).toBeInTheDocument();
    expect(screen.getByText(/keeps weekly workload under your target capacity/i)).toBeInTheDocument();
    expect(screen.getByText(/matches your strongest completion window from recent outcomes/i)).toBeInTheDocument();
    expect(screen.queryByText(/this fourth reason should be hidden/i)).not.toBeInTheDocument();
  });

  it("falls back to direct backend call when Convex action misses INTERNAL_API_SECRET", async () => {
    getQuestionsActionMock.mockRejectedValueOnce(
      new Error("Failed to fetch strategic questions: INTERNAL_API_SECRET is required for Convex -> backend calls.")
    );
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      sessionId: "session-fallback",
      userProfileSummary: { archetype: "builder", riskFactors: ["none"] },
      strategicQuestions: [
        {
          question: "Fallback question?",
          questionKey: "fallback_q",
          context: "fallback",
          suggestedAnswers: ["A", "B"],
        },
      ],
      executionMetadata: { questionGenerationTimeMs: 111 },
    });

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <GoalCreationWizard />
      </QueryClientProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/run a 5k/i), { target: { value: "Run a 5k" } });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByPlaceholderText(/improve my health/i);
    fireEvent.change(screen.getByPlaceholderText(/improve my health/i), { target: { value: "Get healthier" } });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText("Mornings (6-9 AM)");
    fireEvent.click(screen.getByText("Mornings (6-9 AM)"));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText("15-30 mins daily");
    fireEvent.click(screen.getByText("15-30 mins daily"));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await screen.findByText(/visual proof/i);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/v1/goal-creation/questions",
        expect.any(Object)
      );
    });
    expect(await screen.findByText(/fallback question/i)).toBeInTheDocument();
  });
});
