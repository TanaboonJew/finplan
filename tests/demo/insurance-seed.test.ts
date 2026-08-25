import { describe, expect, it } from "vitest";
import {
  summarizeMemberCoverage,
  totalAnnualPremiums,
} from "@/lib/finance/insurance";
import { createInsuranceDemoState } from "@/lib/demo/insurance";

describe("insurance demo seed", () => {
  it("produces a complete snapshot", () => {
    const snapshot = createInsuranceDemoState();
    expect(snapshot.members.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.policies.length).toBeGreaterThanOrEqual(2);

    for (const member of snapshot.members) {
      expect(member.id).toBeTruthy();
      expect(member.name.length).toBeGreaterThan(0);
      expect(member.relationship.length).toBeGreaterThan(0);
    }

    for (const policy of snapshot.policies) {
      expect(policy.id).toBeTruthy();
      expect(policy.name.length).toBeGreaterThan(0);
      expect(policy.premiumAmount).toBeGreaterThanOrEqual(0);
      expect(policy.sumInsured).toBeGreaterThanOrEqual(0);
      expect(policy.memberIds.length).toBeGreaterThan(0);
    }
  });

  it("has all policies assigned to existing members", () => {
    const snapshot = createInsuranceDemoState();
    const memberIds = new Set(snapshot.members.map((m) => m.id));
    for (const policy of snapshot.policies) {
      for (const mid of policy.memberIds) {
        expect(memberIds.has(mid)).toBe(true);
      }
    }
  });

  it("each member has at least one policy", () => {
    const snapshot = createInsuranceDemoState();
    const coverage = summarizeMemberCoverage(
      snapshot.members,
      snapshot.policies
    );
    for (const c of coverage) {
      expect(c.policies.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("has positive total annual premiums", () => {
    const snapshot = createInsuranceDemoState();
    const total = totalAnnualPremiums(snapshot.policies);
    expect(total).toBeGreaterThan(0);
  });

  it("coverage totals are realistic", () => {
    const snapshot = createInsuranceDemoState();
    const coverage = summarizeMemberCoverage(
      snapshot.members,
      snapshot.policies
    );
    for (const c of coverage) {
      expect(c.totalSumInsured).toBeGreaterThan(0);
      expect(c.totalAnnualPremium).toBeGreaterThan(0);
    }
  });
});
