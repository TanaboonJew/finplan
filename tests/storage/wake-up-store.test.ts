import { beforeEach, describe, expect, it } from "vitest";
import {
  EMPTY_WAKE_UP_STATE,
  WAKE_UP_EXPORT_SCHEMA_VERSION,
  isAnswerValid,
  parseWakeUpToolState,
  useWakeUpStore,
} from "@/lib/storage/wake-up-store";

describe("wake-up store", () => {
  beforeEach(() => {
    localStorage.clear();
    useWakeUpStore.getState().reset();
  });

  it("starts empty", () => {
    const state = useWakeUpStore.getState();
    expect(state.answers).toEqual({});
    expect(state.completedAt).toBeNull();
  });

  it("accepts valid answers and rejects unknown pairs", () => {
    useWakeUpStore.getState().setAnswer("q1", "a");
    expect(useWakeUpStore.getState().answers).toEqual({ q1: "a" });

    useWakeUpStore.getState().setAnswer("qX", "a");
    useWakeUpStore.getState().setAnswer("q1", "z");
    expect(useWakeUpStore.getState().answers).toEqual({ q1: "a" });
  });

  it("marks completion when the last question is answered", () => {
    const questions = Array.from({ length: 10 }, (_, i) => `q${i + 1}`);
    questions.forEach((qid, index) => {
      useWakeUpStore.getState().setAnswer(qid, index === 0 ? "c" : "b");
    });
    expect(useWakeUpStore.getState().completedAt).not.toBeNull();

    // Changing an answer after completion keeps the original timestamp.
    const first = useWakeUpStore.getState().completedAt;
    useWakeUpStore.getState().setAnswer("q1", "b");
    expect(useWakeUpStore.getState().completedAt).toBe(first);
  });

  it("clears completion when an answer is removed indirectly via reset", () => {
    useWakeUpStore.getState().replaceAll({
      answers: { q1: "a" },
      completedAt: "2026-08-01T00:00:00.000Z",
    });
    useWakeUpStore.getState().reset();
    expect(useWakeUpStore.getState()).toMatchObject(EMPTY_WAKE_UP_STATE);
  });

  it("replaceAll replaces wholesale from valid export data", () => {
    useWakeUpStore.getState().replaceAll({
      answers: { q3: "b", q4: "d" },
      completedAt: null,
    });
    expect(useWakeUpStore.getState().answers).toEqual({ q3: "b", q4: "d" });
  });

  it("persists to localStorage", () => {
    useWakeUpStore.getState().setAnswer("q10", "a");
    const raw = localStorage.getItem("finplan:wake-up:v1");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!).state.answers.q10).toBe("a");
  });

  it("exposes the export schema version", () => {
    expect(WAKE_UP_EXPORT_SCHEMA_VERSION).toBe(1);
  });

  it("validates answer pairs", () => {
    expect(isAnswerValid("q1", "a")).toBe(true);
    expect(isAnswerValid("q1", "nope")).toBe(false);
    expect(isAnswerValid("nope", "a")).toBe(false);
  });
});

describe("parseWakeUpToolState", () => {
  it("drops unknown questions and options instead of throwing", () => {
    const parsed = parseWakeUpToolState({
      answers: { q1: "a", q99: "a", q2: "zz" },
      completedAt: "2026-08-01T00:00:00.000Z",
    });
    expect(parsed.answers).toEqual({ q1: "a" });
    expect(parsed.completedAt).toBe("2026-08-01T00:00:00.000Z");
  });

  it("defaults missing or malformed fields", () => {
    expect(parseWakeUpToolState({})).toMatchObject(EMPTY_WAKE_UP_STATE);
    expect(parseWakeUpToolState({ answers: "bad", completedAt: 5 })).toEqual(
      EMPTY_WAKE_UP_STATE
    );
  });

  it("rejects non-object input", () => {
    expect(() => parseWakeUpToolState("bad")).toThrow(TypeError);
    expect(() => parseWakeUpToolState(null)).toThrow(TypeError);
  });
});
