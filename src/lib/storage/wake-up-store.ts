import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { READINESS_QUESTIONS, optionScore } from "@/lib/finance/readiness";

export const WAKE_UP_EXPORT_SCHEMA_VERSION = 1;

export interface WakeUpToolPersisted {
  answers: Record<string, string>;
  completedAt: string | null;
}

interface WakeUpToolActions {
  setAnswer: (questionId: string, optionId: string) => void;
  markCompleted: () => void;
  replaceAll: (data: unknown) => void;
  reset: () => void;
}

export type WakeUpToolStore = WakeUpToolPersisted & WakeUpToolActions;

export const EMPTY_WAKE_UP_STATE: WakeUpToolPersisted = {
  answers: {},
  completedAt: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeAnswers(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const result: Record<string, string> = {};
  for (const question of READINESS_QUESTIONS) {
    const chosen = value[question.id];
    if (
      typeof chosen === "string" &&
      question.options.some((option) => option.id === chosen)
    ) {
      result[question.id] = chosen;
    }
  }
  return result;
}

export function parseWakeUpToolState(value: unknown): WakeUpToolPersisted {
  if (!isRecord(value)) {
    throw new TypeError("wake-up data must be a JSON object");
  }
  return {
    answers: sanitizeAnswers(value.answers),
    completedAt:
      typeof value.completedAt === "string" ? value.completedAt : null,
  };
}

export function isAnswerValid(questionId: string, optionId: string): boolean {
  return optionScore(questionId, optionId) >= 0 &&
    READINESS_QUESTIONS.some(
      (question) =>
        question.id === questionId &&
        question.options.some((option) => option.id === optionId)
    );
}

export const useWakeUpStore = create<WakeUpToolStore>()(
  persist(
    (set) => ({
      ...EMPTY_WAKE_UP_STATE,

      setAnswer: (questionId, optionId) => {
        if (!isAnswerValid(questionId, optionId)) return;
        set((state) => {
          const answers = { ...state.answers, [questionId]: optionId };
          const complete = READINESS_QUESTIONS.every(
            (question) =>
              question.options.some((option) => option.id === answers[question.id])
          );
          return {
            answers,
            completedAt: complete
              ? state.completedAt ?? new Date().toISOString()
              : null,
          };
        });
      },

      markCompleted: () => {
        set({ completedAt: new Date().toISOString() });
      },

      replaceAll: (data) => {
        set(parseWakeUpToolState(data));
      },

      reset: () => {
        set(EMPTY_WAKE_UP_STATE);
      },
    }),
    {
      name: "finplan:wake-up:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
