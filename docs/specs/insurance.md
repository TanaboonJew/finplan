# Spec — Insurance manager (`/insurance`)

Phase 13 · MASTER-PLAN section 6 row 13. Policies list, coverage summary
per family member; coverage-gap checklist as the improvement.

## 1. Purpose

Let a user enter every insurance policy they carry (life, health, auto,
home, disability, etc.), assign each policy to one or more family members,
and instantly see a per-person coverage summary. A coverage-gap checklist
evaluates whether each family member has adequate protection across key
categories and flags missing or underfunded areas.

## 2. Data model

Money is plain major-unit numbers; rates are decimal fractions (0.02 = 2%).
All persisted via Zustand + localStorage.

```ts
type PolicyType =
  | "life"
  | "health"
  | "auto"
  | "home"
  | "disability"
  | "critical-illness"
  | "accident"
  | "travel"
  | "other";

type CoverageFrequency = "monthly" | "annual" | "one-time";

interface FamilyMember {
  id: string;                     // crypto.randomUUID()
  name: string;                   // e.g. "Alice", "Bob"
  relationship: string;           // e.g. "self", "spouse", "child"
}

interface InsurancePolicy {
  id: string;                     // crypto.randomUUID()
  name: string;                   // user label, e.g. "Term Life 30yr"
  type: PolicyType;
  provider: string;               // insurance company name
  policyNumber: string;           // reference number (optional)
  premiumAmount: number;          // >= 0, cost per frequency
  premiumFrequency: CoverageFrequency;
  sumInsured: number;             // >= 0, max payout
  deductible: number;             // >= 0, out-of-pocket before coverage kicks in
  startDate: string;              // ISO date string (YYYY-MM-DD)
  endDate: string;                // ISO date string (YYYY-MM-DD), or "" for open-ended
  memberIds: string[];            // assigned family member IDs
  notes: string;
}

interface InsuranceToolPersisted {
  members: FamilyMember[];
  policies: InsurancePolicy[];
}

// Derived types (not persisted)
interface MemberCoverage {
  memberId: string;
  memberName: string;
  relationship: string;
  policies: InsurancePolicy[];
  totalSumInsured: number;
  totalAnnualPremium: number;
}

interface CoverageGap {
  category: PolicyType;
  recommended: boolean;
  hasCoverage: boolean;
  totalSumInsured: number;
  policyCount: number;
}
```

Derived values (coverage summary, gap analysis) are recomputed on render via
pure functions and never persisted.

## 3. Pure math — `src/lib/finance/insurance.ts`

All pure, no React, Vitest-covered.

```ts
function annualPremium(
  amount: number,
  frequency: CoverageFrequency
): number;

function summarizeMemberCoverage(
  members: readonly FamilyMember[],
  policies: readonly InsurancePolicy[]
): MemberCoverage[];

function buildCoverageGaps(
  members: readonly FamilyMember[],
  policies: readonly InsurancePolicy[]
): CoverageGap[];

function totalAnnualPremiums(policies: readonly InsurancePolicy[]): number;
```

Key behavior:
- `annualPremium`: converts premium to annual cost. monthly → ×12, annual
  → as-is, one-time → 0 (considered sunk cost, not recurring).
- `summarizeMemberCoverage`: for each member, collect assigned policies,
  compute totalSumInsured and totalAnnualPremium. Members with no policies
  still appear with zeroes.
- `buildCoverageGaps`: for each policy type that exists in the policies list
  OR is in a predefined checklist of common types (life, health, auto, home,
  disability), flag whether the member has at least one active policy of
  that type. A policy is "active" if its endDate is empty or in the future.
  Result sorted by type name.
- `totalAnnualPremiums`: sum of all annual premiums across all policies.
- Edge cases: zero members → empty arrays; zero policies → all gaps uncovered.

## 4. Store — `src/lib/storage/insurance-store.ts`

- Zustand + `persist`, key `finplan:insurance:v1`, `version: 1`.
- Actions: `addMember`, `updateMember`, `removeMember`, `addPolicy`,
  `updatePolicy`, `removePolicy`, `replaceAll(data)`, `reset()`.
- Persisted slice holds only the data above — no functions/Dates/Maps.
- IDs via `crypto.randomUUID()`.
- Export schema version constant: `INSURANCE_EXPORT_SCHEMA_VERSION = 1`.
- `parseInsuranceToolState(value: unknown): InsuranceToolPersisted` sanitizer
  for imports (validates all fields, rejects bad data).

## 5. UI layout

Single page, mobile-first, max-w ~6xl, stacked sections:

1. **Toolbar** — SeedDemoButton, ExportImportButtons, reset.
2. **Summary stats** — 4 StatCards: total policies, total annual premiums,
   family members count, policies per member (average).
3. **Members editor** — list of family members with add/edit/delete;
   inline form for name + relationship. Empty state when no members.
4. **Policies editor** — one policy form (collapsible) per policy with all
   fields; multi-select for member assignment; inline add/edit; delete with
   confirm. Empty state when no policies.
5. **Coverage summary table** — rows = family members, columns = policy
   types; cells show sum insured or dash. Footer row shows totals.
6. **Coverage-gap checklist** — for each policy type, show a check/cross
   icon and summary text ("2 policies, $500k coverage" or "No coverage").
   Highlight missing critical categories (life, health, disability).

Hydration: persisted store hydrates after mount; the tool renders a skeleton
until `mounted` to avoid SSR mismatch.

Validation: member name required; policy name required; premiumAmount >= 0;
sumInsured >= 0; deductible >= 0; at least one member must exist before
adding policies; memberIds must reference existing members.

## 6. Demo seed — `src/lib/demo/insurance.ts`

Returns a complete `InsuranceToolPersisted` with:
- 3 members: self (adult), spouse (adult), child
- 4 policies: term life (assigned to self + spouse), health insurance
  (all 3), auto (self only), home/property (self + spouse)
- Realistic premiums, sum insured amounts, providers, and dates.

## 7. Export / import

Envelope via `createExportEnvelope("insurance", 1, data)`; filename
`finplan-insurance-YYYY-MM-DD.json`. Import validates
`readExportEnvelope(value, "insurance")` + `schemaVersion === 1`,
sanitizes fields, replaces state wholesale. Invalid imports raise the
shared import error.

## 8. i18n

All strings under top-level `"insurance"` namespace in `en.json` / `th.json`.
Hyphenated key name matches the tool slug. Reuses `shared.*` keys for
seed/export/import buttons.

## 9. Tests

- Finance math: `annualPremium` with all three frequencies and edge cases;
  `summarizeMemberCoverage` with multiple members/policies, unassigned
  policies, members with no policies; `buildCoverageGaps` covering present
  and missing types, inactive policies excluded; `totalAnnualPremiums` basic.
- Store: initial state, CRUD round-trips, replaceAll/reset, persistence.
- Seed: valid against `summarizeMemberCoverage`, realistic shapes, all
  members have at least one policy.

## 10. Out of scope

Premium payment tracking (dates paid), claim filing, policy renewal
reminders, premium comparison between providers, integration with
financial planning tools (timeline, retirement).
