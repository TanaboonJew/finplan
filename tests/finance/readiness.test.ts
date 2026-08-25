import { describe, expect, it } from "vitest";
import {
  READINESS_QUESTIONS,
  answeredCount,
  isQuizComplete,
  maxTotalScore,
  optionScore,
  readinessLevel,
  totalScore,
  weakQuestionIds,
} from "@/lib/finance/readiness";

function allAnswers(optionId: string): Record<string, string> {
  return Object.fromEntries(READINESS_QUESTIONS.map((q) => [q.id, optionId]));
}

describe("readiness questions", () => {
  it("defines exactly ten questions with four options each", () => {
    expect(READINESS_QUESTIONS).toHaveLength(10);
    for (const question of READINESS_QUESTIONS) {
      expect(question.options).toHaveLength(4);
      expect(question.options.map((o) => o.score)).toEqual([3, 2, 1, 0]);
    }
  });
});

describe("optionScore", () => {
  it("returns the score of the chosen option", () => {
    expect(optionScore("q1", "a")).toBe(3);
    expect(optionScore("q1", "d")).toBe(0);
    expect(optionScore("q7", "b")).toBe(2);
  });

  it("returns 0 for unknown question or option ids", () => {
    expect(optionScore("q99", "a")).toBe(0);
    expect(optionScore("q1", "z")).toBe(0);
    expect(optionScore("q1", undefined)).toBe(0);
    expect(optionScore("q1", 42)).toBe(0);
  });
});

describe("maxTotalScore and totalScore", () => {
  it("maxes at the best answer for every question", () => {
    expect(maxTotalScore()).toBe(30);
    expect(totalScore(allAnswers("a"))).toBe(30);
  });

  it("scores zero with empty or all-worst answers", () => {
    expect(totalScore({})).toBe(0);
    expect(totalScore(allAnswers("d"))).toBe(0);
  });

  it("sums mixed answers correctly", () => {
    const answers = { ...allAnswers("b") };
    answers.q5 = "c";
    answers.q9 = "c";
    // eight 2s + two 1s = 18
    expect(totalScore(answers)).toBe(18);
  });

  it("ignores unknown entries in the answers map", () => {
    expect(totalScore({ qX: "a" })).toBe(0);
    expect(answeredCount({ qX: "a" })).toBe(0);
  });
});

describe("readinessLevel bands", () => {
  it("places scores below 25% in getting-started", () => {
    expect(readinessLevel(0).id).toBe("getting-started");
    expect(readinessLevel(6).id).toBe("getting-started");
    // 25% of 30 = 7.5, so 7 still getting-started
    expect(readinessLevel(7).id).toBe("getting-started");
  });

  it("starts building at 8 (>= 25%) up to 17", () => {
    expect(readinessLevel(8).id).toBe("building");
    expect(readinessLevel(17).id).toBe("building");
  });

  it("starts on-track at 18 (60%) and runs to 25 (< 85%)", () => {
    expect(readinessLevel(18).id).toBe("on-track");
    expect(readinessLevel(24).id).toBe("on-track");
    // 85% of 30 = 25.5 → integer scores of 25 are still on-track
    expect(readinessLevel(25).id).toBe("on-track");
  });

  it("marks 26+ as ready and clamps out-of-range values", () => {
    expect(readinessLevel(26).id).toBe("ready");
    expect(readinessLevel(30).id).toBe("ready");
    expect(readinessLevel(45).id).toBe("ready");
    expect(readinessLevel(-5).id).toBe("getting-started");
    expect(readinessLevel(Number.NaN).id).toBe("getting-started");
  });

  it("reports the inclusive lower bound of each band", () => {
    expect(readinessLevel(20)).toMatchObject({ id: "on-track", min: 18 });
    expect(readinessLevel(10)).toMatchObject({ id: "building", min: 8 });
    expect(readinessLevel(27)).toMatchObject({ id: "ready", min: 26 });
  });
});

describe("weakQuestionIds", () => {
  it("flags unanswered, unknown, and low-scored questions in order", () => {
    const answers = { ...allAnswers("a") };
    answers.q2 = "c";
    answers.q4 = "d";
    delete answers.q6;
    expect(weakQuestionIds(answers)).toEqual(["q2", "q4", "q6"]);
  });

  it("returns nothing when every answer is decent", () => {
    expect(weakQuestionIds(allAnswers("b"))).toEqual([]);
  });

  it("treats an entirely empty quiz as fully weak", () => {
    expect(weakQuestionIds({})).toHaveLength(10);
  });
});

describe("isQuizComplete and answeredCount", () => {
  it("tracks progress incrementally", () => {
    const answers: Record<string, string> = {};
    expect(isQuizComplete(answers)).toBe(false);
    expect(answeredCount(answers)).toBe(0);

    answers.q1 = "a";
    expect(answeredCount(answers)).toBe(1);

    Object.assign(answers, { ...allAnswers("b"), ...answers });
    expect(isQuizComplete(answers)).toBe(true);
    expect(answeredCount(answers)).toBe(10);
  });

  it("rejects invalid option values when counting", () => {
    expect(answeredCount({ q1: "not-an-option" })).toBe(0);
  });
});
