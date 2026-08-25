import type { StatementToolPersisted } from "@/lib/storage/statement-store";
import type { CategoryRule, StatementTransaction } from "@/lib/finance/statement";

const DEMO_RULES: CategoryRule[] = [
  { id: "demo-rule-1", pattern: "starbucks", category: "dining" },
  { id: "demo-rule-2", pattern: "salary", category: "income" },
  { id: "demo-rule-3", pattern: "7-eleven", category: "groceries" },
  { id: "demo-rule-4", pattern: "grab", category: "transport" },
];

const DEMO_TRANSACTIONS: StatementTransaction[] = [
  { id: "demo-tx-01", date: "2026-07-01", description: "Monthly salary — ACME Ltd", amount: 45000, category: "income" },
  { id: "demo-tx-02", date: "2026-07-02", description: "7-ELEVEN Sukhumvit 12", amount: -186, category: "groceries" },
  { id: "demo-tx-03", date: "2026-07-03", description: "GRAB BIKE to office", amount: -75, category: "transport" },
  { id: "demo-tx-04", date: "2026-07-05", description: "Starbucks CentralWorld", amount: -245, category: "dining" },
  { id: "demo-tx-05", date: "2026-07-08", description: "Electricity bill MEA", amount: -1240.5, category: "bills" },
  { id: "demo-tx-06", date: "2026-07-10", description: "Village Health checkup", amount: -1800, category: "health" },
  { id: "demo-tx-07", date: "2026-07-15", description: "Cinema tickets Major", amount: -560, category: "entertainment" },
  { id: "demo-tx-08", date: "2026-07-20", description: "Transfer to savings account", amount: -8000, category: "transfer" },
  { id: "demo-tx-09", date: "2026-08-01", description: "Monthly salary — ACME Ltd", amount: 45000, category: "income" },
  { id: "demo-tx-10", date: "2026-08-03", description: "Big C extra shopping", amount: -2310.75, category: "shopping" },
  { id: "demo-tx-11", date: "2026-08-06", description: "GRAB car to airport", amount: -410, category: "transport" },
  { id: "demo-tx-12", date: "2026-08-09", description: "Street food dinner", amount: -160, category: "uncategorized" },
];

export function createStatementDemoState(): StatementToolPersisted {
  return {
    transactions: DEMO_TRANSACTIONS.map((t) => ({ ...t })),
    rules: DEMO_RULES.map((r) => ({ ...r })),
  };
}
