import { assertNonNegative } from "./validation";

export type PolicyType =
  | "life"
  | "health"
  | "auto"
  | "home"
  | "disability"
  | "critical-illness"
  | "accident"
  | "travel"
  | "other";

export type CoverageFrequency = "monthly" | "annual" | "one-time";

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
}

export interface InsurancePolicy {
  id: string;
  name: string;
  type: PolicyType;
  provider: string;
  policyNumber: string;
  premiumAmount: number;
  premiumFrequency: CoverageFrequency;
  sumInsured: number;
  deductible: number;
  startDate: string;
  endDate: string;
  memberIds: string[];
  notes: string;
}

export interface MemberCoverage {
  memberId: string;
  memberName: string;
  relationship: string;
  policies: InsurancePolicy[];
  totalSumInsured: number;
  totalAnnualPremium: number;
}

export interface CoverageGap {
  category: PolicyType;
  recommended: boolean;
  hasCoverage: boolean;
  totalSumInsured: number;
  policyCount: number;
}

export const ALL_POLICY_TYPES: readonly PolicyType[] = [
  "life",
  "health",
  "auto",
  "home",
  "disability",
  "critical-illness",
  "accident",
  "travel",
  "other",
];

export const RECOMMENDED_TYPES: readonly PolicyType[] = [
  "life",
  "health",
  "disability",
];

export function annualPremium(
  amount: number,
  frequency: CoverageFrequency
): number {
  assertNonNegative(amount, "premiumAmount");
  switch (frequency) {
    case "monthly":
      return amount * 12;
    case "annual":
      return amount;
    case "one-time":
      return 0;
  }
}

function isPolicyActive(policy: InsurancePolicy, today: string): boolean {
  if (!policy.endDate) return true;
  return policy.endDate >= today;
}

export function summarizeMemberCoverage(
  members: readonly FamilyMember[],
  policies: readonly InsurancePolicy[]
): MemberCoverage[] {
  return members.map((member) => {
    const memberPolicies = policies.filter((p) =>
      p.memberIds.includes(member.id)
    );
    let totalSumInsured = 0;
    let totalAnnualPremium = 0;
    for (const p of memberPolicies) {
      assertNonNegative(p.sumInsured, "sumInsured");
      totalSumInsured += p.sumInsured;
      totalAnnualPremium += annualPremium(p.premiumAmount, p.premiumFrequency);
    }
    return {
      memberId: member.id,
      memberName: member.name,
      relationship: member.relationship,
      policies: memberPolicies,
      totalSumInsured,
      totalAnnualPremium,
    };
  });
}

export function buildCoverageGaps(
  members: readonly FamilyMember[],
  policies: readonly InsurancePolicy[]
): CoverageGap[] {
  const today = new Date().toISOString().slice(0, 10);
  const activePolicies = policies.filter((p) => isPolicyActive(p, today));

  const typesInUse = new Set<PolicyType>();
  for (const p of activePolicies) {
    typesInUse.add(p.type);
  }

  const allTypes = new Set<PolicyType>(ALL_POLICY_TYPES);
  for (const t of typesInUse) {
    allTypes.add(t);
  }

  const gaps: CoverageGap[] = [];
  for (const category of allTypes) {
    const matching = activePolicies.filter((p) => p.type === category);
    let totalSumInsured = 0;
    for (const p of matching) {
      assertNonNegative(p.sumInsured, "sumInsured");
      totalSumInsured += p.sumInsured;
    }
    gaps.push({
      category,
      recommended: RECOMMENDED_TYPES.includes(category),
      hasCoverage: matching.length > 0,
      totalSumInsured,
      policyCount: matching.length,
    });
  }

  gaps.sort((a, b) => {
    if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
    return a.category.localeCompare(b.category);
  });

  return gaps;
}

export function totalAnnualPremiums(
  policies: readonly InsurancePolicy[]
): number {
  let sum = 0;
  for (const p of policies) {
    assertNonNegative(p.premiumAmount, "premiumAmount");
    sum += annualPremium(p.premiumAmount, p.premiumFrequency);
  }
  return sum;
}
