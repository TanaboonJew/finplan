import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FamilyMember, InsurancePolicy } from "@/lib/finance/insurance";

export interface InsuranceToolPersisted {
  members: FamilyMember[];
  policies: InsurancePolicy[];
}

export const INSURANCE_EXPORT_SCHEMA_VERSION = 1;

interface InsuranceToolActions {
  addMember: (member: Omit<FamilyMember, "id">) => string;
  updateMember: (
    id: string,
    patch: Partial<Omit<FamilyMember, "id">>
  ) => void;
  removeMember: (id: string) => void;
  addPolicy: (policy: Omit<InsurancePolicy, "id">) => string;
  updatePolicy: (
    id: string,
    patch: Partial<Omit<InsurancePolicy, "id">>
  ) => void;
  removePolicy: (id: string) => void;
  replaceAll: (data: unknown) => void;
  reset: () => void;
}

export type InsuranceToolStore = InsuranceToolPersisted & InsuranceToolActions;

export const EMPTY_INSURANCE_STATE: InsuranceToolPersisted = {
  members: [],
  policies: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: Record<string, unknown>, key: string): string {
  const raw = value[key];
  if (typeof raw !== "string") {
    throw new TypeError(`insurance export field "${key}" must be a string`);
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
      `insurance export field "${key}" must be a finite number >= ${minimum}`
    );
  }
  return raw;
}

function requireStringArray(
  value: Record<string, unknown>,
  key: string
): string[] {
  const raw = value[key];
  if (!Array.isArray(raw)) {
    throw new TypeError(`insurance export field "${key}" must be an array`);
  }
  return raw.filter((item): item is string => typeof item === "string");
}

type FamilyMemberInput = Omit<FamilyMember, "id">;
type InsurancePolicyInput = Omit<InsurancePolicy, "id">;

function parseFamilyMember(row: unknown): FamilyMember {
  if (!isRecord(row)) throw new TypeError("family member must be an object");
  return {
    id: requireString(row, "id"),
    name: requireString(row, "name"),
    relationship: requireString(row, "relationship"),
  };
}

const VALID_POLICY_TYPES = new Set([
  "life",
  "health",
  "auto",
  "home",
  "disability",
  "critical-illness",
  "accident",
  "travel",
  "other",
]);

function parsePolicyType(value: unknown): InsurancePolicy["type"] {
  if (typeof value !== "string" || !VALID_POLICY_TYPES.has(value)) {
    throw new TypeError(
      `insurance policyType must be one of: ${[...VALID_POLICY_TYPES].join(", ")}`
    );
  }
  return value as InsurancePolicy["type"];
}

const VALID_FREQUENCIES = new Set(["monthly", "annual", "one-time"]);

function parseFrequency(value: unknown): InsurancePolicy["premiumFrequency"] {
  if (typeof value !== "string" || !VALID_FREQUENCIES.has(value)) {
    throw new TypeError(
      `insurance premiumFrequency must be one of: ${[...VALID_FREQUENCIES].join(", ")}`
    );
  }
  return value as InsurancePolicy["premiumFrequency"];
}

function parseInsurancePolicy(row: unknown): InsurancePolicy {
  if (!isRecord(row)) throw new TypeError("insurance policy must be an object");
  return {
    id: requireString(row, "id"),
    name: requireString(row, "name"),
    type: parsePolicyType(row.type),
    provider: requireString(row, "provider"),
    policyNumber: typeof row.policyNumber === "string" ? row.policyNumber : "",
    premiumAmount: requireFinite(row, "premiumAmount", 0),
    premiumFrequency: parseFrequency(row.premiumFrequency),
    sumInsured: requireFinite(row, "sumInsured", 0),
    deductible: requireFinite(row, "deductible", 0),
    startDate: typeof row.startDate === "string" ? row.startDate : "",
    endDate: typeof row.endDate === "string" ? row.endDate : "",
    memberIds: requireStringArray(row, "memberIds"),
    notes: typeof row.notes === "string" ? row.notes : "",
  };
}

export function parseInsuranceToolState(
  value: unknown
): InsuranceToolPersisted {
  if (!isRecord(value)) {
    throw new TypeError("insurance data must be a JSON object");
  }
  const members = Array.isArray(value.members)
    ? value.members.map(parseFamilyMember)
    : [];
  const policies = Array.isArray(value.policies)
    ? value.policies.map(parseInsurancePolicy)
    : [];
  return { members, policies };
}

function newId(): string {
  return crypto.randomUUID();
}

export const useInsuranceStore = create<InsuranceToolStore>()(
  persist(
    (set) => ({
      ...EMPTY_INSURANCE_STATE,

      addMember: (member) => {
        const id = newId();
        set((state) => ({
          members: [...state.members, { ...member, id }],
        }));
        return id;
      },

      updateMember: (id, patch) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, ...patch } : m
          ),
        })),

      removeMember: (id) =>
        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
          policies: state.policies.map((p) => ({
            ...p,
            memberIds: p.memberIds.filter((mid) => mid !== id),
          })),
        })),

      addPolicy: (policy) => {
        const id = newId();
        set((state) => ({
          policies: [...state.policies, { ...policy, id }],
        }));
        return id;
      },

      updatePolicy: (id, patch) =>
        set((state) => ({
          policies: state.policies.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        })),

      removePolicy: (id) =>
        set((state) => ({
          policies: state.policies.filter((p) => p.id !== id),
        })),

      replaceAll: (data) => {
        set(parseInsuranceToolState(data));
      },

      reset: () => {
        set(EMPTY_INSURANCE_STATE);
      },
    }),
    {
      name: "finplan:insurance:v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export type { FamilyMemberInput, InsurancePolicyInput };
