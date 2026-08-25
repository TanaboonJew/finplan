import type { WakeUpToolPersisted } from "@/lib/storage/wake-up-store";
import { READINESS_QUESTIONS } from "@/lib/finance/readiness";

const DEMO_ANSWERS: Record<string, string> = {
  q1: "b", // emergency fund: some months covered
  q2: "a", // monthly budget: written and followed
  q3: "a", // spending awareness: tracked
  q4: "b", // savings rate: around 10%
  q5: "c", // debt management: minimums only
  q6: "b", // retirement: started, not consistent
  q7: "a", // insurance: reviewed
  q8: "b", // goals: rough targets only
  q9: "c", // automation: partially automated
  q10: "a", // credit health: checked recently
};

export function createWakeUpDemoState(): WakeUpToolPersisted {
  // Sanity: every answer must be a valid option id.
  for (const question of READINESS_QUESTIONS) {
    const chosen = DEMO_ANSWERS[question.id];
    if (
      !question.options.some((option) => option.id === chosen)
    ) {
      throw new Error(`demo answer missing for ${question.id}`);
    }
  }
  return {
    answers: { ...DEMO_ANSWERS },
    completedAt: "2026-08-01T09:00:00.000Z",
  };
}
