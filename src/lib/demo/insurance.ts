import type {
  FamilyMember,
  InsurancePolicy,
} from "@/lib/finance/insurance";
import type { InsuranceToolPersisted } from "@/lib/storage/insurance-store";

const DEMO_MEMBERS: FamilyMember[] = [
  { id: "demo-ins-self", name: "Alex", relationship: "self" },
  { id: "demo-ins-spouse", name: "Jordan", relationship: "spouse" },
  { id: "demo-ins-child", name: "Riley", relationship: "child" },
];

const DEMO_POLICIES: InsurancePolicy[] = [
  {
    id: "demo-ins-life",
    name: "Term Life 30yr",
    type: "life",
    provider: "SafeGuard Life",
    policyNumber: "LG-100234",
    premiumAmount: 45,
    premiumFrequency: "monthly",
    sumInsured: 500000,
    deductible: 0,
    startDate: "2022-03-15",
    endDate: "2052-03-15",
    memberIds: ["demo-ins-self", "demo-ins-spouse"],
    notes: "Level term, convertible",
  },
  {
    id: "demo-ins-health",
    name: "Family Health Plus",
    type: "health",
    provider: "BlueShield",
    policyNumber: "HS-90812",
    premiumAmount: 850,
    premiumFrequency: "monthly",
    sumInsured: 1000000,
    deductible: 2000,
    startDate: "2023-01-01",
    endDate: "2025-12-31",
    memberIds: ["demo-ins-self", "demo-ins-spouse", "demo-ins-child"],
    notes: "PPO plan, covers dental and vision",
  },
  {
    id: "demo-ins-auto",
    name: "Auto Insurance",
    type: "auto",
    provider: "DriveSafe Insurance",
    policyNumber: "AU-44521",
    premiumAmount: 1200,
    premiumFrequency: "annual",
    sumInsured: 50000,
    deductible: 500,
    startDate: "2024-06-01",
    endDate: "2025-06-01",
    memberIds: ["demo-ins-self"],
    notes: "Comprehensive + collision, 2022 Honda Civic",
  },
  {
    id: "demo-ins-home",
    name: "Homeowners Insurance",
    type: "home",
    provider: "SafeGuard Life",
    policyNumber: "HM-78301",
    premiumAmount: 1800,
    premiumFrequency: "annual",
    sumInsured: 350000,
    deductible: 1000,
    startDate: "2022-08-10",
    endDate: "",
    memberIds: ["demo-ins-self", "demo-ins-spouse"],
    notes: "Covers dwelling, personal property, and liability",
  },
];

export function createInsuranceDemoState(): InsuranceToolPersisted {
  return {
    members: DEMO_MEMBERS.map((m) => ({ ...m })),
    policies: DEMO_POLICIES.map((p) => ({
      ...p,
      memberIds: [...p.memberIds],
    })),
  };
}
