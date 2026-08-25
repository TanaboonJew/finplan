import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Risk,
  Scenario,
  StrategyToolPersisted,
  Thesis,
} from "@/lib/finance/strategy";

export const STRATEGY_EXPORT_SCHEMA_VERSION = 1;

interface StrategyToolActions {
  addThesis: (thesis: Omit<Thesis, "id" | "createdAt" | "updatedAt">) => string;
  updateThesis: (
    id: string,
    patch: Partial<Omit<Thesis, "id" | "createdAt" | "updatedAt">>
  ) => void;
  removeThesis: (id: string) => void;
  addScenario: (thesisId: string, scenario: Omit<Scenario, "id">) => string;
  updateScenario: (
    thesisId: string,
    scenarioId: string,
    patch: Partial<Omit<Scenario, "id">>
  ) => void;
  removeScenario: (thesisId: string, scenarioId: string) => void;
  addRisk: (thesisId: string, risk: Omit<Risk, "id">) => string;
  updateRisk: (
    thesisId: string,
    riskId: string,
    patch: Partial<Omit<Risk, "id">>
  ) => void;
  removeRisk: (thesisId: string, riskId: string) => void;
  replaceAll: (data: unknown) => void;
  reset: () => void;
}

export type StrategyToolStore = StrategyToolPersisted & StrategyToolActions;

export const EMPTY_STRATEGY_STATE: StrategyToolPersisted = {
  theses: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: Record<string, unknown>, key: string): string {
  const raw = value[key];
  if (typeof raw !== "string") {
    throw new TypeError(`strategy export field "${key}" must be a string`);
  }
  return raw;
}

function requireFinite(
  value: Record<string, unknown>,
  key: string,
  minimum = Number.NEGATIVE_INFINITY
): number {
  const raw = value[key];
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < minimum) {
    throw new TypeError(
      `strategy export field "${key}" must be a finite number >= ${minimum}`
    );
  }
  return raw;
}

const VALID_STATUSES = new Set(["idea", "active", "closed"]);
const VALID_OUTCOMES = new Set(["bull", "base", "bear"]);
const VALID_RISK_LEVELS = new Set(["low", "medium", "high"]);

function parseScenario(row: unknown): Scenario {
  if (!isRecord(row)) throw new TypeError("scenario must be an object");
  const outcome = requireString(row, "outcome");
  if (!VALID_OUTCOMES.has(outcome)) {
    throw new TypeError(`scenario outcome must be one of: bull, base, bear`);
  }
  return {
    id: requireString(row, "id"),
    outcome: outcome as Scenario["outcome"],
    probability: requireFinite(row, "probability", 0),
    expectedReturn: requireFinite(row, "expectedReturn"),
    timeHorizonMonths: requireFinite(row, "timeHorizonMonths", 1),
    notes: typeof row.notes === "string" ? row.notes : "",
  };
}

function parseRisk(row: unknown): Risk {
  if (!isRecord(row)) throw new TypeError("risk must be an object");
  const level = requireString(row, "level");
  if (!VALID_RISK_LEVELS.has(level)) {
    throw new TypeError(`risk level must be one of: low, medium, high`);
  }
  return {
    id: requireString(row, "id"),
    name: requireString(row, "name"),
    level: level as Risk["level"],
    mitigation: typeof row.mitigation === "string" ? row.mitigation : "",
    notes: typeof row.notes === "string" ? row.notes : "",
  };
}

function parseThesis(row: unknown): Thesis {
  if (!isRecord(row)) throw new TypeError("thesis must be an object");
  const status = requireString(row, "status");
  if (!VALID_STATUSES.has(status)) {
    throw new TypeError(`thesis status must be one of: idea, active, closed`);
  }
  return {
    id: requireString(row, "id"),
    title: requireString(row, "title"),
    assetClass: typeof row.assetClass === "string" ? row.assetClass : "",
    thesis: typeof row.thesis === "string" ? row.thesis : "",
    status: status as Thesis["status"],
    scenarios: Array.isArray(row.scenarios)
      ? row.scenarios.map(parseScenario)
      : [],
    risks: Array.isArray(row.risks) ? row.risks.map(parseRisk) : [],
    notes: typeof row.notes === "string" ? row.notes : "",
    createdAt: typeof row.createdAt === "string" ? row.createdAt : "",
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : "",
  };
}

export function parseStrategyToolState(
  value: unknown
): StrategyToolPersisted {
  if (!isRecord(value)) {
    throw new TypeError("strategy data must be a JSON object");
  }
  const theses = Array.isArray(value.theses)
    ? value.theses.map(parseThesis)
    : [];
  return { theses };
}

function newId(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

export const useStrategyStore = create<StrategyToolStore>()(
  persist(
    (set) => ({
      ...EMPTY_STRATEGY_STATE,

      addThesis: (thesis) => {
        const id = newId();
        const ts = nowIso();
        set((state) => ({
          theses: [
            ...state.theses,
            { ...thesis, id, createdAt: ts, updatedAt: ts },
          ],
        }));
        return id;
      },

      updateThesis: (id, patch) =>
        set((state) => ({
          theses: state.theses.map((t) =>
            t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t
          ),
        })),

      removeThesis: (id) =>
        set((state) => ({
          theses: state.theses.filter((t) => t.id !== id),
        })),

      addScenario: (thesisId, scenario) => {
        const id = newId();
        set((state) => ({
          theses: state.theses.map((t) =>
            t.id === thesisId
              ? { ...t, scenarios: [...t.scenarios, { ...scenario, id }] }
              : t
          ),
        }));
        return id;
      },

      updateScenario: (thesisId, scenarioId, patch) =>
        set((state) => ({
          theses: state.theses.map((t) =>
            t.id === thesisId
              ? {
                  ...t,
                  scenarios: t.scenarios.map((s) =>
                    s.id === scenarioId ? { ...s, ...patch } : s
                  ),
                }
              : t
          ),
        })),

      removeScenario: (thesisId, scenarioId) =>
        set((state) => ({
          theses: state.theses.map((t) =>
            t.id === thesisId
              ? {
                  ...t,
                  scenarios: t.scenarios.filter((s) => s.id !== scenarioId),
                }
              : t
          ),
        })),

      addRisk: (thesisId, risk) => {
        const id = newId();
        set((state) => ({
          theses: state.theses.map((t) =>
            t.id === thesisId
              ? { ...t, risks: [...t.risks, { ...risk, id }] }
              : t
          ),
        }));
        return id;
      },

      updateRisk: (thesisId, riskId, patch) =>
        set((state) => ({
          theses: state.theses.map((t) =>
            t.id === thesisId
              ? {
                  ...t,
                  risks: t.risks.map((r) =>
                    r.id === riskId ? { ...r, ...patch } : r
                  ),
                }
              : t
          ),
        })),

      removeRisk: (thesisId, riskId) =>
        set((state) => ({
          theses: state.theses.map((t) =>
            t.id === thesisId
              ? { ...t, risks: t.risks.filter((r) => r.id !== riskId) }
              : t
          ),
        })),

      replaceAll: (data) => {
        set(parseStrategyToolState(data));
      },

      reset: () => {
        set(EMPTY_STRATEGY_STATE);
      },
    }),
    {
      name: "finplan:strategy:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
