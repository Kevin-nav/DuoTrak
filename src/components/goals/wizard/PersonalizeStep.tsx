"use client";

import { Sparkles } from "lucide-react";
import { FormLabel } from "@/components/ui/form";

type PersonalizeStepProps = {
  getQuestionsPending: boolean;
  strategicQuestions: any[] | null;
  userProfileSummary: any | null;
  userAnswers: Record<string, string>;
  setUserAnswers: (answers: Record<string, string>) => void;
};

export default function PersonalizeStep({
  getQuestionsPending,
  strategicQuestions,
  userProfileSummary,
  userAnswers,
  setUserAnswers,
}: PersonalizeStepProps) {
  if (getQuestionsPending) {
    return (
      <div className="text-center">
        <Sparkles className="mx-auto h-12 w-12 animate-spin text-primary-blue" />
        <h3 className="mt-4 text-lg font-semibold">Analyzing your goal...</h3>
        <p className="text-stone-gray">Our AI is preparing some questions to personalize your plan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary-blue/20 bg-accent-light-blue p-4 dark:bg-primary-blue/10">
        <h3 className="font-semibold text-charcoal dark:text-gray-100">AI Analysis: Your Profile</h3>
        {userProfileSummary && (
          <>
            <p className="mt-1 text-sm text-stone-gray dark:text-gray-300">
              <strong>Archetype:</strong> {userProfileSummary.archetype}
            </p>
            <p className="text-sm text-stone-gray dark:text-gray-300">
              <strong>Potential Risks:</strong> {userProfileSummary.risk_factors?.join(", ")}
            </p>
          </>
        )}
      </div>

      <div className="space-y-4">
        {strategicQuestions?.map((question: any) => {
          const questionKey = question.question_key ?? question.questionKey;
          const suggestedAnswers = question.suggested_answers ?? question.suggestedAnswers ?? [];
          return (
            <div key={questionKey}>
              <FormLabel>{question.question}</FormLabel>
              <div className="mt-2 space-y-2">
                {suggestedAnswers.map((answer: string) => (
                  <label
                    key={answer}
                    className="flex cursor-pointer items-center rounded-lg border border-cool-gray p-3 hover:border-primary-blue dark:border-gray-600"
                  >
                    <input
                      type="radio"
                      name={questionKey}
                      value={answer}
                      checked={userAnswers[questionKey] === answer}
                      onChange={(event) =>
                        setUserAnswers({
                          ...userAnswers,
                          [questionKey]: event.target.value,
                        })
                      }
                      className="mr-3"
                    />
                    {answer}
                  </label>
                ))}
                <div className="rounded-lg border border-cool-gray p-3 dark:border-gray-600">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-gray dark:text-gray-400">
                    Or write your own
                  </label>
                  <input
                    type="text"
                    value={userAnswers[questionKey] ?? ""}
                    onChange={(event) =>
                      setUserAnswers({
                        ...userAnswers,
                        [questionKey]: event.target.value,
                      })
                    }
                    className="w-full rounded border border-cool-gray bg-white px-3 py-2 text-sm text-charcoal focus:border-primary-blue focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="Type your answer..."
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
