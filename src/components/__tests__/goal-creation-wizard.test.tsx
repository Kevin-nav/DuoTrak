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
    milestones: [],
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
});
