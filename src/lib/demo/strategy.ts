import type { StrategyToolPersisted, Thesis } from "@/lib/finance/strategy";

const DEMO_THESES: Thesis[] = [
  {
    id: "demo-strat-ai",
    title: "AI Infrastructure Play",
    assetClass: "Equity",
    thesis:
      "Hyperscaler capex on AI compute will sustain above-trend revenue growth for semiconductor and cloud infrastructure companies through 2027.",
    status: "active",
    scenarios: [
      {
        id: "demo-strat-ai-bull",
        outcome: "bull",
        probability: 0.25,
        expectedReturn: 0.35,
        timeHorizonMonths: 24,
        notes: "AI adoption exceeds expectations, multiple expansion",
      },
      {
        id: "demo-strat-ai-base",
        outcome: "base",
        probability: 0.55,
        expectedReturn: 0.15,
        timeHorizonMonths: 24,
        notes: "Steady growth, in-line with consensus estimates",
      },
      {
        id: "demo-strat-ai-bear",
        outcome: "bear",
        probability: 0.2,
        expectedReturn: -0.1,
        timeHorizonMonths: 24,
        notes: "Capex pullback, margin compression",
      },
    ],
    risks: [
      {
        id: "demo-strat-ai-r1",
        name: "Valuation stretch",
        level: "high",
        mitigation: "Position sizing capped at 8% of portfolio",
        notes: "",
      },
      {
        id: "demo-strat-ai-r2",
        name: "Regulatory risk",
        level: "medium",
        mitigation: "Diversify across US and Asia exposure",
        notes: "EU AI Act could impact European names",
      },
      {
        id: "demo-strat-ai-r3",
        name: "Concentration risk",
        level: "medium",
        mitigation: "Spread across ETF + individual names",
        notes: "",
      },
    ],
    notes: "Review quarterly. Exit if capex growth decelerates two consecutive quarters.",
    createdAt: "2025-10-15T08:00:00.000Z",
    updatedAt: "2026-01-20T10:30:00.000Z",
  },
  {
    id: "demo-strat-em",
    title: "Emerging Market Bonds",
    assetClass: "Fixed Income",
    thesis:
      "USD-denominated EM sovereign bonds offer attractive yield pickup vs. US Treasuries with manageable default risk given improving fiscal positions.",
    status: "idea",
    scenarios: [
      {
        id: "demo-strat-em-bull",
        outcome: "bull",
        probability: 0.2,
        expectedReturn: 0.12,
        timeHorizonMonths: 18,
        notes: "USD weakens, EM spreads tighten",
      },
      {
        id: "demo-strat-em-base",
        outcome: "base",
        probability: 0.6,
        expectedReturn: 0.065,
        timeHorizonMonths: 18,
        notes: "Carry income, flat spreads",
      },
      {
        id: "demo-strat-em-bear",
        outcome: "bear",
        probability: 0.2,
        expectedReturn: -0.05,
        timeHorizonMonths: 18,
        notes: "Risk-off event, spread blowout",
      },
    ],
    risks: [
      {
        id: "demo-strat-em-r1",
        name: "Currency crisis",
        level: "high",
        mitigation: "Limit to investment-grade sovereign issuers",
        notes: "",
      },
      {
        id: "demo-strat-em-r2",
        name: "Liquidity risk",
        level: "medium",
        mitigation: "Use ETF for easy exit capability",
        notes: "",
      },
    ],
    notes: "Research fund options. Compare iShares vs. VanEck EM bond ETFs.",
    createdAt: "2026-02-01T08:00:00.000Z",
    updatedAt: "2026-02-01T08:00:00.000Z",
  },
  {
    id: "demo-strat-solar",
    title: "Solar Energy ETF",
    assetClass: "Thematic Equity",
    thesis:
      "Global solar installations are projected to double by 2030. Current sector valuations are depressed after the 2023–2024 correction, offering a compelling entry point.",
    status: "active",
    scenarios: [
      {
        id: "demo-strat-solar-bull",
        outcome: "bull",
        probability: 0.3,
        expectedReturn: 0.28,
        timeHorizonMonths: 36,
        notes: "Policy tailwinds accelerate, margins expand",
      },
      {
        id: "demo-strat-solar-base",
        outcome: "base",
        probability: 0.5,
        expectedReturn: 0.1,
        timeHorizonMonths: 36,
        notes: "Gradual recovery, in-line with install growth",
      },
      {
        id: "demo-strat-solar-bear",
        outcome: "bear",
        probability: 0.2,
        expectedReturn: -0.15,
        timeHorizonMonths: 36,
        notes: "Overcapacity, price war persists",
      },
    ],
    risks: [
      {
        id: "demo-strat-solar-r1",
        name: "Policy reversal",
        level: "medium",
        mitigation: "Monitor legislative calendar, set stop-loss at -20%",
        notes: "",
      },
      {
        id: "demo-strat-solar-r2",
        name: "Technology disruption",
        level: "low",
        mitigation: "ETF diversification across panel manufacturers",
        notes: "Perovskite cells could disrupt silicon incumbents",
      },
    ],
    notes: "Enter via TAN ETF. Dollar-cost average over 3 months.",
    createdAt: "2025-12-01T08:00:00.000Z",
    updatedAt: "2026-03-10T14:00:00.000Z",
  },
  {
    id: "demo-strat-cash",
    title: "Cash Position Review",
    assetClass: "Cash & Equivalents",
    thesis:
      "With short-term rates at 5%, holding excess cash in money market funds provides meaningful yield with zero risk while waiting for better entry points.",
    status: "closed",
    scenarios: [
      {
        id: "demo-strat-cash-base",
        outcome: "base",
        probability: 0.8,
        expectedReturn: 0.05,
        timeHorizonMonths: 6,
        notes: "Collect yield while rates remain elevated",
      },
      {
        id: "demo-strat-cash-bear",
        outcome: "bear",
        probability: 0.2,
        expectedReturn: 0.02,
        timeHorizonMonths: 6,
        notes: "Rate cuts reduce money market yield",
      },
    ],
    risks: [
      {
        id: "demo-strat-cash-r1",
        name: "Inflation erosion",
        level: "low",
        mitigation: "Transition to short-duration bonds when rate cuts begin",
        notes: "",
      },
    ],
    notes: "Closed — rates have begun cutting cycle. Moved proceeds to short-duration bond fund.",
    createdAt: "2025-06-01T08:00:00.000Z",
    updatedAt: "2026-01-15T08:00:00.000Z",
  },
];

export function createStrategyDemoState(): StrategyToolPersisted {
  return {
    theses: DEMO_THESES.map((t) => ({
      ...t,
      scenarios: t.scenarios.map((s) => ({ ...s })),
      risks: t.risks.map((r) => ({ ...r })),
    })),
  };
}
