import { beforeEach, describe, expect, it } from "vitest";
import {
  INSURANCE_EXPORT_SCHEMA_VERSION,
  useInsuranceStore,
  parseInsuranceToolState,
} from "@/lib/storage/insurance-store";

const sampleData = {
  members: [
    { id: "m1", name: "Alice", relationship: "self" },
    { id: "m2", name: "Bob", relationship: "spouse" },
  ],
  policies: [
    {
      id: "p1",
      name: "Term Life",
      type: "life" as const,
      provider: "SafeGuard",
      policyNumber: "L-001",
      premiumAmount: 50,
      premiumFrequency: "monthly" as const,
      sumInsured: 500000,
      deductible: 0,
      startDate: "2022-01-01",
      endDate: "2052-01-01",
      memberIds: ["m1", "m2"],
      notes: "",
    },
  ],
};

describe("insurance store", () => {
  beforeEach(() => {
    localStorage.clear();
    useInsuranceStore.getState().reset();
  });

  it("starts empty with defaults", () => {
    const state = useInsuranceStore.getState();
    expect(state.members).toEqual([]);
    expect(state.policies).toEqual([]);
  });

  it("adds members and generates ids", () => {
    const id = useInsuranceStore
      .getState()
      .addMember({ name: "Alice", relationship: "self" });
    expect(id).toBeTruthy();
    const member = useInsuranceStore.getState().members[0];
    expect(member?.id).toBe(id);
    expect(member?.name).toBe("Alice");
    expect(member?.relationship).toBe("self");
  });

  it("updates and removes members by id", () => {
    const id = useInsuranceStore
      .getState()
      .addMember({ name: "Alice", relationship: "self" });
    useInsuranceStore.getState().updateMember(id, { name: "Bob" });
    expect(useInsuranceStore.getState().members[0]?.name).toBe("Bob");
    useInsuranceStore.getState().removeMember(id);
    expect(useInsuranceStore.getState().members).toEqual([]);
  });

  it("removing a member unassigns from policies", () => {
    const mId = useInsuranceStore
      .getState()
      .addMember({ name: "Alice", relationship: "self" });
    const pId = useInsuranceStore
      .getState()
      .addPolicy({
        name: "Life",
        type: "life",
        provider: "Safe",
        policyNumber: "",
        premiumAmount: 0,
        premiumFrequency: "monthly",
        sumInsured: 100000,
        deductible: 0,
        startDate: "",
        endDate: "",
        memberIds: [mId],
        notes: "",
      });
    useInsuranceStore.getState().removeMember(mId);
    const policy = useInsuranceStore
      .getState()
      .policies.find((p) => p.id === pId);
    expect(policy?.memberIds).toEqual([]);
  });

  it("adds policies and generates ids", () => {
    const id = useInsuranceStore.getState().addPolicy({
      name: "Health",
      type: "health",
      provider: "Blue",
      policyNumber: "",
      premiumAmount: 100,
      premiumFrequency: "monthly",
      sumInsured: 200000,
      deductible: 500,
      startDate: "2024-01-01",
      endDate: "",
      memberIds: [],
      notes: "",
    });
    expect(id).toBeTruthy();
    const policy = useInsuranceStore.getState().policies[0];
    expect(policy?.id).toBe(id);
    expect(policy?.name).toBe("Health");
  });

  it("updates and removes policies by id", () => {
    const id = useInsuranceStore.getState().addPolicy({
      name: "Auto",
      type: "auto",
      provider: "Drive",
      policyNumber: "",
      premiumAmount: 0,
      premiumFrequency: "annual",
      sumInsured: 50000,
      deductible: 0,
      startDate: "",
      endDate: "",
      memberIds: [],
      notes: "",
    });
    useInsuranceStore.getState().updatePolicy(id, { name: "Car" });
    expect(useInsuranceStore.getState().policies[0]?.name).toBe("Car");
    useInsuranceStore.getState().removePolicy(id);
    expect(useInsuranceStore.getState().policies).toEqual([]);
  });

  it("replaceAll replaces state wholesale", () => {
    useInsuranceStore.getState().replaceAll(sampleData);
    expect(useInsuranceStore.getState().members).toHaveLength(2);
    expect(useInsuranceStore.getState().policies).toHaveLength(1);
  });

  it("reset clears everything", () => {
    useInsuranceStore.getState().replaceAll(sampleData);
    useInsuranceStore.getState().reset();
    expect(useInsuranceStore.getState().members).toEqual([]);
    expect(useInsuranceStore.getState().policies).toEqual([]);
  });

  it("exports correct schema version", () => {
    expect(INSURANCE_EXPORT_SCHEMA_VERSION).toBe(1);
  });
});

describe("parseInsuranceToolState", () => {
  it("parses valid data", () => {
    const result = parseInsuranceToolState(sampleData);
    expect(result.members).toHaveLength(2);
    expect(result.policies).toHaveLength(1);
  });

  it("handles empty/missing arrays", () => {
    const result = parseInsuranceToolState({});
    expect(result.members).toEqual([]);
    expect(result.policies).toEqual([]);
  });

  it("rejects non-object input", () => {
    expect(() => parseInsuranceToolState("bad")).toThrow(TypeError);
  });

  it("rejects invalid member fields", () => {
    expect(() =>
      parseInsuranceToolState({
        members: [{ id: 123 }],
      })
    ).toThrow(TypeError);
  });

  it("rejects invalid policy type", () => {
    expect(() =>
      parseInsuranceToolState({
        policies: [
          {
            id: "p1",
            name: "Test",
            type: "invalid",
            provider: "",
            policyNumber: "",
            premiumAmount: 0,
            premiumFrequency: "monthly",
            sumInsured: 0,
            deductible: 0,
            startDate: "",
            endDate: "",
            memberIds: [],
            notes: "",
          },
        ],
      })
    ).toThrow(TypeError);
  });
});
