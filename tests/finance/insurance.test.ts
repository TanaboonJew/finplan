import { describe, expect, it } from "vitest";
import {
  annualPremium,
  summarizeMemberCoverage,
  buildCoverageGaps,
  totalAnnualPremiums,
  type FamilyMember,
  type InsurancePolicy,
} from "@/lib/finance/insurance";

const members: FamilyMember[] = [
  { id: "m1", name: "Alice", relationship: "self" },
  { id: "m2", name: "Bob", relationship: "spouse" },
];

const lifePolicy: InsurancePolicy = {
  id: "p1",
  name: "Term Life",
  type: "life",
  provider: "SafeGuard",
  policyNumber: "L-001",
  premiumAmount: 50,
  premiumFrequency: "monthly",
  sumInsured: 500000,
  deductible: 0,
  startDate: "2022-01-01",
  endDate: "2052-01-01",
  memberIds: ["m1", "m2"],
  notes: "",
};

const healthPolicy: InsurancePolicy = {
  id: "p2",
  name: "Health Plus",
  type: "health",
  provider: "BlueShield",
  policyNumber: "H-001",
  premiumAmount: 800,
  premiumFrequency: "annual",
  sumInsured: 1000000,
  deductible: 2000,
  startDate: "2023-01-01",
  endDate: "",
  memberIds: ["m1"],
  notes: "",
};

const autoPolicy: InsurancePolicy = {
  id: "p3",
  name: "Auto Insurance",
  type: "auto",
  provider: "DriveSafe",
  policyNumber: "A-001",
  premiumAmount: 0,
  premiumFrequency: "one-time",
  sumInsured: 50000,
  deductible: 500,
  startDate: "2024-01-01",
  endDate: "",
  memberIds: ["m1"],
  notes: "",
};

describe("annualPremium", () => {
  it("multiplies monthly by 12", () => {
    expect(annualPremium(100, "monthly")).toBe(1200);
  });

  it("returns annual as-is", () => {
    expect(annualPremium(1200, "annual")).toBe(1200);
  });

  it("returns 0 for one-time", () => {
    expect(annualPremium(5000, "one-time")).toBe(0);
  });

  it("handles zero premium", () => {
    expect(annualPremium(0, "monthly")).toBe(0);
  });

  it("rejects negative amount", () => {
    expect(() => annualPremium(-10, "monthly")).toThrow(RangeError);
  });
});

describe("summarizeMemberCoverage", () => {
  it("returns coverage for each member", () => {
    const result = summarizeMemberCoverage(members, [lifePolicy, healthPolicy]);
    expect(result).toHaveLength(2);
    expect(result[0].memberName).toBe("Alice");
    expect(result[1].memberName).toBe("Bob");
  });

  it("computes correct totals for member with multiple policies", () => {
    const result = summarizeMemberCoverage(members, [lifePolicy, healthPolicy]);
    const alice = result.find((r) => r.memberId === "m1")!;
    expect(alice.policies).toHaveLength(2);
    expect(alice.totalSumInsured).toBe(1500000);
    // life: 50*12=600, health: 800
    expect(alice.totalAnnualPremium).toBe(1400);
  });

  it("computes correct totals for member with single policy", () => {
    const result = summarizeMemberCoverage(members, [lifePolicy]);
    const bob = result.find((r) => r.memberId === "m2")!;
    expect(bob.policies).toHaveLength(1);
    expect(bob.totalSumInsured).toBe(500000);
    expect(bob.totalAnnualPremium).toBe(600);
  });

  it("handles member with no policies", () => {
    const result = summarizeMemberCoverage(members, []);
    for (const r of result) {
      expect(r.policies).toHaveLength(0);
      expect(r.totalSumInsured).toBe(0);
      expect(r.totalAnnualPremium).toBe(0);
    }
  });

  it("handles empty members", () => {
    const result = summarizeMemberCoverage([], [lifePolicy]);
    expect(result).toHaveLength(0);
  });

  it("excludes one-time premiums from annual total", () => {
    const result = summarizeMemberCoverage(members, [autoPolicy]);
    const alice = result.find((r) => r.memberId === "m1")!;
    expect(alice.totalAnnualPremium).toBe(0);
  });
});

describe("buildCoverageGaps", () => {
  it("includes all policy types present in policies", () => {
    const gaps = buildCoverageGaps(members, [lifePolicy, healthPolicy, autoPolicy]);
    const categories = gaps.map((g) => g.category);
    expect(categories).toContain("life");
    expect(categories).toContain("health");
    expect(categories).toContain("auto");
  });

  it("marks recommended types correctly", () => {
    const gaps = buildCoverageGaps(members, [lifePolicy]);
    const lifeGap = gaps.find((g) => g.category === "life")!;
    expect(lifeGap.recommended).toBe(true);
    const autoGap = gaps.find((g) => g.category === "auto");
    if (autoGap) {
      expect(autoGap.recommended).toBe(false);
    }
  });

  it("reports coverage correctly", () => {
    const gaps = buildCoverageGaps(members, [lifePolicy]);
    const lifeGap = gaps.find((g) => g.category === "life")!;
    expect(lifeGap.hasCoverage).toBe(true);
    expect(lifeGap.policyCount).toBe(1);
    expect(lifeGap.totalSumInsured).toBe(500000);
  });

  it("reports missing coverage", () => {
    const gaps = buildCoverageGaps(members, []);
    const lifeGap = gaps.find((g) => g.category === "life")!;
    expect(lifeGap).toBeDefined();
    expect(lifeGap.hasCoverage).toBe(false);
    expect(lifeGap.policyCount).toBe(0);
  });

  it("sorts recommended types first", () => {
    const gaps = buildCoverageGaps(members, [
      lifePolicy,
      healthPolicy,
      autoPolicy,
    ]);
    const recommendedIndices = gaps
      .filter((g) => g.recommended)
      .map((g) => gaps.indexOf(g));
    const nonRecommendedIndices = gaps
      .filter((g) => !g.recommended)
      .map((g) => gaps.indexOf(g));
    const maxRecommended = Math.max(...recommendedIndices);
    const minNonRecommended = Math.min(...nonRecommendedIndices);
    expect(maxRecommended).toBeLessThan(minNonRecommended);
  });

  it("excludes expired policies", () => {
    const expiredPolicy: InsurancePolicy = {
      ...lifePolicy,
      endDate: "2020-01-01",
    };
    const gaps = buildCoverageGaps(members, [expiredPolicy]);
    const lifeGap = gaps.find((g) => g.category === "life")!;
    expect(lifeGap.hasCoverage).toBe(false);
  });

  it("includes open-ended policies", () => {
    const openPolicy: InsurancePolicy = {
      ...lifePolicy,
      endDate: "",
    };
    const gaps = buildCoverageGaps(members, [openPolicy]);
    const lifeGap = gaps.find((g) => g.category === "life")!;
    expect(lifeGap.hasCoverage).toBe(true);
  });
});

describe("totalAnnualPremiums", () => {
  it("sums all annual premiums", () => {
    const total = totalAnnualPremiums([lifePolicy, healthPolicy]);
    // life: 50*12=600, health: 800
    expect(total).toBe(1400);
  });

  it("returns 0 for empty array", () => {
    expect(totalAnnualPremiums([])).toBe(0);
  });

  it("ignores one-time premiums", () => {
    expect(totalAnnualPremiums([autoPolicy])).toBe(0);
  });
});
